function updatePackageButtons(cart_packages) {
  $('[data-action]').each(function () {
    const id = $(this).attr('id')

    const exists = cart_packages?.find((cart_pkg) => cart_pkg.package_id === parseInt(id))

    if (exists) {
      $(this).attr('data-action', 'go-to-cart')
    } else {
      $(this).attr('data-action', 'add-to-cart')
    }
  })
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

$(document).on('click', "[data-action='add-to-cart']", function () {
  const package_id = $(this).attr('id')

  const options = getSelectedOptions('#options-container > div')

  CentralCart.cartAdd(package_id, Object.keys(options).length ? options : null)
    .then((res) => {
      openCart()
      updatePackageButtons(res.data.packages)
    })
    .catch((err) => {
      console.error(err)
      toast({
        title: 'Oops...',
        content: err.data.errors[0].message,
        status: 'error',
      })
    })
})

$(document).on('click', "[data-action='go-to-cart']", function () {
  openCart()
})

const cart_changes = {}
function cartAction(element, action) {
  const $element = $(element)
  const $input = $element.siblings('input')

  const package_id = $element.attr('id')
  const current_quantity = parseInt($input.val())

  if (action === 'increase') {
    $input.val(current_quantity + 1)
    cart_changes[package_id] = (cart_changes[package_id] || current_quantity) + 1
  }

  if (action === 'decrease') {
    if (current_quantity > 0) {
      $input.val(current_quantity - 1)
      cart_changes[package_id] = (cart_changes[package_id] || current_quantity) - 1
    }
  }

  if (action === 'remove') {
    cart_changes[package_id] = 0
  }

  debouncedSyncCart(package_id)
}

const debouncedSyncCart = debounce((package_id) => {
  const $cart_actions = $(`#cart-actions-${package_id}`)

  const quantity = cart_changes[package_id]

  if (quantity >= 0) {
    $cart_actions.attr('data-loading', true)

    $cart_actions.children().each(function () {
      $(this).attr('disabled', true)
    })

    CentralCart.cartSetQuantity(package_id, quantity).then((res) => {
      delete cart_changes[package_id]

      if (quantity === 0) {
        openCart()
        updatePackageButtons(res.data.packages)
      }

      for (const package of res.data.packages) {
        $cart_actions.find(`input#${package.meta.id}`).val(package.quantity)
      }

      setTimeout(() => {
        $cart_actions.removeAttr('data-loading')
        $cart_actions.children().each(function () {
          $(this).removeAttr('disabled')
        })
      }, 400)
    })
  }
}, 400)
