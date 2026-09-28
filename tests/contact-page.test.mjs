import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createLeadPayload,
  createSubmitController,
  formatBrazilianPhone,
} from '../contato/contato.js'
import { SUPABASE_FUNCTION_URL, SUPABASE_PUBLISHABLE_KEY } from '../contato/config.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('contact page exposes the complete accessible lead form', () => {
  const html = fs.readFileSync(path.join(root, 'contato/index.html'), 'utf8')
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.match(html, /<label[^>]+for="lead-name"/)
  assert.match(html, /<input[^>]+id="lead-name"[^>]+required/)
  assert.match(html, /<label[^>]+for="lead-whatsapp"/)
  assert.match(html, /<input[^>]+id="lead-whatsapp"[^>]+required/)
  assert.match(html, /aria-live="polite"/)
  assert.match(html, /<script type="module" src="contato\.js\?[^"\s]+"><\/script>/)
  assert.match(html, /name="company_website"[^>]+tabindex="-1"[^>]+autocomplete="off"/)

  const serviceValues = [...html.matchAll(/name="services"\s+value="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(serviceValues, [
    'criacao-de-sites',
    'seo',
    'criacao-de-marca',
    'branding',
    'trafego-pago',
    'estrategia-de-marketing',
  ])
  assert.match(html, /usados pela Oriz para responder/)
})

test('public Supabase configuration contains no placeholder or secret key', () => {
  assert.equal(SUPABASE_FUNCTION_URL, 'https://ehspygnbzjdplobkrmtc.supabase.co/functions/v1/capture-lead')
  assert.match(SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/)
  assert.doesNotMatch(SUPABASE_PUBLISHABLE_KEY, /service_role|sb_secret_/i)
  assert.doesNotMatch(`${SUPABASE_FUNCTION_URL}${SUPABASE_PUBLISHABLE_KEY}`, /placeholder|your-project|TODO/i)
})

test('formats Brazilian telephone input without losing digits', () => {
  assert.equal(formatBrazilianPhone('11972121748'), '(11) 97212-1748')
  assert.equal(formatBrazilianPhone('8532321010'), '(85) 3232-1010')
  assert.equal(formatBrazilianPhone('+55 (11) 97212-1748'), '+55 (11) 97212-1748')
})

test('serializes every selected service and the best available source URL', () => {
  const data = new FormData()
  data.set('name', ' Ana Maria ')
  data.set('whatsapp', '+55 (11) 97212-1748')
  data.append('services', 'seo')
  data.append('services', 'trafego-pago')
  data.set('company_website', '')

  assert.deepEqual(createLeadPayload(data, {
    referrer: 'https://oriz.example/servicos/seo/',
    href: 'https://oriz.example/contato/',
  }), {
    name: 'Ana Maria',
    whatsapp: '+55 (11) 97212-1748',
    services: ['seo', 'trafego-pago'],
    source_url: 'https://oriz.example/servicos/seo/',
    company_website: '',
  })
})

test('prevents a second submission while the first request is pending', async () => {
  let resolveRequest
  let requests = 0
  const pending = new Promise((resolve) => { resolveRequest = resolve })
  const submittingStates = []
  const controller = createSubmitController({
    readForm: () => ({ name: 'Ana', whatsapp: '11999990000', services: ['seo'] }),
    requestLead: async () => { requests += 1; return pending },
    navigate: () => {},
    setSubmitting: (value) => submittingStates.push(value),
    setStatus: () => {},
  })

  const first = controller.submit()
  const second = await controller.submit()
  assert.equal(second, false)
  assert.equal(requests, 1)
  assert.equal(submittingStates[0], true)

  resolveRequest({ ok: true, whatsapp_url: 'https://wa.me/5511972121748?text=Oi' })
  await first
  assert.equal(submittingStates.at(-1), false)
})

test('keeps form data and reports a retryable error when capture fails', async () => {
  const statuses = []
  const navigations = []
  let reads = 0
  const controller = createSubmitController({
    readForm: () => { reads += 1; return { name: 'Ana', whatsapp: '11999990000', services: ['seo'] } },
    requestLead: async () => { throw new Error('offline') },
    navigate: (url) => navigations.push(url),
    setSubmitting: () => {},
    setStatus: (state, message) => statuses.push([state, message]),
  })

  assert.equal(await controller.submit(), false)
  assert.equal(reads, 1)
  assert.deepEqual(navigations, [])
  assert.deepEqual(statuses.at(-1), [
    'error',
    'Não foi possível salvar seu contato agora. Confira sua conexão e tente novamente.',
  ])
})

test('navigates only to a validated wa.me success URL', async () => {
  const navigations = []
  const base = {
    readForm: () => ({ name: 'Ana', whatsapp: '11999990000', services: ['seo'] }),
    navigate: (url) => navigations.push(url),
    setSubmitting: () => {},
    setStatus: () => {},
  }

  const unsafe = createSubmitController({
    ...base,
    requestLead: async () => ({ ok: true, whatsapp_url: 'https://attacker.example/' }),
  })
  assert.equal(await unsafe.submit(), false)
  assert.deepEqual(navigations, [])

  const safeUrl = 'https://wa.me/558882272079?text=Ol%C3%A1'
  const safe = createSubmitController({
    ...base,
    requestLead: async () => ({ ok: true, whatsapp_url: safeUrl }),
  })
  assert.equal(await safe.submit(), true)
  assert.deepEqual(navigations, [safeUrl])
})
