const base_url = window.location.protocol + '//' + window.location.host + dist_url

MicroModal.init({
  awaitOpenAnimation: true,
  awaitCloseAnimation: true,
  disableScroll: true,
})

function sendMessage(message) {
  console.log(`%c[CENTRALCART]: %c${message}`, 'color: #00dc82;', '')
}

function showToast(title, content, type = null) {
  const text = `
  <div>
    <b>${title}</b>

    ${title && '<br>'}

    <p>${content}</p>
  </div>
  `

  Toastify({
    className: type,
    escapeMarkup: false,
    text: text,
    duration: 30000,
    close: true,
    gravity: 'bottom',
    position: 'center',
  }).showToast()
}

function updateTotalPrice(new_price) {
  $('.cc__checkout___total_price').text(new_price)
  $('#checkout').text(`Comprar (${new_price})`)
}

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

/**
 * Start coupon controllers
 */
let coupon_warn_timeout

function showCouponError(message) {
  $('.coupon-error').show().text(message)

  if (coupon_warn_timeout) clearTimeout(coupon_warn_timeout)

  coupon_warn_timeout = setTimeout(() => {
    $('.coupon-error').hide()
  }, 3000)
}

$('#apply-coupon').on('click', function () {
  const coupon = $(this).prev().val()

  const already_applied = $(this).data('coupon') !== 'undefined'

  if (!coupon && !already_applied) {
    return showCouponError('Informe o cupom que deseja aplicar.')
  }

  if (!already_applied) {
    CentralCart.attachCoupon(coupon)
      .then((res) => {
        showToast('Pronto!', 'Cupom aplicado com sucesso!')
        updateTotalPrice(res.data.total_price_display)
        $(this).addClass('bg-red-600 hover:bg-red-500')
        $(this).text('Remover')
        $(this).data('coupon', coupon)
      })
      .catch((err) => {
        showToast('Oops...', err.data.errors[0].message, 'error')
      })
  } else {
    CentralCart.detachCoupon(coupon)
      .then((res) => {
        showToast('Pronto!', 'Cupom removido do carrinho!')
        updateTotalPrice(res.data.total_price_display)
        $(this).removeClass('bg-red-600 hover:bg-red-500')
        $(this).text('Aplicar')
        $(this).prev().val('')
        $(this).data('coupon', 'undefined')
      })
      .catch((err) => {
        showToast('Oops...', err.data.errors[0].message, 'error')
      })
  }
})
/**
 * End coupon controllers
 */

/**
 * Start categories page controllers
 */
function updateButtons(cart_packages) {
  $('[data-func]').each(function () {
    const id = $(this).attr('id')

    const exists = cart_packages.find((cart_pkg) => cart_pkg.package_id === parseInt(id))

    if (exists) {
      $(this).attr('data-func', 'goto-cart')

      $(this).html(
        `
        <i class="me-2 fa-solid fa-basket-shopping"></i> 
        Ver carrinho
        `
      )
    }
  })
}

$(document).on('click', "[data-func='goto-cart']", function () {
  window.location.href = `${dist_url}/cart`
})

$(document).on('click', "[data-func='open-selector']", async function () {
  const slug = $(this).attr('data-slug')

  const url = base_url + '/package/' + slug + '/options'

  const html = await fetch(url).then(async (res) => await res.text())

  $('#package-option-modal-container').get()[0].innerHTML = html

  MicroModal.show('package-option-modal', {
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
    disableScroll: true,
  })
})

$(document).on('click', "[data-func='add-to-cart']", function () {
  const package_id = $(this).attr('id')

  const options = getSelectedOptions('#option_wrapper > div')

  CentralCart.cartAdd(package_id, options)
    .then((res) => {
      showToast(
        '',
        '<i class="me-1 fa-solid fa-basket-shopping"></i> <span class="font-semibold">Pacote adicionado ao carrinho!</span>'
      )

      updateButtons(res.data.packages)

      if (window.location.pathname.includes('cart')) window.location.reload()
    })
    .catch((err) => {
      showToast('Oops...', err.data.errors[0].message, 'error')
    })
})

$(document).on('click', "[data-func='update-options']", function () {
  const package_id = $(this).attr('id')

  const options = getSelectedOptions('#option_wrapper > div')

  CentralCart.cartSetOptions(package_id, options)
    .then((res) => {
      showToast('', '<i class="me-1 fa-solid fa-basket-shopping"></i> Opções atualizadas!')

      updateTotalPrice(res.data.total_price_display)
    })
    .catch((err) => {
      showToast('Oops...', err.data.errors[0].message, 'error')
    })

  MicroModal.close('package-option-modal')
})
/**
 * End categories page controllers
 */

/**
 * Start checkout page product controllers
 */
$('.cc__checkout___quantity_input').on('keypress', (e) => {
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  if (!numbers.includes(e.key)) {
    e.preventDefault()
  }
})

let allow_cart_action = true
function blockCartActions() {
  $('.cc__checkout___quantity_controller').css('opacity', 0.5)
  $('.cc__checkout___quantity_controller *').attr('disabled', true)

  allow_cart_action = false

  setTimeout(() => {
    $('.cc__checkout___quantity_controller').css('opacity', 1)
    $('.cc__checkout___quantity_controller *').attr('disabled', false)

    allow_cart_action = true
  }, 1000)
}

$('.cc__checkout___increase').click(function () {
  blockCartActions()

  const package_id = $(this).attr('cc-package-id')

  CentralCart.cartAdd(package_id).then((res) => {
    const quantity = parseInt($(this).prev().val())

    $(this)
      .prev()
      .val(quantity + 1)

    updateTotalPrice(res.data.total_price_display)
  })
})

$('.cc__checkout___decrease').click(function () {
  blockCartActions()

  const package_id = $(this).attr('cc-package-id')

  CentralCart.cartRemove(package_id).then((res) => {
    const quantity = parseInt($(this).next().val()) - 1

    if (quantity <= 0) {
      window.location.reload()
    } else {
      $(this).next().val(quantity)
      updateTotalPrice(res.data.total_price_display)
    }
  })
})

$('.cc__checkout___remove').click(function () {
  blockCartActions()

  const package_id = $(this).attr('cc-package-id')

  CentralCart.cartSetQuantity(package_id, 0).then((res) => {
    window.location.reload()
  })
})

$('.cc__checkout___quantity_input').focusout(function () {
  blockCartActions()

  const package_id = $(this).attr('cc-package-id')
  const quantity = $(this).val()

  CentralCart.cartSetQuantity(package_id, quantity).then((res) => {
    if (quantity <= 0) {
      window.location.reload()
    } else {
      updateTotalPrice(res.data.total_price_display)
    }
  })
})
/**
 * End checkout page product controllers
 */

/**
 * Start checkout modal controllers
 */
$('.btn-primary.discord').on('click', function (e) {
  e.preventDefault()

  CentralCart.requestDiscord().then((data) => {
    $('input[name=discord]').val(data.id)
    $(this).html(`
        <img class="me-2" src="${data.avatar_url}" width="25" style="border-radius: 90px;">
        ${data.display_name}
      `)
  })
})

function showPixModal(pix_code, qr_code, return_url) {
  MicroModal.close('checkout-modal')

  MicroModal.show('pix-modal', {
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
    onClose: () => {
      setTimeout(() => {
        window.location.href = return_url
      })
    },
  })

  $('#pix-modal img').attr('src', `data:image/jpeg;base64,${qr_code}`)

  let timeout
  $('#pix-modal button#copy-pix').on('click', function () {
    if (timeout) return

    const default_text = $(this).children('span').text()
    $(this).children('span').text('Código copiado')

    navigator.clipboard.writeText(pix_code)

    sendMessage('Código PIX copiado.')

    timeout = setTimeout(() => {
      $(this).children('span').text(default_text)
      timeout = undefined
    }, 3000)
  })
}

$('.cc__checkout___gateways button').on('click', function () {
  $('.cc__checkout___gateways button').each(function () {
    $(this).removeAttr('data-active')
  })

  $(this).attr('data-active', true)

  const document_group = $('label[for=document]').parent()

  if (document_group.attr('data-required') !== undefined) return

  if ($(this).attr('data-require-document') === 'true') {
    $('.cc__checkout___form_field input[name=document]')
      .parent()
      .addClass('d-flex')
      .removeClass('d-none')
  } else {
    $('.cc__checkout___form_field input[name=document]')
      .parent()
      .addClass('d-none')
      .removeClass('d-flex')

    $('.cc__checkout___form_field input[name=document]').val('')
  }
})

let warn_timeout
$('#checkout').on('click', function () {
  $(this).attr('disabled', '')

  let data = {}
  data.gateway = $('.cc__checkout___gateways button[data-active]').val()
  data.client_email = $('.cc__checkout___form_field input[name=email]').val()
  data.client_name = $('.cc__checkout___form_field input[name=name]').val()
  data.client_phone = $('.cc__checkout___form_field input[name=phone]').val()?.replace(/\D/g, '')
  data.client_document = $('.cc__checkout___form_field input[name=document]').val()
  data.client_discord = $('.cc__checkout___form_field input[name=discord]').val()
  data.terms = $('.cc__checkout___form_field input[name=terms]').is(':checked')
  data.variables = getCheckoutVariables('#checkout_variables')

  if (data.client_phone) {
    if (data.client_phone.charAt(0) !== '+') data.client_phone = '+' + data.client_phone
  }

  CentralCart.checkout(data)
    .then((res) => {
      const { checkout_url, pix_code, qr_code, return_url } = res.data

      if (checkout_url) return (location.href = checkout_url)

      if (pix_code) return showPixModal(pix_code, qr_code, return_url)

      if (return_url) return (location.href = return_url)
    })
    .catch((err) => {
      const errors = err.data.errors

      if (warn_timeout) {
        clearTimeout(warn_timeout)
      }

      $('.cc__checkout___modal_alert_container p').text(errors[0].message)
      $('.cc__checkout___modal_alert_container').fadeIn(300, function () {
        warn_timeout = setTimeout(() => {
          $(this).fadeOut()

          if (err.status === 412) {
            location.reload()
          }
        }, 5000)
      })
    })
    .finally(() => $(this).removeAttr('disabled'))
})
/**
 * End checkout modal controllers
 */

document.querySelectorAll('oembed[url]').forEach((element) => {
  const url = element.attributes.getNamedItem('url').textContent
  const video = url.substring(url.length - 11, url.length)

  element.insertAdjacentHTML(
    'beforeend',
    `<iframe width="100%" height="420" src="https://www.youtube.com/embed/${video}"></iframe>`
  )
})

async function showPackage(slug) {
  const url = base_url + '/package/' + slug

  const html = await fetch(url).then(async (res) => await res.text())

  MicroModal.show('package-modal', {
    awaitOpenAnimation: true,
    awaitCloseAnimation: true,
    disableScroll: true,
  })
  $('#package-modal-container').get()[0].innerHTML = html
}

function copyIp(element) {
  const ip = element.getAttribute('data-ip')
  navigator.clipboard.writeText(ip)

  showToast('', 'Endereço copiado com sucesso.')
}

function openSubcategoryMenu(element) {
  const subCategoryWrapper = $(element).next('.subcategories-wrapper')
  const buttonCaret = $(element).children('.fa-solid.fa-caret-right')

  const height = subCategoryWrapper.children().outerHeight()

  if (subCategoryWrapper.css('height') === '0px') {
    subCategoryWrapper.css('height', height + 'px')
    buttonCaret.css('transform', 'rotate(90deg)')
  } else {
    subCategoryWrapper.css('height', '0px')
    buttonCaret.css('transform', 'rotate(0deg)')
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
