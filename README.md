# Escola de Governo · Pedro Leopoldo

Site institucional da Escola de Governo de Pedro Leopoldo (EGov-PL) — plataforma de capacitação contínua dos servidores públicos municipais.

## Stack

- **HTML5** estático (sem build)
- **CSS** modular via `@import` (base / components / layout / pages)
- **JavaScript** ES modules (`<script type="module">`)
- **Font Awesome 6.5** (CDN)
- **Google Fonts**: Manrope (sans) + Fraunces (display) como fallbacks para as fontes Aonic / Gagifr da identidade

## Estrutura

```
.
├── index.html              · Página inicial
├── pages/
│   ├── eixos.html          · Eixos e cursos (índice)
│   ├── governanca.html     · Detalhe eixo: Governança e Gestão Pública
│   ├── licitacoes.html     · Detalhe eixo: Licitações e Contratos
│   ├── atendimento.html    · Detalhe eixo: Atendimento ao Cidadão
│   ├── noticias.html       · Notícias e comunicados
│   ├── sobre.html          · Sobre a EGov-PL
│   └── suporte.html        · Contato e suporte
├── assets/
│   ├── css/
│   │   ├── style.css       · Entry — importa todos os módulos
│   │   ├── base/           · _variables (tokens), _reset
│   │   ├── components/     · _buttons, _cards, _breadcrumb, _back-to-top
│   │   ├── layout/         · _header, _hero, _footer, _page-banner
│   │   └── pages/          · _eixos, _noticias, _sobre, _suporte
│   ├── js/
│   │   ├── main.js         · Entry — inicializa módulos
│   │   └── modules/        · counter, fade-in, mobile-menu, scroll-effects, theme-toggle
│   └── img/
│       ├── banner-eixos/   · Banners individuais de cada eixo temático
│       ├── eixos/          · Ícones/ilustrações dos cards de eixo (index)
│       ├── logo-light.png  · Logo para fundos claros
│       ├── logo-dark.png   · Logo para fundos escuros
│       ├── hero-white.png  · Hero background (tema claro)
│       └── hero-dark.png   · Hero background (tema escuro)
├── docs/                   · Documentos institucionais (identidade visual, trilhas)
└── _partials/              · Referência de blocos HTML reutilizáveis (head, header, footer)
```

## Design System

Tokens semânticos em [`assets/css/base/_variables.css`](assets/css/base/_variables.css) com suporte completo a tema claro/escuro via atributo `data-theme` no `<html>`.

**Paleta oficial (EGov-PL):**

| Token | Cor | Uso |
|---|---|---|
| `--brand-primary` | `#3063ad` | Azul institucional |
| `--brand-accent` | `#4dad33` | Verde EGov |
| `--blue-900` | `#161f36` | Azul escuro (superfícies escuras) |
| `--off-white` | `#fafafa` | Fundo base |

**Tipografia:**
- Display: `Gagifr` → `Fraunces` (fallback)
- Sans: `Aonic` → `Manrope` (fallback)

## Convenções

- **Commits**: `<tipo>(<escopo>): <descrição>` · tipos: `feat` `fix` `refactor` `style` `chore` `docs` `content`
- **Branches**: git flow — `main` (produção) / `develop` (integração) / `feature/*` · `fix/*` · `chore/*` · `content/*`
- **Nomes de arquivos**: kebab-case ASCII (sem acentos, sem espaços) — ex.: `governanca-e-gestao-publica.png`
- **CSS**: BEM quando possível (`bloco__elemento--modificador`); tokens semânticos sempre que possível

## Como rodar

Qualquer servidor estático local:

```bash
python -m http.server 8000
# ou
npx serve .
```

Acesse `http://localhost:8000`.

## Versionamento

- `v0.0.1` · Commit inicial
- `v0.1.0` · MVP — primeira versão funcional
- `v0.2.0` · Reorganização estrutural (CSS modular, `pages/`)
- `v0.3.0` · Redesign completo: design system, tema claro/escuro, nova identidade visual
