const SERVICE_DEFINITIONS = [
  ['criacao-de-sites', 'Criação de sites', 'Eudes'],
  ['seo', 'SEO', 'Eudes'],
  ['criacao-de-marca', 'Criação de marca', 'Eudes'],
  ['branding', 'Branding', 'Eudes'],
  ['trafego-pago', 'Tráfego pago', 'Wallyson'],
  ['estrategia-de-marketing', 'Estratégia de marketing', 'Wallyson'],
]

const SERVICES = new Map(
  SERVICE_DEFINITIONS.map(([slug, label, owner]) => [slug, { label, owner }]),
)

const TARGETS = {
  Eudes: '5511972121748',
  Wallyson: '558882272079',
}

function invalid(error) {
  return { ok: false, error }
}

function formatPortugueseList(items) {
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`
}

function normalizeSourceUrl(value) {
  if (value == null || value === '') return { ok: true, value: null }
  if (typeof value !== 'string' || value.length > 2048) return { ok: false }

  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return { ok: false }
    return { ok: true, value: url.href }
  } catch {
    return { ok: false }
  }
}

export function normalizeLeadPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('Não foi possível validar seus dados.')
  }

  const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : ''
  if (name.length < 2 || name.length > 100) return invalid('Informe um nome válido.')

  const whatsapp = typeof input.whatsapp === 'string' ? input.whatsapp.replace(/\D/g, '') : ''
  if (!/^\d{10,13}$/.test(whatsapp)) return invalid('Informe um WhatsApp válido.')

  if (!Array.isArray(input.services) || input.services.length === 0) {
    return invalid('Selecione pelo menos um serviço.')
  }

  if (input.services.some((service) => typeof service !== 'string' || !SERVICES.has(service))) {
    return invalid('Selecione apenas serviços disponíveis.')
  }

  const selected = new Set(input.services)
  const services = SERVICE_DEFINITIONS.map(([slug]) => slug).filter((slug) => selected.has(slug))
  const owners = new Set(services.map((slug) => SERVICES.get(slug).owner))
  const responsible = owners.size > 1 ? 'Ambos' : [...owners][0]
  const targetNumber = responsible === 'Eudes' ? TARGETS.Eudes : TARGETS.Wallyson

  const source = normalizeSourceUrl(input.source_url)
  if (!source.ok) return invalid('A origem do contato é inválida.')

  const labels = services.map((slug) => SERVICES.get(slug).label)
  const message = `Olá, sou ${name}. Tenho interesse em ${formatPortugueseList(labels)} e cheguei pelo site da Oriz.`
  const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`

  return {
    ok: true,
    lead: {
      name,
      whatsapp,
      services,
      responsible,
      status: 'Novo',
      source_url: source.value,
    },
    targetNumber,
    message,
    whatsappUrl,
  }
}
