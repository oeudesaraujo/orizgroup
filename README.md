# Oriz Marketing — site institucional

Site estático, responsivo e sem backend, construído em HTML, CSS e JavaScript. A Home apresenta a marca; seis páginas de serviço e seis páginas de cidade aprofundam a atuação da Oriz.

## Estrutura

- `/index.html`: Home institucional.
- `/servicos/`: índice e páginas de Tráfego Pago, Estratégia de Marketing, Criação de Sites, SEO, Criação de Marca e Branding.
- `/cidades/`: índice e páginas de Itapipoca, Fortaleza, Trairi, Amontada, Itapajé e Sobral.
- `/content/site-content.cjs`: copy, responsáveis, entregas, processos e FAQs das páginas geradas.
- `/content/page-template.cjs`: templates compartilhados.
- `/scripts/generate-pages.cjs`: geração determinística do HTML.
- `/scripts/verify-site.cjs`: auditoria de rotas, links, metadados, schemas e responsáveis.

## Atualizar páginas

Na pasta do site:

```sh
node scripts/generate-pages.cjs
node scripts/verify-site.cjs
```

O primeiro comando regenera as páginas e o `sitemap.xml`. O segundo confirma 14 páginas, links internos, metadados únicos e a autoria correta de cada serviço.

## Responsáveis

- Wallyson: Tráfego Pago e Estratégia de Marketing.
- Eudes: Criação de Sites, SEO, Criação de Marca e Branding.

As bios pessoais permanecem em Lorem Ipsum até o envio dos textos definitivos.

## Antes do lançamento comercial

- Conectar WhatsApp e e-mail oficiais no CTA.
- Substituir as bios e os retratos temporários de Eudes e Wallyson.
- Confirmar o domínio e trocar os caminhos relativos do sitemap por URLs absolutas.
- Definir uma imagem Open Graph oficial.

Não há cases, métricas, endereço físico, depoimentos ou certificações inventadas. A tipografia usa Google Fonts com alternativas locais; bibliotecas 3D estão incluídas em `vendor/` com suas licenças.
