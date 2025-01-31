const base_url = window.location.origin

/**
 *
 * @param {Object} data
 * @param {string|null} data.title
 * @param {string} data.content
 * @param {'success'|'error'} data.status
 */
function toast({ title, content, status = 'success' }) {
  const text = `
  <div>
    ${
      status === 'error'
        ? '<i data-lucide="circle-x" class="text-red-500 me-0.5 w-6 h-6 inline"></i>'
        : '<i data-lucide="circle-check" class="text-green-500 me-0.5 w-6 h-6 inline"></i>'
    }

    ${title ? `<b>${title}</b>` : ''}

    ${title ? '<br>' : ''}

    <p class="text-white/60">${content}</p>
  </div>
  `

  Toastify({
    style: {
      background: `hsl(var(--background))`,
      border: 'solid 1px hsl(var(--border))',
      borderRadius: '8px',
      boxShadow: 'none',
      maxWidth: '520px',
      minWidth: '310px',
      width: 'fit-content',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    escapeMarkup: false,
    text: text,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
  }).showToast()

  lucide.createIcons()
}

async function openCart() {
  const cart_html = await fetch('/cart-drawer').then((res) => res.text())

  drawerOpen()

  $('#drawer-content').html(cart_html)
}

function debounce(func, delay) {
  let timer
  return function (...args) {
    const context = this
    clearTimeout(timer)
    timer = setTimeout(() => func.apply(context, args), delay)
  }
}

let selected_category

$('#category-select').on('change', function () {
  selected_category = $(this).val()

  observer.disconnect()

  $('.category-loader').css('display', 'none')

  if (selected_category === 'null') {
    $('.category-loader').each(function () {
      $(this).css('display', '')
      observer.observe($(this).get(0))
    })
  } else {
    const $selected_loader = $(`.category-loader[data-slug="${selected_category}"]`)
    if ($selected_loader.get(0)) {
      $selected_loader.css('display', '')
      observer.observe($selected_loader.get(0))
    }
  }
})

$(() => {
  const lazyLoadCategories = async (entries, observer) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const obj = entry.target
        const slug = obj.dataset.slug

        const html = await fetch(`${base_url}/category/${slug}`).then((res) => res.text())
        obj.innerHTML = html
        obj.classList.remove('min-h-[300px]')

        if (window.lucide) lucide.createIcons()

        observer.unobserve(obj)
      }
    })
  }

  const observer = new IntersectionObserver(lazyLoadCategories, {
    rootMargin: '0px 0px 200px 0px',
    threshold: 0.1,
  })

  $('.category-loader').each(function () {
    observer.observe($(this).get(0))
  })

  window.observer = observer
})

$(() => {
  const $search_input = $('#package-search')
  const $results_container = $('#search-results')
  const search_base = '/search'

  let debounceTimeout
  const searchDebounce = (callback, delay) => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(callback, delay)
  }

  const searchProducts = async (query) => {
    $('.category-loader').css('display', 'none')

    if (!query) {
      $results_container.html('')
      $('.category-loader').css('display', '')
      return
    }

    try {
      const response = await fetch(`${search_base}?q=${encodeURIComponent(query)}`)

      if (!response.ok) throw new Error('Response not ok')

      const html = await response.text()
      $results_container.html(html)
    } catch (error) {
      console.error(error)
      $results_container.html(`<p class='text-red-500'>Ocorreu um erro ao buscar os produtos.</p>`)
    }
  }

  $search_input.on('input', () => {
    const query = $search_input.val()
    searchDebounce(() => searchProducts(query), 600)
  })
})
