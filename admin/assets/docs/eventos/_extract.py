"""
Extrai dados dos arquivos .xlsx em docs/eventos e gera admin/eventos-data.json.

CAMPOS DISPONIVEIS (mapeados dos 2 arquivos):
  - Nome, Sobrenome, Email, CPF
  - Tipo de ingresso (turma)
  - Data compra (inscricao)
  - Estado de pagamento
  - Check-in (Sim/Nao)
  - Data Check-in (timestamp)
  - Secretaria / Secretaria de Lotacao / Lotacao
  - Matricula, Cargo/Funcao (somente em alguns)

NAO DISPONIVEL nos arquivos:
  - Capacidade / total de vagas oferecidas (so temos quem se inscreveu)
  - Por isso, "taxa de ocupacao" e "vagas disponibilizadas" sao marcadas
    como N/A no JSON e tratadas explicitamente na UI.
"""
import pandas as pd, os, json, re, unicodedata
from collections import Counter

FOLDER = os.path.dirname(os.path.abspath(__file__))
# Sobe ate encontrar a raiz do projeto (que contem a pasta "admin") para
# montar OUT_PATH de forma robusta independente de onde este script vive.
def _find_project_root(start):
    cur = start
    for _ in range(8):
        if os.path.isdir(os.path.join(cur, 'admin')) and os.path.isfile(os.path.join(cur, 'index.html')):
            return cur
        nxt = os.path.dirname(cur)
        if nxt == cur: break
        cur = nxt
    return start
PROJECT_ROOT = _find_project_root(FOLDER)
OUT_PATH = os.path.join(PROJECT_ROOT, 'admin', 'eventos-data.json')
MANUAL_PATH = os.path.join(FOLDER, 'manual.json')

# Linhas adicionadas pelo exportador no rodape (ignorar):
#   "Exportado em DD/MM/AAAA as HHhMM*"
#   "* Horario de Brasilia"
FOOTER_PATTERNS = (
    re.compile(r'^\s*exportado em', re.IGNORECASE),
    re.compile(r'^\s*\*\s*hor', re.IGNORECASE),
)

SECRETARIA_FIELDS = ('secretaria', 'secret�ria', 'lota��o', 'lotacao')

def strip_accents_lower(s):
    if not isinstance(s, str): return ''
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.lower().strip()

# Aliases para typos / variacoes conhecidas (chave: nome canonico apos
# normalizacao -- sem acentos, lowercase). Valor: nome canonico final.
SECRETARIA_ALIASES = {
    'controladoria geraldo municipio': 'Controladoria Geral do Município',
    'controladoria geral do municipio': 'Controladoria Geral do Município',
    'governo': 'Governo',
    'saga': 'Governo',
    'gestao e financas': 'Gestão e Finanças',
    'gestao e administracao': 'Gestão e Finanças',
    'saude': 'Saúde',
    'educacao': 'Educação',
    'desenvolvimento economico': 'Desenvolvimento Econômico',
    'chefia de gabinete': 'Chefia de Gabinete',
    # Adjunta de Transformacao Digital - todas as variacoes
    'transformacao digital': 'Secretaria Adjunta de Transformação Digital',
    'adjunta de transformacao digital': 'Secretaria Adjunta de Transformação Digital',
    'satd': 'Secretaria Adjunta de Transformação Digital',
}

def normalize_secretaria(raw):
    if not isinstance(raw, str): return None
    s = raw.strip().strip('"').strip("'").rstrip('.').rstrip(',')
    if not s: return None
    # remove prefixos comuns - aceita "Secretaria" / "Secretária" (com ou sem acento)
    cleaned = re.sub(r'(?i)^Secret[aá]ri[ao]\s+Municipal\s+(de\s+)?', '', s)
    cleaned = re.sub(r'(?i)^Secret[aá]ri[ao]\s+(adjunta\s+)?(de\s+)?', '', cleaned)
    cleaned = re.sub(r'\s*\([A-Z]{2,}\)\s*$', '', cleaned)  # remove sigla final
    cleaned = cleaned.strip()
    if not cleaned: cleaned = s.strip()
    # capitaliza primeira letra (mantem o restante para nao quebrar nomes proprios)
    cleaned = cleaned[0].upper() + cleaned[1:] if cleaned else cleaned
    # aplica alias se houver match canonico
    key = strip_accents_lower(cleaned)
    return SECRETARIA_ALIASES.get(key, cleaned)

def find_header_row(df):
    for i in range(min(15, len(df))):
        cells = [str(c).lower() for c in df.iloc[i].tolist() if isinstance(c, str)]
        # Formato antigo: contem "Ordem de" + "Check-in"
        # Formato novo: contem "Nome" + "Check-in" (sem "Ordem de")
        has_checkin = any('check-in' in c for c in cells)
        if has_checkin and (any('ordem de' in c for c in cells) or any(c.strip() == 'nome' for c in cells)):
            return i
    return None


def find_meta(df, label_lower):
    """Procura nas primeiras linhas uma celula iniciando com `label_lower` (ex: 'data:', 'local:')."""
    for i in range(min(8, len(df))):
        for j in range(min(4, df.shape[1])):
            v = df.iat[i, j] if i < df.shape[0] and j < df.shape[1] else None
            if isinstance(v, str) and v.strip().lower().startswith(label_lower):
                return v.strip()
    return None

def get_col(body, *keywords):
    """Encontra coluna que contenha qualquer das keywords (case-insensitive).
    Respeita a ordem de prioridade: tenta a primeira keyword em todas as colunas
    antes de tentar a proxima. Isso garante que 'Secretaria' seja escolhida
    antes de 'Lotacao' quando ambas existem (caso da planilha de Fundamentos)."""
    for k in keywords:
        kl = strip_accents_lower(k)
        for c in body.columns:
            if not isinstance(c, str): continue
            if kl in strip_accents_lower(c):
                return c
    return None

def parse_date(s):
    try:
        d = pd.to_datetime(s, errors='coerce')
        return None if pd.isna(d) else d
    except Exception:
        return None

def safe_str(x):
    if x is None or (isinstance(x, float) and pd.isna(x)): return None
    s = str(x).strip()
    return s if s and s.lower() != 'nan' else None

def process_file(path):
    df = pd.read_excel(path, sheet_name=0, header=None)

    # Metadata: titulo na linha 0; "Data:" e "Local:" podem estar em linhas
    # variaveis (formato antigo: linha 2; formato novo: linha 1).
    title = safe_str(df.iat[0, 0]) if df.shape[0] > 0 else None
    raw_dt = find_meta(df, 'data:')
    raw_local = find_meta(df, 'local:')
    # cidade: primeira string nao-rotulo apos a linha do "Data:" (formato novo:
    # "Pedro Leopoldo" em [2,1]; antigo: [4,1]).
    city = None
    for i in range(1, min(7, df.shape[0])):
        v = safe_str(df.iat[i, 1]) if df.shape[1] > 1 else None
        if v and not v.lower().startswith(('local:', 'data:')):
            city = v
            break

    # Cabecalho
    hdr = find_header_row(df)
    if hdr is None:
        return None
    body = df.iloc[hdr+1:].copy().reset_index(drop=True)
    body.columns = df.iloc[hdr].tolist()
    # filtra linhas vazias usando a coluna "Nome" (primeira coluna em ambos formatos)
    body = body[body.iloc[:, 0].notna()]
    # remove linhas de rodape adicionadas pelo exportador
    def _is_footer(v):
        s = str(v) if v is not None else ''
        return any(p.search(s) for p in FOOTER_PATTERNS)
    body = body[~body.iloc[:, 0].apply(_is_footer)]

    # Colunas relevantes
    col_nome = get_col(body, 'Nome')
    col_sobrenome = get_col(body, 'Sobrenome')
    col_email = get_col(body, 'Email')
    col_cpf = get_col(body, 'CPF')
    col_tipo = get_col(body, 'Tipo de ingresso')
    col_data_compra = get_col(body, 'Data compra')
    col_pagamento = get_col(body, 'Estado de pagamento')
    col_checkin = get_col(body, 'Check-in')
    col_data_checkin = get_col(body, 'Data Check-in')
    col_secretaria = get_col(body, 'Secretaria de Lota', 'Secretaria', 'Lota')
    col_cargo = get_col(body, 'Cargo')
    col_matricula = get_col(body, 'Matr')

    # Participantes (lista detalhada para tela de certificados)
    participantes = []
    timeline_inscricoes = Counter()
    timeline_checkins = Counter()
    turmas_counter = Counter()
    turmas_presentes = Counter()
    sec_counter = Counter()
    sec_presentes = Counter()
    total_aprovado = 0
    total_presentes = 0

    for _, r in body.iterrows():
        nome = safe_str(r.get(col_nome)) if col_nome else None
        sobrenome = safe_str(r.get(col_sobrenome)) if col_sobrenome else None
        nome_completo = ' '.join([p for p in [nome, sobrenome] if p]) or '(sem nome)'
        email = safe_str(r.get(col_email)) if col_email else None
        tipo = safe_str(r.get(col_tipo)) if col_tipo else None
        pagamento = safe_str(r.get(col_pagamento)) if col_pagamento else None
        checkin_raw = safe_str(r.get(col_checkin)) if col_checkin else None
        presente = bool(checkin_raw and checkin_raw.lower() == 'sim')
        data_checkin = parse_date(r.get(col_data_checkin)) if col_data_checkin else None
        data_compra = parse_date(r.get(col_data_compra)) if col_data_compra else None
        sec_raw = safe_str(r.get(col_secretaria)) if col_secretaria else None
        secretaria = normalize_secretaria(sec_raw) if sec_raw else None
        cargo = safe_str(r.get(col_cargo)) if col_cargo else None
        matricula = safe_str(r.get(col_matricula)) if col_matricula else None

        # Quando nao ha coluna "Estado de pagamento" no arquivo (formato novo),
        # consideramos todos como aprovados, ja que so participantes confirmados
        # constam na lista.
        if col_pagamento is None:
            aprovado = True
        else:
            aprovado = (pagamento or '').lower() == 'aprovado'
        if aprovado: total_aprovado += 1
        if presente: total_presentes += 1
        if tipo: turmas_counter[tipo] += 1
        if tipo and presente: turmas_presentes[tipo] += 1
        if secretaria: sec_counter[secretaria] += 1
        if secretaria and presente: sec_presentes[secretaria] += 1

        if data_compra:
            timeline_inscricoes[data_compra.strftime('%Y-%m-%d')] += 1
        if data_checkin:
            timeline_checkins[data_checkin.strftime('%Y-%m-%d %H')] += 1

        participantes.append({
            'nome': nome_completo,
            'email': email,
            'turma': tipo,
            'secretaria': secretaria,
            'cargo': cargo,
            'matricula': matricula,
            'pagamento': pagamento,
            'presente': presente,
            'dataCheckin': data_checkin.strftime('%Y-%m-%dT%H:%M:%S') if data_checkin else None,
            'dataInscricao': data_compra.strftime('%Y-%m-%dT%H:%M:%S') if data_compra else None,
        })

    total_inscritos = len(body)
    ausentes = total_inscritos - total_presentes
    taxa_presenca = round(total_presentes / total_inscritos * 100, 1) if total_inscritos else None

    # Data do evento
    m = re.search(r'(\d{2})/(\d{2})/(\d{4})', raw_dt or '')
    iso_date = f'{m.group(3)}-{m.group(2)}-{m.group(1)}' if m else None
    mtime = re.search(r'(\d{1,2}h\d{0,2})', raw_dt or '')
    time_label = mtime.group(1) if mtime else None
    status = 'agendado' if total_inscritos == 0 else 'realizado'

    # Slug para IDs estaveis
    slug_base = strip_accents_lower(title or os.path.basename(path))
    slug = re.sub(r'[^a-z0-9]+', '-', slug_base).strip('-')[:60]

    return {
        'id': slug,
        'title': title or '(sem título)',
        'date': iso_date,
        'dateRaw': raw_dt,
        'time': time_label,
        'local': raw_local,
        'city': city,
        'status': status,
        'totalInscritos': total_inscritos,
        'totalAprovados': total_aprovado,
        'totalPresentes': total_presentes,
        'totalAusentes': ausentes,
        'taxaPresenca': taxa_presenca,
        'turmas': dict(turmas_counter.most_common()),
        'turmasPresentes': dict(turmas_presentes),
        'secretarias': dict(sec_counter.most_common()),
        'secretariasPresentes': dict(sec_presentes),
        'timelineInscricoes': sorted(timeline_inscricoes.items()),
        'timelineCheckins': sorted(timeline_checkins.items()),
        'participantes': participantes,
        'vagas': None,           # preenchido via manual.json se disponível
        'taxaOcupacao': None,    # calculado quando vagas é conhecido
        'fonte': os.path.basename(path),
    }


def aplicar_manual(eventos):
    """Mescla docs/eventos/manual.json: vagas + eventos adicionais."""
    if not os.path.exists(MANUAL_PATH):
        return eventos
    with open(MANUAL_PATH, 'r', encoding='utf-8') as f:
        manual = json.load(f)

    # 1) vagas para eventos existentes (match por título normalizado)
    for rule in manual.get('vagasPorEvento', []):
        matches = [strip_accents_lower(m) for m in rule.get('matches', [])]
        vagas = rule.get('vagas')
        if vagas is None: continue
        for ev in eventos:
            t = strip_accents_lower(ev.get('title', ''))
            if any(m in t or t in m for m in matches):
                ev['vagas'] = vagas
                if ev['totalInscritos'] is not None and vagas:
                    ev['taxaOcupacao'] = round(ev['totalInscritos'] / vagas * 100, 1)
                print(f'  + vagas={vagas} -> {ev["title"][:50]}')

    # 2) eventos adicionais (sem planilha)
    for extra in manual.get('eventosAdicionais', []):
        # garante campos default e calcula derivados
        ev = {
            'id': extra.get('id') or 'extra',
            'title': extra.get('title') or '(sem título)',
            'date': extra.get('date'),
            'dateRaw': extra.get('date', ''),
            'time': extra.get('time') or '',
            'local': extra.get('local') or '',
            'city': extra.get('city') or '',
            'status': extra.get('status') or 'realizado',
            'totalInscritos': extra.get('totalInscritos', 0),
            'totalAprovados': extra.get('totalAprovados', extra.get('totalInscritos', 0)),
            'totalPresentes': extra.get('totalPresentes', 0),
            'totalAusentes': extra.get('totalAusentes',
                                       extra.get('totalInscritos', 0) - extra.get('totalPresentes', 0)),
            'taxaPresenca': None,
            'turmas': extra.get('turmas') or {},
            'turmasPresentes': {},
            'secretarias': extra.get('secretarias') or {},
            'secretariasPresentes': {},
            'timelineInscricoes': [],
            'timelineCheckins': [],
            'participantes': extra.get('participantes', []),
            'vagas': extra.get('vagas'),
            'taxaOcupacao': None,
            'fonte': extra.get('fonte', 'manual.json'),
        }
        if ev['totalInscritos']:
            ev['taxaPresenca'] = round(ev['totalPresentes'] / ev['totalInscritos'] * 100, 1)
        if ev['vagas'] and ev['totalInscritos'] is not None:
            ev['taxaOcupacao'] = round(ev['totalInscritos'] / ev['vagas'] * 100, 1)
        eventos.append(ev)
        print(f'  + evento manual: {ev["title"][:50]}')

    # ordena por data
    eventos.sort(key=lambda e: e.get('date') or '9999')
    return eventos


def main():
    eventos = []
    for f in sorted(os.listdir(FOLDER)):
        if not f.endswith('.xlsx'): continue
        if f.startswith('~$'): continue  # arquivos de lock do Excel
        p = os.path.join(FOLDER, f)
        try:
            ev = process_file(p)
            if ev:
                eventos.append(ev)
                print(f'OK  {f}  ->  {ev["totalInscritos"]} inscritos, {ev["totalPresentes"]} presentes')
        except Exception as e:
            print(f'ERR {f}: {e}')

    # Aplica enriquecimento manual (vagas + eventos extras)
    eventos = aplicar_manual(eventos)

    # Agregados
    tot_insc = sum(e['totalInscritos'] for e in eventos)
    tot_pres = sum(e['totalPresentes'] for e in eventos)
    tot_vagas = sum((e.get('vagas') or 0) for e in eventos)
    all_secs = Counter()
    for e in eventos:
        for k, v in e['secretarias'].items():
            all_secs[k] += v

    out = {
        'geradoEm': pd.Timestamp.now().isoformat(),
        'fonte': 'docs/eventos/*.xlsx',
        'eventos': eventos,
        'resumo': {
            'totalEventos': len(eventos),
            'eventosRealizados': sum(1 for e in eventos if e['status'] == 'realizado'),
            'eventosAgendados': sum(1 for e in eventos if e['status'] == 'agendado'),
            'totalInscritos': tot_insc,
            'totalPresentes': tot_pres,
            'totalAusentes': tot_insc - tot_pres,
            'totalVagas': tot_vagas if tot_vagas else None,
            'taxaPresencaGlobal': round(tot_pres / tot_insc * 100, 1) if tot_insc else None,
            'taxaOcupacaoGlobal': round(tot_insc / tot_vagas * 100, 1) if tot_vagas else None,
            'rankingSecretarias': dict(all_secs.most_common()),
        },
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f'\n>>> Gerado: {OUT_PATH}')
    print(f'    {len(eventos)} eventos | {tot_insc} inscritos | {tot_pres} presentes')


if __name__ == '__main__':
    main()
