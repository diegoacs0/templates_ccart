function updateButtons(cart_packages) {
  $('[data-func]').each(function () {
    const id = $(this).attr('id')

    const exists = cart_packages.find((cart_pkg) => cart_pkg.package_id === parseInt(id))

    if (exists) {
      $(this).attr('data-func', 'goto-cart')

      $(this).html(
        `
        <i class="fa-solid fa-cart-plus text-base text-white/60"></i>
        Ver carrinho
        `
      )
    }
  })
}

function updateCartPrice(cart) {
  $('.cart-quantity').text(cart.total_quantity)
  $('.cart-price').text(cart.total_price_display)
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

$(document).on('click', "[data-func='add-to-cart']", function () {
  const package_id = $(this).attr('id')

  const options = getSelectedOptions('#option_wrapper > div')

  CentralCart.cartAdd(package_id, options)
    .then((res) => {
      toast({
        title: 'Pronto!',
        content: 'Produto adicionado ao carrinho.',
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

$(document).on('click', "[data-func='select-options']", async function () {
  const slug = $(this).attr('data-slug')

  const url = base_url + '/package/' + slug + '/options'

  const html = await fetch(url).then(async (res) => await res.text())

  triggerModal({ html, width: 400 })
})

$(document).on('click', "[data-func='goto-cart']", function () {
  window.location.href = `${dist_url}/cart`
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

        $(this).removeClass('bg-brand-contrast')
        $(this).addClass('bg-red-500')

        $('.discount-label').text('Remover')
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

        $(this).addClass('bg-brand-contrast')
        $(this).removeClass('bg-red-500')

        $('.discount-label').text('Aplicar')
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

$('[data-discord]').on('click', function (e) {
  CentralCart.requestDiscord().then((data) => {
    $('input[name=discord]').val(data.id)

    $(this).html(`
        <img class="me-2" src="${data.avatar_url}" width="22" style="border-radius: 90px;">
        ${data.display_name}
      `)
  })
})

$('[data-gateway]').on('click', function () {
  $('[data-gateway]').each(function () {
    $(this).removeClass('border-brand active')
  })

  $(this).addClass('border-brand active')

  const document_group = $('label[for=cpf]').parent()

  if (document_group.attr('data-required') !== 'false') return

  if ($(this).attr('data-require-document') === 'true') {
    $('input[id=cpf]').parent().removeClass('hidden')
  } else {
    $('input[id=cpf]').parent().addClass('hidden')
    $('input[id=cpf]').val('')
  }
})

$('#checkout-form').on('submit', function (e) {
  e.preventDefault()

  const data = {}
  data.client_name = $('#checkout-form input[id=name]').val()
  data.client_email = $('#checkout-form input[id=email]').val()
  data.client_document = $('#checkout-form input[id=cpf]').val()
  data.client_phone = $('#checkout-form input[id=tel]').val()
  data.client_discord = $('#checkout-form input[id=discord]').val()
  data.gateway = $('#checkout-form button.active').val()
  data.terms = $('#checkout-form input[id=terms]').is(':checked')
  data.variables = getCheckoutVariables('#checkout_variables')

  if (data.client_phone) {
    if (data.client_phone.charAt(0) !== '+') data.client_phone = '+55' + data.client_phone
  }

  const default_icon = $('#checkout-button').children().first()
  $('#checkout-button').attr('disabled', '')
  $('#checkout-button').children().first().remove()
  $('#checkout-button').prepend(
    `<i id="checkout-load" class="fa-solid fa-circle-notch animate-spin"></i>`
  )

  CentralCart.checkout(data)
    .then((res) => {
      const { checkout_url, pix_code, qr_code, return_url } = res.data

      if (checkout_url) return (location.href = checkout_url)

      if (pix_code) return showPixDrawer(pix_code, qr_code, return_url)

      if (return_url) return (location.href = return_url)
    })
    .catch((err) => {
      toast({
        title: 'Oops...',
        status: 'error',
        content: err.data.errors[0].message,
      })
    })
    .finally(() => {
      $('#checkout-button').removeAttr('disabled')
      $('#checkout-button').children().first().remove()
      $('#checkout-button').prepend(default_icon)
    })
})

const pix_drawer_html = $('#pix-drawer-content').removeClass('hidden').html()
$('#pix-drawer-content').remove()
function showPixDrawer(pix_code, qr_code, return_url) {
  $('#checkout-form').remove()
  $('#drawer-content').append(pix_drawer_html)

  $('#qr-content').attr('src', `data:image/jpeg;base64,${qr_code}`)
  $('#qr-copy-code').val(pix_code)
  $('#return-to').attr('href', return_url)

  let timeout
  $('#copy-pix').on('click', function () {
    if (timeout) return

    navigator.clipboard.writeText(pix_code)

    $(this).html(`Copiado`)

    timeout = setTimeout(() => {
      $(this).html(`Copiar`)

      timeout = null
    }, 3000)
  })
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
