/**
 * Filtro de notícias por categoria.
 * - Cada card tem `data-category="..."`
 * - Cada botão de filtro tem `data-filter="..."` (ou "todos")
 * - Classe `.is-active` indica o filtro selecionado
 * - Cards sem match recebem `hidden`
 * - Se nada corresponder, exibe `.noticias-empty`
 */
export function initNoticiasFilter() {
  const filters = document.querySelectorAll('[data-filter]')
  if (filters.length === 0) return

  const cards = document.querySelectorAll('.noticia-card[data-category]')
  const empty = document.querySelector('.noticias-empty')

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter

      filters.forEach((f) => {
        const active = f === btn
        f.classList.toggle('is-active', active)
        f.setAttribute('aria-selected', active ? 'true' : 'false')
      })

      let visibleCount = 0
      cards.forEach((card) => {
        const match = filter === 'todos' || card.dataset.category === filter
        card.hidden = !match
        if (match) visibleCount++
      })

      if (empty) empty.hidden = visibleCount > 0
    })
  })
}
