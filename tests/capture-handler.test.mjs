import test from 'node:test'
import assert from 'node:assert/strict'

import { createCaptureHandler } from '../supabase/functions/capture-lead/handler.mjs'

const origin = 'https://oriz.example'
const apiKey = 'sb_publishable_test'
const validBody = {
  name: 'Maria Souza',
  whatsapp: '+55 (85) 99999-0000',
  services: ['seo'],
  source_url: 'https://oriz.example/contato/',
  company_website: '',
}

function request(body = validBody, overrides = {}) {
  const { headers = {}, ...requestOverrides } = overrides
  return new Request('https://project.supabase.co/functions/v1/capture-lead', {
    method: 'POST',
    headers: {
      origin,
      apikey: apiKey,
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
    ...requestOverrides,
  })
}

function setup(insertLead = async () => ({ id: 'lead-1' })) {
  const inserted = []
  const handler = createCaptureHandler({
    allowedOrigins: [origin, 'http://127.0.0.1:4175'],
    publishableKeys: [apiKey],
    insertLead: async (lead) => {
      inserted.push(lead)
      return insertLead(lead)
    },
  })
  return { handler, inserted }
}

test('answers approved preflight requests with scoped CORS headers', async () => {
  const { handler } = setup()
  const response = await handler(new Request('https://project.supabase.co/functions/v1/capture-lead', {
    method: 'OPTIONS',
    headers: { origin },
  }))

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS')
  assert.match(response.headers.get('access-control-allow-headers'), /apikey/)
})

test('rejects methods other than POST', async () => {
  const { handler } = setup()
  const response = await handler(new Request('https://project.supabase.co/functions/v1/capture-lead', {
    method: 'GET',
    headers: { origin, apikey: apiKey },
  }))
  assert.equal(response.status, 405)
})

test('rejects non-JSON submissions', async () => {
  const { handler } = setup()
  const response = await handler(request(validBody, { headers: { 'content-type': 'text/plain' } }))
  assert.equal(response.status, 415)
})

test('rejects an unapproved origin without inserting', async () => {
  const { handler, inserted } = setup()
  const response = await handler(request(validBody, { headers: { origin: 'https://attacker.example' } }))
  assert.equal(response.status, 403)
  assert.equal(inserted.length, 0)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
})

test('rejects a missing or unrecognized publishable key without inserting', async () => {
  const { handler, inserted } = setup()
  const missing = await handler(request(validBody, { headers: { apikey: '' } }))
  const unknown = await handler(request(validBody, { headers: { apikey: 'sb_publishable_wrong' } }))
  assert.equal(missing.status, 401)
  assert.equal(unknown.status, 401)
  assert.equal(inserted.length, 0)
})

test('absorbs honeypot submissions without inserting or returning a WhatsApp URL', async () => {
  const { handler, inserted } = setup()
  const response = await handler(request({ ...validBody, company_website: 'spam.example' }))
  const body = await response.json()
  assert.equal(response.status, 202)
  assert.deepEqual(body, { ok: true })
  assert.equal(inserted.length, 0)
})

test('returns validation errors without inserting', async () => {
  const { handler, inserted } = setup()
  const response = await handler(request({ ...validBody, services: [] }))
  const body = await response.json()
  assert.equal(response.status, 422)
  assert.equal(body.ok, false)
  assert.equal(body.error, 'Selecione pelo menos um serviço.')
  assert.equal(inserted.length, 0)
})

test('inserts only normalized fields before returning the WhatsApp URL', async () => {
  const { handler, inserted } = setup()
  const response = await handler(request())
  const body = await response.json()

  assert.equal(response.status, 201)
  assert.deepEqual(inserted, [{
    name: 'Maria Souza',
    whatsapp: '5585999990000',
    services: ['seo'],
    responsible: 'Eudes',
    status: 'Novo',
    source_url: 'https://oriz.example/contato/',
  }])
  assert.equal(body.ok, true)
  assert.match(body.whatsapp_url, /^https:\/\/wa\.me\/5511972121748\?text=/)
  assert.equal(JSON.stringify(body).includes('5585999990000'), false)
})

test('returns a retryable server error and no destination when insertion fails', async () => {
  const { handler } = setup(async () => { throw new Error('database unavailable') })
  const response = await handler(request())
  const body = await response.json()
  assert.equal(response.status, 503)
  assert.deepEqual(body, {
    ok: false,
    error: 'Não foi possível salvar seu contato agora. Tente novamente.',
  })
  assert.equal('whatsapp_url' in body, false)
})
