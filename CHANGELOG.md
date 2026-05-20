# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.7.3] - 2026-05-20

### Corrigido

- `curso-detalhe.js` (página `pages/curso.html`) ainda usava o campo
  legado `inscricaoUrl`, que deixou de existir após a migração v0.6.0
  para `inscricaoAberta` + `link`. Resultado: o botão "Inscrever-se no
  Sympla" sumiu da página de "Saiba mais". Refatorado para usar
  `getStatus` + `descreverLink` de `curso-utils.js` (mesmo padrão dos
  cards do eixo) — suporta Sympla, Forms (modal) e Enap.
- Página de detalhe agora também aciona o modal de Forms para EAD que
  usa formulário Google.

## [0.7.2] - 2026-05-20

### Adicionado

- **Registros do evento Elaboração do Mapa de Gerenciamento de Risco — 2ª turma**:
  8 fotos disponíveis no mural da página do curso.

## [0.7.1] - 2026-05-20

### Adicionado

- **Registros do evento Elaboração do Mapa de Gerenciamento de Risco — 1ª turma**:
  8 fotos disponíveis no mural da página do curso.

## [0.7.0] - 2026-05-20

### Adicionado

- **Pipeline de otimização de imagens** com [sharp](https://sharp.pixelplumbing.com/):
  cada foto adicionada em `assets/img/cursos/<id>/` ganha derivados WebP
  ao lado do original:
  - `flyer.webp` e `carrossel.webp` (avulsos, ~1200–1400px).
  - `fotos/foto-NN.thumb.webp` (~600px, usado no mural).
  - `fotos/foto-NN.webp` (~1600px, usado no lightbox).
  Cache por mtime — só regera quando o original muda. Aula Magna saiu
  de 567 MB para 1,7 MB carregados no mural (redução de **99,7%**).
- **Paginação no feed de notícias**: a página mostra os **3 cards mais
  recentes** e oferece um botão **"Ver mais notícias (N)"** que revela
  os demais. Ao trocar de filtro (Todos / Cursos / etc.), o limite é
  reaplicado sobre a categoria e o contador do botão atualiza.

### Alterado

- Mural e lightbox passam a consumir `thumb` e `full` do `midias.json`
  (com fallback para o original se os derivados ainda não tiverem sido
  gerados).
- `node_modules/` adicionado ao `.gitignore`.

## [0.6.2] - 2026-05-20

### Corrigido

- `noticias-feed.js` declarava `temDataDefinida` localmente e também a
  importava de `curso-utils.js`, causando `SyntaxError: Identifier
  'temDataDefinida' has already been declared`. Como cascata, o
  `initEventosDestaque` quebrava ao tentar montar o Swiper. Removida
  a declaração local — definição central fica em `curso-utils.js`.

## [0.6.1] - 2026-05-20

### Corrigido

- `.vercelignore` deixava de incluir `scripts/`, o que fazia o build na
  Vercel quebrar com `Cannot find module 'scripts/gerar-galerias.mjs'`.
  A pasta `scripts/` é necessária em tempo de build (não em runtime),
  então foi removida do ignore. `admin/` e `docs/` continuam excluídos.

## [0.6.0] - 2026-05-20

### Adicionado

- **Mural de fotos do evento** na página do curso, com carrossel infinito
  em duas linhas (linha 1 → direita, linha 2 → esquerda), lightbox ao
  clicar em qualquer foto, cursor customizado de câmera e setas de
  navegação manual com loop infinito em ambos os sentidos.
- **Auto-detecção de mídias** por pasta do curso: o script
  `scripts/gerar-galerias.mjs` (executado em `npm run build` na Vercel)
  varre `assets/img/cursos/<curso-id>/` e gera
  `assets/data/midias.json` com `flyer.jpg`, `carrossel.jpg` e
  `fotos/*.jpg`. Sem mais paths hardcoded no JSON.
- **Feed de notícias dinâmico** em `pages/noticias.html`: gera um card
  por curso de `cursos.json` com título, ementa e CTA adaptados ao
  status (abertas / convocação / em-breve / realizado).
- **Indicadores da home** auto-atualizados: contagem de eixos e cursos
  via `data-auto` nos `<span class="stat-number">`.
- **Esquema simplificado de cursos**:
  - `inscricaoAberta: true` — mostra botão de inscrição.
  - `convocacao: true` — evento por convocação.
  - `realizado: true` — evento já aconteceu (também inferido pela data).
  - `emBreve: true` — default quando nenhuma flag está marcada.
  - `link: "https://..."` — URL única para Sympla, Forms ou Enap; o
    sistema detecta o tipo automaticamente (Forms → modal embed; demais
    → nova aba).
- **Helpers compartilhados** em `assets/js/modules/curso-utils.js`:
  `getStatus`, `getLinkInscricao`, `descreverLink`, `cursoDate`,
  `isPast`, `temDataDefinida`. Lógica antes duplicada em três módulos.
- **Cursor de câmera** (variante do `custom-cursor.js`) com SVG
  detalhado seguindo a mesma qualidade dos cursores de capelo e
  certificado, com LED piscando e halo azul EGov.
- **Filtro automático por mês corrente** em `noticias.html` e nos cards
  do eixo: cursos de meses futuros ficam ocultos até chegar o mês.
- **Pipeline Vercel** (`vercel.json` + `package.json` + `.vercelignore`):
  `npm run build` executa o gerador de mídias automaticamente em cada
  deploy. `admin/` e `docs/` ficam fora da produção.
- **Registros do evento Aula Magna** — 80 fotos disponíveis no mural.
- **Registros do evento Fundamentos da Gestão Pública (Módulo 1)** —
  10 fotos disponíveis no mural.

### Alterado

- **Estrutura de pastas de imagens** padronizada em kebab-case ASCII:
  `assets/img/cursos/<curso-id>/{flyer.jpg, carrossel.jpg, fotos/foto-NN.jpg}`.
  Nome da pasta = `id` do curso (match determinístico, não mais fuzzy).
- **Ementas dos cursos** atualizadas conforme
  `docs/proposta-trilhas-formativas.xlsx` (Fundamentos da Gestão
  Pública, Ética no Setor Público, Gestão da Inovação presencial/EAD,
  Avaliação de Desempenho, Padronização dos Procedimentos de
  Contratação, Aula Magna).
- **Migração de campos legados** no `cursos.json` (comportamento
  idêntico):
  - `inscricaoUrl` → `inscricaoAberta: true` + `link`.
  - `acessoCursoUrl` → `link` (com `inscricaoAberta` ou `emBreve`).
  - `inscricaoLabel: "Convocação"` → `convocacao: true`.
  - `inscricaoLabel: "Realizado" | "Encerrado"` → `realizado: true`.
  - `inscricaoUrlPendente` → `emBreve: true` + `link`.

### Corrigido

- `isPast(curso)` agora só retorna `true` quando há data concreta
  (`data` ou `dataExtenso`). Antes, cursos com apenas `mes` definido
  podiam ser falsamente classificados como "realizado" durante o
  próprio mês (fallback ao dia 1).
- Link "Saiba mais" em `noticias.html` apontava para `../curso.html`
  (raiz) em vez de `curso.html` (mesmo diretório `/pages/`).
- Auto-scroll do mural travava ao chegar em `scrollLeft = 0` (browser
  proíbe valores negativos). Substituído por wrap manual em JS antes
  da atribuição.
- Conflito entre `scroll-behavior: smooth` (CSS) e o `requestAnimationFrame`
  (JS) causava travamentos. Agora a animação é 100% controlada por rAF
  com sistema de "boost" no clique das setas.

## [0.5.1] e anteriores

Ver histórico de tags no Git: `git tag --sort=-v:refname`.
