# Google Forms para cursos EAD — passo a passo

Este documento descreve como criar os formulários usados pelo site da EGov-PL para
**inscrição** e **entrega de certificado** dos cursos EAD.

> Estratégia adotada (Opção B): a confirmação do Google Forms permanece **genérica**.
> O link de acesso ao curso é mostrado **pelo nosso modal**, dinamicamente, a partir do
> campo `acessoCursoUrl` do `assets/data/cursos.json`. Assim podemos reaproveitar o
> mesmo formulário para vários cursos, ou usar um por curso — a escolha não muda o
> comportamento do site.

---

## 1. Form de inscrição (sem upload, sem login)

1. Acesse <https://forms.google.com> com a conta institucional da EGov-PL.
2. **+ Em branco**.
3. Título: *"Inscrição — Curso EAD"* (ou nome específico do curso).
4. Descrição: orientações breves.
5. Campos sugeridos: Nome completo, CPF, E-mail, Cargo, Secretaria/Lotação.
   - Se for um Form genérico para vários cursos, adicione campo **"Curso desejado"** (lista suspensa).
6. **Configurações** (engrenagem) → **Geral**:
   - Coletar e-mails: **Ativado** (verificado)
   - Limitar a 1 resposta: **Desativado** (servidor não loga com Google)
   - Restringir a usuários da organização: **Desativado**
7. **Apresentação** → **Mensagem de confirmação** (genérica):
   ```
   Inscrição recebida! Esta janela já pode ser fechada — o link
   de acesso ao curso EAD será exibido na página da EGov-PL.
   ```
8. **Enviar** → ícone `<>` (Embed HTML) → copie o `src` do iframe, ex.:
   `https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform?embedded=true`
9. O **`formId`** é o trecho entre `/e/` e `/viewform`.

> ⚠ **Sobre o campo CPF/Telefone com validação:** use **Resposta curta → 3 pontos → Validação de resposta → Expressão regular**.

## 2. Form de entrega de certificado (com upload — abre em nova aba)

> **Importante:** o Google Forms **não permite embed** (`<iframe>`) quando há campo
> de upload de arquivo. A mensagem é: *"Não é possível incorporar este formulário
> porque ele tem perguntas com upload de arquivos."*
> Por isso o botão "Entregar certificado" no site **abre em nova aba** com o link
> direto do Form (campo `certificadoUrl` no JSON, e não `certificadoFormId`).


1. Crie outro Form: *"Entrega de Certificado — Curso EAD"*.
2. Campos: Nome completo, CPF, E-mail institucional, Curso (lista suspensa).
3. **+** → **Upload de arquivo**.
   - Confirme a ativação (exige login Google do servidor).
   - Tipos permitidos: **PDF**
   - Número máximo de arquivos: **1**
   - Tamanho máximo: **10 MB**
4. **Configurações → Geral**:
   - Coletar e-mails: **Ativado**
   - Limitar a 1 resposta: **Ativado**
5. **Permissões dos arquivos enviados (importante):**
   - O Google Forms cria automaticamente uma pasta `Respostas - [Nome do Form]`
     no Drive da conta dona do form.
   - Cada upload é privado: **só a EGov-PL e o próprio remetente** veem o arquivo.
   - O remetente **não consegue excluir** envios de outros servidores.
   - Não é necessário configurar nada extra para garantir esse comportamento.
6. **Pegue a URL completa** (não o embed): no Form, clique em **Enviar** → ícone do
   link (🔗) → marque **"Encurtar URL"** se quiser, ou copie o link
   `https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform`. Essa URL inteira vai
   no campo `certificadoUrl` do JSON.

## 3. Forms padrão (defaults compartilhados)

Os Forms ativos hoje são genéricos e atendem todos os cursos EAD. Ficam em
`assets/data/cursos.json` no nó `formsDefault`:

```json
"formsDefault": {
  "inscricaoFormId": "1FAIpQLSdg_NLb90QdmCNNKdQwFAi2gakIJedTTmSuxkqQJJPmzNqQZQ",
  "certificadoUrl": "https://forms.gle/iRGvfDAc5JPsftF66"
}
```

- Para um novo curso EAD, **não precisa** repetir esses campos no curso —
  são herdados automaticamente.
- Se um curso específico precisar de Form próprio (ex.: inscrição com regras
  diferentes), basta declarar `inscricaoFormId` ou `certificadoUrl` dentro do
  curso e a configuração específica sobrescreve o default.

## 4. Cadastrar um curso EAD no JSON

Exemplo mínimo (usa Forms default):

```json
{
  "id": "curso-exemplo-ead",
  "titulo": "Nome do Curso",
  "mes": "junho",
  "modalidade": "ead",
  "icone": "fas fa-laptop",
  "descricao": "Descrição do curso.",
  "acessoCursoUrl": "https://www.escolavirtual.gov.br/curso/XXXX"
}
```

> Os campos `inscricaoFormId` e `certificadoUrl` são opcionais — se omitidos, o
> renderer pega de `formsDefault`. Sobrescreva apenas em casos especiais.

## 5. Como o site usa esses dados

- **Botão "Inscrever-se"** abre o modal com o iframe do `inscricaoFormId`.
  Após o submit, o site detecta o reload do iframe e troca o conteúdo por um
  card de sucesso com o `acessoCursoUrl`.
- **Botão "Entregar certificado"** abre `certificadoUrl` em **nova aba** (Google
  bloqueia embed de Forms com upload). O aviso sobre permissões dos arquivos fica
  na própria descrição do Form.

## 6. Curso presencial

Cursos com `"modalidade": "presencial"` usam apenas `inscricaoUrl` (link Sympla).
Não é necessário criar nada no Google Forms — o botão abre o Sympla em nova aba.
