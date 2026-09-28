import { SUPABASE_FUNCTION_URL, SUPABASE_PUBLISHABLE_KEY } from './config.mjs'

export function formatBrazilianPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 13)
  const hasCountryCode = digits.startsWith('55') && digits.length > 11
  const national = hasCountryCode ? digits.slice(2) : digits
  const prefix = hasCountryCode ? '+55 ' : ''

  if (national.length <= 2) return `${prefix}${national}`

  const areaCode = national.slice(0, 2)
  const number = national.slice(2)
  if (number.length <= 4) return `${prefix}(${areaCode}) ${number}`

  const splitAt = number.length > 8 ? 5 : 4
  return `${prefix}(${areaCode}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}`
}

export function createLeadPayload(formData, locationLike) {
  return {
    name: String(formData.get('name') || '').trim(),
    whatsapp: String(formData.get('whatsapp') || '').trim(),
    services: formData.getAll('services').map(String),
    source_url: locationLike.referrer || locationLike.href,
    company_website: String(formData.get('company_website') || ''),
  }
}

function isApprovedWhatsAppUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'wa.me' && /^\/\d+$/.test(url.pathname)
  } catch {
    return false
  }
}

export function createSubmitController({
  requestLead,
  navigate,
  readForm,
  setSubmitting,
  setStatus,
}) {
  let pending = false

  return {
    async submit() {
      if (pending) return false

      pending = true
      setSubmitting(true)
      setStatus('saving', 'Salvando seu contato…')

      try {
        const result = await requestLead(readForm())
        if (!result?.ok || !isApprovedWhatsAppUrl(result.whatsapp_url)) {
          throw new Error('invalid-response')
        }

        navigate(result.whatsapp_url)
        return true
      } catch {
        setStatus(
          'error',
          'Não foi possível salvar seu contato agora. Confira sua conexão e tente novamente.',
        )
        return false
      } finally {
        pending = false
        setSubmitting(false)
      }
    },
  }
}

export function createLeadRequester({
  fetchImpl = fetch,
  endpoint = SUPABASE_FUNCTION_URL,
  publishableKey = SUPABASE_PUBLISHABLE_KEY,
} = {}) {
  return async function requestLead(payload) {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: publishableKey,
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json().catch(() => null)
    if (!response.ok || !result) throw new Error('capture-failed')
    return result
  }
}

function connectContactForm() {
  const form = document.querySelector('[data-lead-form]')
  if (!form) return

  const phoneInput = form.querySelector('#lead-whatsapp')
  const submitButton = form.querySelector('[type="submit"]')
  const submitLabel = submitButton.querySelector('[data-submit-label]')
  const status = form.querySelector('[data-form-status]')
  const serviceInputs = [...form.querySelectorAll('input[name="services"]')]

  phoneInput.addEventListener('input', () => {
    phoneInput.value = formatBrazilianPhone(phoneInput.value)
  })

  const controller = createSubmitController({
    readForm: () => createLeadPayload(new FormData(form), {
      referrer: document.referrer,
      href: window.location.href,
    }),
    requestLead: createLeadRequester(),
    navigate: (url) => window.location.assign(url),
    setSubmitting: (submitting) => {
      submitButton.disabled = submitting
      submitButton.setAttribute('aria-busy', String(submitting))
      submitLabel.textContent = submitting ? 'Salvando contato…' : 'Continuar no WhatsApp'
    },
    setStatus: (state, message) => {
      status.dataset.state = state
      status.textContent = message
    },
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    status.textContent = ''
    delete status.dataset.state

    if (!form.reportValidity()) return
    if (!serviceInputs.some((input) => input.checked)) {
      status.dataset.state = 'error'
      status.textContent = 'Selecione pelo menos um serviço para continuar.'
      serviceInputs[0].focus()
      return
    }

    await controller.submit()
  })
}

if (typeof document !== 'undefined') connectContactForm()
