const base_url = window.location.protocol + '//' + window.location.host + dist_url

function triggerModal({ id, html, width, onClose }) {
  Swal.fire({
    html: html,
    width: width || 700,
    showConfirmButton: false,
    showClass: {
      popup: 'modal_show_slide',
    },
    hideClass: {
      popup: 'modal_hide_slide',
    },
    customClass: {
      popup: 'p-0 text-inherit dark:bg-neutral-900',
    },
  })

  $('.swal2-container').attr('id', id)
  $('#swal2-html-container').removeClass('swal2-html-container')

  const modal = document.getElementById(id)
  var target = document.querySelector('body')

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        if (mutation.removedNodes.length > 0 && mutation.removedNodes[0] === modal) {
          onClose()
        }
      }
    })
  })
  observer.observe(target, { childList: true })
}

function closeModal() {
  Swal.close()
}

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
    ${title ? `<b>${title}</b>` : ''}

    ${title ? '<br>' : ''}

    <p>${content}</p>
  </div>
  `

  Toastify({
    style: {
      background: `${status === 'error' ? '#dc2626' : '#22c55e'}`,
      boxShadow: 'none',
      maxWidth: '520px',
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
    gravity: 'bottom',
    position: 'center',
  }).showToast()
}

const terms_html = $('#terms-modal').html()
$('#terms-modal').remove()
function showTerms() {
  triggerModal({ html: terms_html })
}

async function showPackage(slug) {
  const url = base_url + '/package/' + slug

  const html = await fetch(url).then(async (res) => await res.text())

  triggerModal({ html })
}

$(document).on('click', "[data-func='open-selector']", async function () {
  const slug = $(this).attr('data-slug')

  const url = base_url + '/package/' + slug + '/options'

  const html = await fetch(url).then(async (res) => await res.text())

  triggerModal({ html, width: 400 })
})

function getSelectedOptions(query) {
  const options = {}
  $(query).each(function (index, el) {
    const select_id = $(this).find('select').attr('id')
    const input_id = $(this).find('input').attr('id')

    const select_value = $(this).find('select').val()
    const input_value = $(this).find('input').val()

    if (select_id) {
      options[select_id] = select_value
    }

    if (input_id) {
      options[input_id] = input_value
    }
  })

  return options
}

function getCheckoutVariables(query) {
  const options = {}

  $(query)
    .find('input')
    .each(function () {
      const input_id = $(this).attr('id')
      const input_value = $(this).val()

      if (input_id) options[input_id] = input_value
    })

  return options
}

$(document).on('click', "[data-func='add-to-cart']", function () {
  const package_id = $(this).attr('id')

  const options = getSelectedOptions('#option_wrapper > div')

  CentralCart.cartAdd(package_id, options)
    .then((res) => {
      toast({
        content:
          '<i class="me-1 fa-solid fa-basket-shopping"></i> <span class="font-semibold">Pacote adicionado ao carrinho!</span>',
      })

      updateButtons(res.data.packages)
      updateCartPrice(res.data)

      if (window.location.pathname.includes('cart')) window.location.reload()
    })
    .catch((err) => {
      toast({
        title: 'Oops...',
        content: err.data.errors[0].message,
        status: 'error',
      })
    })
})

$(document).on('click', "[data-func='update-options']", function () {
  const package_id = $(this).attr('id')

  const options = getSelectedOptions('#option_wrapper > div')

  CentralCart.cartSetOptions(package_id, options)
    .then((res) => {
      toast({
        title: 'Pronto!',
        content: 'Opções atualizadas!',
      })

      updateButtons(res.data.packages)
      updateCartPrice(res.data)
    })
    .catch((err) => {
      toast({
        title: 'Oops...',
        content: err.data.errors[0].message,
        status: 'error',
      })
    })

  closeModal()
})

$(document).on('click', "[data-func='goto-cart']", function () {
  window.location.href = `${dist_url}/cart`
})

function updateButtons(cart_packages) {
  $('[data-func]')
    .not('[data-ignore]')
    .each(function () {
      const id = $(this).attr('id')

      const exists = cart_packages.find((cart_pkg) => cart_pkg.package_id === parseInt(id))

      if (exists) {
        $(this).attr('data-func', 'goto-cart')

        $(this).html(
          `
        <i class="fa-solid fa-basket-shopping me-2"></i>
        Ver carrinho
        `
        )
      }
    })
}

let allow_cart_actions = true
function disableCartActions() {
  $("[data-cart-action='decrease']").attr('disabled', '')
  $("[data-cart-action='input']").attr('disabled', '')
  $("[data-cart-action='increase']").attr('disabled', '')

  setTimeout(() => {
    $("[data-cart-action='decrease']").removeAttr('disabled')
    $("[data-cart-action='input']").removeAttr('disabled')
    $("[data-cart-action='increase']").removeAttr('disabled')
  }, 1000)
}

function updateCartPrice(cart) {
  const display = cart.total_quantity
    ? `${cart.total_quantity} ite${cart.total_quantity > 1 ? 'ns' : 'm'} por ${
        cart.total_price_display
      }`
    : 'Carrinho vazio'

  $('.cart-price').text(cart.total_price_display)
  $('.cart-summary').html(
    `
    <i class="fa-solid fa-basket-shopping"></i>
    ${display}
    `
  )
}

$('[data-cart-action]').on('click', function () {
  const action = $(this).attr('data-cart-action')

  if (action === 'input') return

  const package_id = $(this).attr('data-package-id')

  disableCartActions()

  if (action === 'increase') {
    CentralCart.cartAdd(package_id).then((res) => {
      const quantity = parseInt($(this).prev().val())

      $(this)
        .prev()
        .val(quantity + 1)

      updateCartPrice(res.data)
    })
  }

  if (action === 'decrease') {
    CentralCart.cartRemove(package_id).then((res) => {
      const quantity = parseInt($(this).next().val())

      if (quantity - 1 <= 0) {
        window.location.reload()
      } else
        $(this)
          .next()
          .val(quantity - 1)

      updateCartPrice(res.data)
    })
  }

  if (action === 'remove') {
    CentralCart.cartSetQuantity(package_id, 0).then((res) => {
      window.location.reload()
    })
  }
})

$("[data-cart-action='input']").on('blur', function () {
  disableCartActions()

  const package_id = $(this).attr('data-package-id')
  const quantity = $(this).val()

  CentralCart.cartSetQuantity(package_id, quantity).then((res) => {
    if (quantity <= 0) {
      window.location.reload()
    } else {
      updateCartPrice(res.data)
    }
  })
})

$('[data-coupon-action]').on('click', function () {
  const coupon = $(this).prev().val()

  const action = $(this).attr('data-coupon-action')

  if (!coupon) {
    return toast({
      title: 'Oops...',
      status: 'error',
      content: 'Insira o código de desconto.',
    })
  }

  $(this).attr('disabled', '')

  if (action === 'apply') {
    CentralCart.attachCoupon(coupon)
      .then((res) => {
        toast({
          title: 'Pronto!',
          content: 'Cupom aplicado com sucesso!',
        })

        updateCartPrice(res.data)

        $(this).removeClass('bg-brand')
        $(this).addClass('bg-red-500')

        $(this).text('Remover')
        $(this).attr('data-coupon-action', 'remove')
      })
      .catch((err) => {
        toast({
          title: 'Oops...',
          content: err.data.errors[0].message,
          status: 'error',
        })
      })
      .finally(() => $(this).removeAttr('disabled'))
  } else {
    CentralCart.detachCoupon(coupon)
      .then((res) => {
        toast({
          title: 'Pronto!',
          content: 'Cupom removido do carrinho!',
        })

        updateCartPrice(res.data)

        $(this).addClass('bg-brand')
        $(this).removeClass('bg-red-500')

        $(this).text('Resgatar')
        $(this).prev().val('')
        $(this).attr('data-coupon-action', 'apply')
      })
      .catch((err) => {
        toast({
          title: 'Oops...',
          content: err.data.errors[0].message,
          status: 'error',
        })
      })
      .finally(() => $(this).removeAttr('disabled'))
  }
})

function gatewayLookup() {
  const document_group = $('label[for=cpf]').parent()

  if (document_group.attr('data-required') !== undefined) return

  if ($('input[name=payment_gateway]:checked').attr('data-require-document') === 'true') {
    document_group.addClass('block').removeClass('hidden')
  } else {
    document_group.removeClass('block').addClass('hidden')
    $('input[id=cpf]').val('')
  }
}
gatewayLookup()

$('input[type=radio][name=payment_gateway]').on('change', function () {
  gatewayLookup()
})

$('.discord-button').on('click', function (e) {
  e.preventDefault()

  CentralCart.requestDiscord().then((data) => {
    $('input[name=discord]').val(data.id)

    $(this).html(`
        <img class="me-2" src="${data.avatar_url}" width="22" style="border-radius: 90px;">
        ${data.display_name}
      `)
  })
})

const pix_html = $('#pix-modal').html()
$('#pix-modal').remove()
function showPixModal(pix_code, qr_code, return_url) {
  triggerModal({
    id: 'pix-popup',
    html: pix_html,
    width: 400,
    onClose: () => {
      window.location.href = return_url
    },
  })

  $('#qr-content').attr('src', `data:image/jpeg;base64,${qr_code}`)
  $('#qr-copy-code').val(pix_code)
  $('#return-to').attr('href', return_url)

  let timeout
  $('#copy-pix').on('click', function () {
    if (timeout) return

    navigator.clipboard.writeText(pix_code)

    const icon = '<i class="fa-solid fa-copy"></i>'

    $(this).html(`${icon} Copiado`)

    timeout = setTimeout(() => {
      $(this).html(`${icon} Copiar`)

      timeout = null
    }, 3000)
  })
}

$('#checkout-form').on('submit', function (e) {
  e.preventDefault()

  const data = {}
  data.client_name = $('#checkout-form input[name=name]').val()
  data.client_email = $('#checkout-form input[name=email]').val()
  data.client_document = $('#checkout-form input[name=cpf]').val()
  data.client_phone = $('#checkout-form input[name=tel]').val()
  data.client_discord = $('#checkout-form input[name=discord]').val()

  data.terms = $('#checkout-form input[name=terms]').is(':checked')
  data.gateway = $('input[type=radio][name=payment_gateway]:checked').val()

  data.variables = getCheckoutVariables('#checkout_variables')

  if (data.client_phone) {
    if (data.client_phone.charAt(0) !== '+') data.client_phone = '+55' + data.client_phone
  }

  $('#checkout-button').attr('disabled', '')

  CentralCart.checkout(data)
    .then((res) => {
      const { checkout_url, pix_code, qr_code, return_url } = res.data

      if (checkout_url) return (location.href = checkout_url)

      if (pix_code) return showPixModal(pix_code, qr_code, return_url)

      if (return_url) return (location.href = return_url)
    })
    .catch((err) => {
      toast({
        title: 'Oops...',
        status: 'error',
        content: err.data.errors[0].message,
      })
    })
    .finally(() => $('#checkout-button').removeAttr('disabled'))
})

let nav_open = false
$('#nav-drawer-button').on('click', function () {
  if (!nav_open) {
    nav_open = true

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'

    $('#nav-drawer').removeClass('hidden')
  }
})

$('#nav-drawer-close').on('click', function () {
  if (nav_open) {
    nav_open = false

    document.body.style.overflow = 'unset'
    document.body.style.position = 'unset'

    $('#nav-drawer').addClass('hidden')
  }
})

function copyIp(element) {
  const ip = element.getAttribute('data-ip')
  navigator.clipboard.writeText(ip)

  toast({
    content: 'Endereço copiado com sucesso.',
    status: 'success',
  })
}

function handleMobileSubcategory(e) {
  const subcategories = $(e.target).next()
  const is_open = subcategories.attr('data-open') === 'true'

  $(e.target).next().attr('data-open', !is_open)
}

function toggleTheme() {
  const is_light = !document.documentElement.classList.contains('dark')

  if (is_light) {
    localStorage.theme = 'dark'
    document.documentElement.classList.add('dark')
  } else {
    localStorage.theme = 'light'
    document.documentElement.classList.remove('dark')
  }
}

$('.number-only').on('keypress', function (event) {
  if (isNaN(event.key)) event.preventDefault()
})

$('.number-only').on('paste', function (event) {
  var clipboardData = event.originalEvent.clipboardData || window.clipboardData
  var pastedData = clipboardData.getData('text')

  if (isNaN(pastedData)) {
    event.preventDefault()
  }
})
