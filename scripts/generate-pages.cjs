const fs = require('node:fs')
const path = require('node:path')
const { services, cities } = require('../content/site-content.cjs')
const { renderService, renderCity, renderIndex } = require('../content/page-template.cjs')
const { staticPageSchema, ids } = require('../content/schema.cjs')

const root = path.resolve(__dirname, '..')
const productionOrigin = 'https://orizgroup.com.br'

function write(relative, html) {
  const filename = path.join(root, relative)
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(filename, `${html.trim()}\n`, 'utf8')
}

function writeSchema(relative, schema) {
  const filename = path.join(root, relative)
  const html = fs.readFileSync(filename, 'utf8')
  const script = `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`
  const schemaPattern = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i
  if (!schemaPattern.test(html)) throw new Error(`Bloco JSON-LD ausente em ${relative}`)
  const next = html.replace(schemaPattern, script)
  fs.writeFileSync(filename, next, 'utf8')
}

write('servicos/index.html', renderIndex('services'))
write('cidades/index.html', renderIndex('cities'))
services.forEach((service) => write(`servicos/${service.slug}/index.html`, renderService(service)))
cities.forEach((city) => write(`cidades/${city.slug}/index.html`, renderCity(city)))

writeSchema('index.html', staticPageSchema({
  url: `${productionOrigin}/`,
  name: 'Oriz — Estratégia que conecta. Marca que cresce.',
  description: 'Oriz Marketing. Estratégia, criatividade e performance conectadas para construir a próxima fase da sua marca.',
  mainEntityId: ids.organization,
}))
writeSchema('contato/index.html', staticPageSchema({
  type: 'ContactPage',
  url: `${productionOrigin}/contato/`,
  name: 'Vamos conversar — Oriz Marketing',
  description: 'Conte à Oriz o que sua empresa precisa e continue a conversa com o especialista certo.',
}))
writeSchema('insights.html', staticPageSchema({
  type: 'CollectionPage',
  url: `${productionOrigin}/insights.html`,
  name: 'Insights — Oriz Marketing',
  description: 'Ideias sobre estratégia, marca e presença digital. Insights da Oriz Marketing.',
}))

const routes = [
  '/', '/servicos/', '/cidades/', '/contato/',
  ...services.map((service) => `/servicos/${service.slug}/`),
  ...cities.map((city) => `/cidades/${city.slug}/`),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${productionOrigin}${route}</loc></url>`).join('\n')}\n</urlset>\n`
write('sitemap.xml', sitemap)

console.log(`Geradas ${services.length} páginas de serviço, ${cities.length} páginas de cidade e 2 índices.`)
