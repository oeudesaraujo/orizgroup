const fs = require('node:fs')
const path = require('node:path')
const { services, cities } = require('../content/site-content.cjs')
const { renderService, renderCity, renderIndex } = require('../content/page-template.cjs')

const root = path.resolve(__dirname, '..')

function write(relative, html) {
  const filename = path.join(root, relative)
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(filename, `${html.trim()}\n`, 'utf8')
}

write('servicos/index.html', renderIndex('services'))
write('cidades/index.html', renderIndex('cities'))
services.forEach((service) => write(`servicos/${service.slug}/index.html`, renderService(service)))
cities.forEach((city) => write(`cidades/${city.slug}/index.html`, renderCity(city)))

const routes = [
  '/', '/servicos/', '/cidades/', '/contato/',
  ...services.map((service) => `/servicos/${service.slug}/`),
  ...cities.map((city) => `/cidades/${city.slug}/`),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Caminhos relativos: definir a origem oficial antes do envio a mecanismos de busca. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${route}</loc></url>`).join('\n')}\n</urlset>\n`
write('sitemap.xml', sitemap)

console.log(`Geradas ${services.length} páginas de serviço, ${cities.length} páginas de cidade e 2 índices.`)
