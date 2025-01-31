const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
const modal = $('#drawer-content')

jQuery(function () {
  const firstFocusableElement = modal.find(focusableElements).first()
  const focusableContent = modal.find(focusableElements)
  const lastFocusableElement = focusableContent.last()

  $(document).on('keydown', function (e) {
    let isTabPressed = e.key === 'Tab' || e.keyCode === 9

    if (!isTabPressed) {
      return
    }

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement[0]) {
        lastFocusableElement.trigger('focus')
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusableElement[0]) {
        firstFocusableElement.trigger('focus')
        e.preventDefault()
      }
    }
  })

  firstFocusableElement.focus()
})

function checkoutDrawerClose() {
  $('#checkout-drawer').addClass('fade-out')
  $('#drawer-content').addClass('slide-out').removeClass('slide-in')

  setTimeout(() => {
    $('#checkout-drawer').addClass('hidden').removeClass('grid').removeClass('fade-out')
    $('#drawer-content').removeClass('slide-out').addClass('slide-in')

    $(document.body).css('overflow', '').css('padding-right', '')

    const return_to_anchor = $('#checkout-drawer a#return-to')
    if (return_to_anchor.first().length) {
      window.location.href = return_to_anchor.attr('href')
    }
  }, 400)
}

function checkoutDrawerOpen() {
  $('#checkout-drawer').removeClass('hidden').addClass('grid')

  $(document.body).css('overflow', 'hidden').css('padding-right', '17px')

  $('#drawer-content').on('mousedown', (e) => e.stopPropagation())

  // Trap focus
  $('#drawer-content').find(focusableElements).first().trigger('focus')

  $('#checkout-drawer').on('mousedown', (el) => {
    checkoutDrawerClose()
  })
}
