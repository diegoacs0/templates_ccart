const base_url = window.location.protocol + '//' + window.location.host + dist_url
const bg_trigger_active = 'bg-brand'
const rotate_180 = 'rotate-180'
const old_texts = []

function triggerModal({ id, html, width, onClose }) {
  Swal.fire({
    html: html,
    width: width || 600,
    showConfirmButton: false,
    background: '#222436',
    backdrop: 'rgba(0,0,0,0.4)',
    showClass: {
      popup: 'modal_show_slide',
    },
    hideClass: {
      popup: 'modal_hide_slide',
    },
    customClass: {
      popup: 'p-0 text-inherit',
    },
  }).then((result) => {
    if (onClose && result.isDismissed) onClose()
  })

  $('.swal2-container').attr('id', id)
  $('#swal2-html-container').removeClass('swal2-html-container')
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
    ${
      status === 'error'
        ? '<i class="fa-regular fa-circle-xmark text-red-500 me-0.5"></i>'
        : '<i class="fa-regular fa-circle-check text-green-500 me-0.5"></i>'
    }

    ${title ? `<b>${title}</b>` : ''}

    ${title ? '<br>' : ''}

    <p class="text-white/60">${content}</p>
  </div>
  `

  Toastify({
    style: {
      background: `rgb(17, 18, 28)`,
      border: 'solid 1px #222436',
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
}

function handleMenu(isOpen = false) {
  const menu = document.getElementById('menu')

  if (isOpen) menu.classList.remove('hidden') & document.body.classList.add('overflow-hidden')
  else menu.classList.add('hidden') & document.body.classList.remove('overflow-hidden')
}

function handleCopyIpToClipboard(ip = '') {
  if (!ip) return

  const button = document.querySelectorAll('#copy-ip')

  button.forEach((btn) => {
    old_texts.push(btn.innerHTML)

    if (btn.tagName === 'BUTTON') {
      btn.disabled = true
    } else {
      btn.innerHTML = ['MINECRAFT', 'GTA-SA'].includes(store_type)
        ? 'IP copiado'
        : 'Redirecionando...'
    }
  })

  if (store_type === 'MINECRAFT') {
    navigator.clipboard.writeText(ip)
  } else window.location.href = store_type.toLowerCase() + `://connect/${ip}`

  setTimeout(() => {
    button.forEach((btn, index) => {
      btn.innerHTML = old_texts[index]
      btn.disabled = false
    })
  }, 3000)

  return
}

function handleOpenAccordion(id) {
  if (!id) return

  const group = document.getElementById(id)

  const content = group.children[1]

  const hasOpenAccordion = content.getAttribute('data-open')

  const trigger = group.children[0]

  hasOpenAccordion
    ? trigger.classList.toggle(bg_trigger_active) & trigger.classList.contains(bg_trigger_active)
      ? (trigger.style.transition = 'background-color .3s')
      : (trigger.style.transition = 'background-color .3s')
    : null

  const arrow = content.previousElementSibling.children[2]

  arrow.classList.toggle(rotate_180) & arrow.classList.contains(rotate_180)
    ? (arrow.style.transition = 'transform .3s')
    : (arrow.style.transition = 'transform .3s')

  return hasOpenAccordion === 'false'
    ? content.setAttribute('data-open', 'true')
    : content.setAttribute('data-open', 'false')
}

const terms_html = $('#terms-modal').html()
$('#terms-modal').remove()
function showTerms(e) {
  if (e) e.preventDefault()

  triggerModal({ html: terms_html })
}

async function showPackage(slug) {
  const url = base_url + '/package/' + slug

  const html = await fetch(url).then(async (res) => await res.text())

  triggerModal({ html })
}

function redeemOrder(id) {
  const html = $(`#modal-${id}`).html()

  triggerModal({ html })
}

function selectVariation(button) {
  const variationSlug = button.getAttribute('data-variation-slug')

  fetch(`/package/${variationSlug}?modal=true`)
    .then((response) => response.text())
    .then((html) => {
      triggerModal({ html })
    })
}
