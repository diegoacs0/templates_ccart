const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
const drawer_content = $('#drawer-content')

jQuery(function () {
  const firstFocusableElement = drawer_content.find(focusableElements).first()
  const focusableContent = drawer_content.find(focusableElements)
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

  firstFocusableElement.trigger('focus')
})

function drawerClose() {
  $('#drawer').addClass('fade-out')
  $('#drawer-content').addClass('slide-out').removeClass('slide-in')

  setTimeout(() => {
    $('#drawer').addClass('hidden').removeClass('grid').removeClass('fade-out')
    $('#drawer-content').removeClass('slide-out').addClass('slide-in')

    $(document.body).css('overflow', '').css('padding-right', '')
  }, 400)
}

function drawerOpen() {
  $('#drawer').removeClass('hidden').addClass('grid')

  $(document.body).css('overflow', 'hidden')

  $('#drawer-content').on('click', (e) => e.stopPropagation())

  // Trap focus
  $('#drawer-content').find(focusableElements).first().trigger('focus')

  $('#drawer').on('click', (el) => {
    drawerClose()
  })
}
