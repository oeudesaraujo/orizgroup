# Oriz Marketing — site institucional

Site institucional responsivo construído em HTML, CSS e JavaScript, com captação segura de contatos no Supabase. A Home apresenta a marca; seis páginas de serviço e seis páginas de cidade aprofundam a atuação da Oriz.

## Estrutura

- `/index.html`: Home institucional.
- `/servicos/`: índice e páginas de Tráfego Pago, Estratégia de Marketing, Criação de Sites, SEO, Criação de Marca e Branding.
- `/cidades/`: índice e páginas de Itapipoca, Fortaleza, Trairi, Amontada, Itapajé e Sobral.
- `/contato/`: formulário que salva o lead antes de encaminhar a conversa ao WhatsApp responsável.
- `/content/site-content.cjs`: copy, responsáveis, entregas, processos e FAQs das páginas geradas.
- `/content/page-template.cjs`: templates compartilhados.
- `/scripts/generate-pages.cjs`: geração determinística do HTML.
- `/scripts/verify-site.cjs`: auditoria de rotas, links, metadados, schemas e responsáveis.
- `/supabase/schema/leads.sql`: definição versionada da tabela protegida de leads.
- `/supabase/functions/capture-lead/`: função que valida, salva e roteia cada solicitação.

## Atualizar páginas

Na pasta do site:

```sh
node scripts/generate-pages.cjs
node scripts/verify-site.cjs
```

O primeiro comando regenera as páginas e o `sitemap.xml`. O segundo confirma 15 páginas, links internos, metadados únicos e a autoria correta de cada serviço.

Para executar todos os testes do formulário e do roteamento:

```sh
node --test tests/*.test.mjs
```

## Captação de contatos

O projeto Supabase de produção é `oriz-group`. A função pública se chama `capture-lead` e grava em `public.leads` somente depois de validar nome, WhatsApp, serviços, origem e o campo antispam.

Os leads podem ser acompanhados no Table Editor do Supabase. O campo `status` aceita `Novo`, `Em atendimento`, `Atendido` e `Não convertido`. A atribuição é automática: solicitações de Digital e Marca vão para Eudes, solicitações de Performance e Estratégia vão para Wallyson e combinações das duas áreas ficam como `Ambos`.

`/contato/config.js` contém apenas a URL pública da função e a chave publicável. Chaves `service_role` ou `sb_secret_` nunca devem ser adicionadas ao navegador ou ao repositório. A função usa o segredo disponibilizado pelo próprio ambiente Supabase.

O domínio oficial `https://orizgroup.com.br` já está autorizado. Para publicar em outro domínio, inclua a nova origem HTTPS exata em `ORIZ_ALLOWED_ORIGINS` e publique uma nova versão da função. Origens não autorizadas recebem bloqueio antes de qualquer gravação.

## Responsáveis

- Wallyson: Tráfego Pago e Estratégia de Marketing.
- Eudes: Criação de Sites, SEO, Criação de Marca e Branding.

## Antes do lançamento comercial

- Confirmar o domínio e trocar os caminhos relativos do sitemap por URLs absolutas.
- Definir uma imagem Open Graph oficial.

Não há cases, métricas, endereço físico, depoimentos ou certificações inventadas. A tipografia usa Google Fonts com alternativas locais; bibliotecas 3D estão incluídas em `vendor/` com suas licenças.
