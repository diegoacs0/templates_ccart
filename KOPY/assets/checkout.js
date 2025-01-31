let warn_timeout

$('[data-gateway]').on('click', function () {
  $('[data-gateway]').each(function () {
    $(this).removeAttr('data-selected')
  })

  $(this).attr('data-selected', 'true')
})

$('#handle-discount').on('click', async function () {
  const action = $(this).attr('data-action')
  const input = $(this).prev()
  const coupon = input.val()

  const icon = $(this).find('i')
  const icon_code = icon.prop('outerHTML')

  $(this).attr('disabled', true)

  icon.replaceWith('<i class="icon-loader-circle animate-spin text-xl font-normal"></i>')

  try {
    if (action === 'apply') {
      await CentralCart.attachCoupon(coupon).then((res) => {
        $(this).find('span').text('Remover')
        $(this).attr('data-action', 'remove')
        $('.price-total').each(function () {
          $(this).text(res.data.total_price_display)
        })
      })
    } else {
      await CentralCart.detachCoupon(coupon).then((res) => {
        $(this).find('span').text('Aplicar')
        $(this).attr('data-action', 'apply')
        input.val('')
        $('.price-total').each(function () {
          $(this).text(res.data.total_price_display)
        })
      })
    }
  } catch (err) {
    $('#discount-error-message').text(err.data.errors[0].message)
    setTimeout(() => {
      $('#discount-error-message').text('')
    }, 3000)
  } finally {
    $(this).find('i').replaceWith(icon_code)
    $(this).attr('disabled', false)
  }
})

$('#discord-login').on('click', function (e) {
  CentralCart.requestDiscord().then((data) => {
    $('input[name=discord]').val(data.id)

    $(this).html(`
        <img class="me-2" src="${data.avatar_url}" width="22" style="border-radius: 90px;">
        ${data.display_name}
      `)
  })
})

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

function handlePix(pix_code, qr_code, return_url) {
  console.log({ pix_code, qr_code, return_url })

  $('#pix-qr').attr('src', `data:image/jpeg;base64,${qr_code}`)
  $('#pix-cp').val(pix_code)
  $('#return-to').attr('href', return_url)

  $('#discount-wrapper').addClass('hidden')
  $('#checkout-form').addClass('hidden')
  $('#pix-display').removeClass('hidden').addClass('block')

  $('#copy-pix').on('click', function () {
    navigator.clipboard.writeText(pix_code)

    const default_text = $(this).find('span').text()

    $(this).attr('disabled', true)
    $(this).find('span').text('Copiado')

    setTimeout(() => {
      $(this).attr('disabled', false)
      $(this).find('span').text(default_text)
    }, 3000)
  })
}

$('#checkout-form').on('submit', function (e) {
  e.preventDefault()

  const data = {}

  const name = $('#checkout-form input[id=name]').val()
  const surname = $('#checkout-form input[id=surname]').val()

  data.client_name = `${name} ${surname}`.trim()
  data.client_email = $('#checkout-form input[id=email]').val()
  data.client_document = $('#checkout-form input[id=cpf]').val()
  data.client_phone = $('#checkout-form input[id=tel]').val()
  data.client_discord = $('#checkout-form input[id=discord]').val()
  data.terms = $('#checkout-form input[id=terms]').is(':checked')
  data.gateway = $('#checkout-form [data-gateway][data-selected="true"]').data('gateway')
  data.variables = getCheckoutVariables('#checkout-variables')

  if (data.client_phone) {
    if (data.client_phone.charAt(0) !== '+') data.client_phone = '+55' + data.client_phone
  }

  const $checkout_button = $('#checkout-button')
  const initial_text = $checkout_button.text()
  $checkout_button.attr('disabled', true)
  $checkout_button.html(
    '<div class="icon-loader-circle animate-spin text-xl font-normal w-fit mx-auto"></div>'
  )

  CentralCart.checkout(data)
    .then((res) => {
      const { checkout_url, pix_code, qr_code, return_url } = res.data

      if (checkout_url) return (location.href = checkout_url)

      if (pix_code) return handlePix(pix_code, qr_code, return_url)

      if (return_url) return (location.href = return_url)
    })
    .catch((err) => {
      if (warn_timeout) clearTimeout(warn_timeout)

      $('#checkout-error-message').text(err.data.errors[0].message)
      $('#checkout-error').fadeIn(300, function () {
        warn_timeout = setTimeout(() => {
          $(this).fadeOut()

          if (err.status === 412) {
            location.reload()
          }
        }, 5000)
      })

      setTimeout(() => {
        $('#checkout-error').removeClass('flex').addClass('hidden')
      }, 8000)
    })
    .finally(() => {
      $checkout_button.text(initial_text)
      $checkout_button.removeAttr('disabled')
    })
})
