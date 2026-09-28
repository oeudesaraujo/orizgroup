import { normalizeLeadPayload } from './lead-domain.mjs'

const MAX_BODY_BYTES = 16_384

function corsHeaders(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'apikey, content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  })
}

export function createCaptureHandler({ allowedOrigins, publishableKeys, insertLead }) {
  const origins = new Set(allowedOrigins)
  const keys = new Set(publishableKeys)

  if (origins.size === 0 || keys.size === 0 || typeof insertLead !== 'function') {
    throw new TypeError('Capture handler configuration is incomplete.')
  }

  return async function captureLead(request) {
    const origin = request.headers.get('origin') || ''
    if (!origins.has(origin)) {
      return Response.json({ ok: false, error: 'Origem não autorizada.' }, { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    const apiKey = request.headers.get('apikey') || ''
    if (!keys.has(apiKey)) return json(401, { ok: false, error: 'Acesso não autorizado.' }, origin)
    if (request.method !== 'POST') return json(405, { ok: false, error: 'Método não permitido.' }, origin)

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return json(415, { ok: false, error: 'Envie os dados em formato JSON.' }, origin)
    }

    const declaredLength = Number(request.headers.get('content-length') || 0)
    if (declaredLength > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: 'Envio muito grande.' }, origin)
    }

    let payload
    try {
      const raw = await request.text()
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json(413, { ok: false, error: 'Envio muito grande.' }, origin)
      }
      payload = JSON.parse(raw)
    } catch {
      return json(400, { ok: false, error: 'Não foi possível ler os dados enviados.' }, origin)
    }

    if (typeof payload?.company_website === 'string' && payload.company_website.trim()) {
      return json(202, { ok: true }, origin)
    }

    const normalized = normalizeLeadPayload(payload)
    if (!normalized.ok) return json(422, normalized, origin)

    try {
      await insertLead(normalized.lead)
    } catch {
      return json(503, {
        ok: false,
        error: 'Não foi possível salvar seu contato agora. Tente novamente.',
      }, origin)
    }

    return json(201, { ok: true, whatsapp_url: normalized.whatsappUrl }, origin)
  }
}
