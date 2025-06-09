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

function initRevealObserver() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
    }
  )

  document.querySelectorAll('.package-reveal').forEach((el) => {
    revealObserver.observe(el)
  })
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
  initRevealObserver()

  const lazyLoadCategories = async (entries, observer) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const obj = entry.target
        const slug = obj.dataset.slug
        const current_package = obj.dataset.currentPackage || null

        const html = await fetch(
          `${base_url}/category/${slug}?embed=true&current_package=${current_package}`
        ).then((res) => res.text())
        obj.innerHTML = html
        obj.classList.remove('min-h-[300px]')
        obj.classList.add('visible')

        if (window.lucide) lucide.createIcons()

        if (current_package) {
          var slider = new KeenSlider('#similar-packages-slider', {
            slides: {
              perView: 4,
              spacing: 8,
            },
            breakpoints: {
              '(max-width: 1024px)': {
                slides: {
                  perView: 2,
                  spacing: 4,
                },
              },
            },
          })

          $('#similar-slider-prev').on('click', () => slider.prev())
          $('#similar-slider-next').on('click', () => slider.next())
        }

        initRevealObserver()

        observer.unobserve(obj)
      }
    })
  }

  const observer = new IntersectionObserver(lazyLoadCategories, {
    rootMargin: '0px 0px 0px 0px',
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
      $results_container.html(`<p class='text-red-500'>Ocorreu um erro ao buscar os produtos.</p>`)
    }
  }

  $search_input.on('input', () => {
    const query = $search_input.val()
    searchDebounce(() => searchProducts(query), 600)
  })
})

$(() => {
  let debounceTimer
  let loading = false

  function handleSearch(inputSelector, resultSelector) {
    $(inputSelector).on('input', function () {
      clearTimeout(debounceTimer)

      let query = $(this).val().trim()

      if (query.length > 0) {
        if (!loading) {
          $(resultSelector)
            .html(
              `
            <div class="flex items-center justify-center p-8">
              <span class="animate-spin mingcute--loading-line size-12"></span>
            </div>
            `
            )
            .removeClass('hidden')

          loading = true
        }

        debounceTimer = setTimeout(() => {
          $.get(`/search?q=${encodeURIComponent(query)}&bar=true`, function (data) {
            $(resultSelector).html(data).removeClass('hidden')
          })
            .fail(function () {
              $(resultSelector)
                .html('<div class="p-2 text-red-500">Erro ao buscar</div>')
                .removeClass('hidden')
            })
            .done(() => {
              loading = false
            })
        }, 300)
      } else {
        $(resultSelector).addClass('hidden').empty()
      }
    })

    $(inputSelector).on('click', function () {
      if ($(resultSelector).children().length) $(resultSelector).removeClass('hidden')
    })

    $(document).on('click', function (e) {
      if (!$(e.target).closest(`${inputSelector}, ${resultSelector}`).length) {
        $(resultSelector).addClass('hidden')
      }
    })
  }

  handleSearch('#search-bar', '#search-result')
  handleSearch('#search-bar-mobile', '#search-result-mobile')
})
