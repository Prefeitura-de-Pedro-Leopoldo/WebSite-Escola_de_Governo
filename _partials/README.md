# Partials — blocos HTML de referência

Este diretório **não** é carregado em runtime. Serve como fonte-de-verdade dos blocos de markup reutilizados em todas as páginas — use-o ao editar manualmente para garantir consistência entre `index.html` e `pages/*.html`.

Se no futuro o projeto adotar um gerador estático (Eleventy, Astro, Jekyll), estes arquivos podem ser usados como `_includes` diretamente.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `head.html` | Bloco `<head>` padrão: charset, viewport, fonts, font awesome, script anti-flash |
| `header.html` | Header institucional (logo, nav, theme toggle, menu toggle) |
| `footer.html` | Footer com grid 4 colunas |
| `back-to-top.html` | Botão flutuante de voltar ao topo |
| `script-main.html` | Tag `<script type="module">` do entry JS |

## Convenções

- **Paths**: os partials usam paths relativos à **raiz do site** (`assets/`, `index.html`). Ao copiar para `pages/*.html`, prefixar com `../`
- **Tema**: o script anti-flash em `head.html` aplica `data-theme` no `<html>` **antes** do CSS carregar, evitando FOUC
- **Logo**: sempre duas `<img>` (light + dark), alternadas via CSS `[data-theme]`
- **Navegação**: marcar `.active` no link da página atual

## Como sincronizar

Ao alterar um partial, propagar em cada HTML manualmente:

```bash
# Lista todos os arquivos que consomem o padrão
grep -l "theme-toggle" index.html pages/*.html
```

Ou, futuramente, usar ferramenta de templating para automatizar.
