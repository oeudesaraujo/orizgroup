# Oriz Lead Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture every contact request in Supabase before routing the visitor to the correct Oriz WhatsApp conversation.

**Architecture:** A static `/contato/` page posts validated data to a public Supabase Edge Function. The function owns routing and message generation, inserts through a server-only Supabase client into an RLS-protected table, and returns a WhatsApp URL only after the insert succeeds.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Supabase Postgres, Supabase Edge Functions (Deno/TypeScript), `@supabase/supabase-js@2.95.0` inside the Edge Function.

**Spec:** `docs/superpowers/specs/2026-09-28-lead-capture-design.md`

## Global Constraints

- Preserve the existing static-site architecture and the `hostinger` publication branch.
- The form requires name, WhatsApp, and at least one of the six approved services.
- Eudes receives sites, SEO, creation of brand, and branding leads at `5511972121748`.
- Wallyson receives paid traffic and marketing strategy leads at `558882272079`.
- Mixed-area selections are stored as `Ambos` and routed first to Wallyson.
- The WhatsApp message contains the lead name and selected services, never the submitted telephone number.
- Persist the lead with status `Novo` before returning any WhatsApp destination.
- Expose no Supabase secret or service-role credential to browser code.
- Keep the leads table unreadable and unmodifiable by public roles.
- Do not add authentication, notifications, a site-admin interface, CRM automation, or visible CAPTCHA in this version.
- Resolve the exact production origin and target Supabase project before deploying; never guess either value.

## Review Focus

- A visitor selecting duplicate or reordered services should produce one normalized service list and the same responsible person; Task 2 tests this.
- A pasted Brazilian number containing spaces, parentheses, a leading `+55`, or punctuation should normalize without losing valid digits; Task 2 tests this.
- A rapid double-click must create at most one request from the page while the first submission is pending; Task 4 tests the disabled submitting state.
- A request from an unapproved origin or with a filled honeypot must not insert a row or reveal a WhatsApp URL; Task 3 tests both paths.
- A database failure or malformed function response must preserve the form and display a retryable error rather than redirecting; Tasks 3 and 4 test this.

---

## File Structure

- `supabase/schema/leads.sql` — versioned source for the `leads` table, constraints, grants, and RLS.
- `supabase/functions/capture-lead/lead-domain.mjs` — pure normalization, validation, ownership, and WhatsApp-message logic.
- `supabase/functions/capture-lead/handler.mjs` — HTTP/CORS/honeypot orchestration with an injected insert operation.
- `supabase/functions/capture-lead/index.ts` — Supabase runtime adapter and privileged database insert.
- `tests/lead-domain.test.mjs` — pure business-rule tests.
- `tests/capture-handler.test.mjs` — request/response and persistence-gating tests.
- `contato/index.html` — contact page structure and accessible form.
- `contato/contato.css` — page-specific responsive presentation.
- `contato/contato.mjs` — testable browser validation, submission controller, DOM adapter, API call, and redirect.
- `contato/config.mjs` — public Supabase function URL and publishable key only.
- `tests/contact-page.test.mjs` — static DOM/source checks for the contact page and browser behavior contract.
- `content/page-template.cjs` — generated-page navigation and CTA destinations.
- `scripts/generate-pages.cjs` — includes `/contato/` in the sitemap.
- `scripts/verify-site.cjs` — verifies the new route, CTA destinations, assets, and sitemap.
- `index.html`, `insights.html`, generated `servicos/**/index.html`, generated `cidades/**/index.html` — contact links and asset-version updates.
- `README.md` — documents lead capture, Supabase ownership, and safe configuration.

### Task 1: Provision the protected leads table

**Files:**
- Create: `supabase/schema/leads.sql`

**Interfaces:**
- Consumes: The target Supabase project selected from the user's connected projects.
- Produces: `public.leads(id, name, whatsapp, services, responsible, status, source_url, created_at)` with constraints and RLS.

- [ ] **Step 1: Resolve the deployment inputs**

List connected Supabase projects and inspect their current tables and migrations. If more than one project can plausibly host Oriz, ask the user to choose by displayed project name. Resolve the exact production website origin from repository/deployment configuration; if it is absent, ask the user for the live URL before Task 3.

- [ ] **Step 2: Run the red schema check**

Run a read-only query against the selected project:

```sql
select to_regclass('public.leads') as leads_table;
```

Expected: `leads_table` is `null`, proving the table does not yet exist. If it already exists, inspect its complete schema and policies, compare it with the spec, and stop for a migration adjustment instead of overwriting it.

- [ ] **Step 3: Write the table definition**

Create `supabase/schema/leads.sql` with a UUID primary key, required fields, `created_at default now()`, `status default 'Novo'`, checks for the four status values and three responsible values, a non-empty subset check for the six service slugs, and a `^[0-9]{10,13}$` WhatsApp check. Enable RLS, revoke table privileges from `anon` and `authenticated`, and create no public policies.

- [ ] **Step 4: Apply the schema as one named migration**

Apply the exact contents of `supabase/schema/leads.sql` with migration name `create_oriz_leads` to the selected project.

- [ ] **Step 5: Run the green schema checks**

Verify with table introspection and SQL assertions that the columns, defaults, checks, grants, and RLS match the file. Attempting to select or insert as a public role must not be permitted. Run Supabase security and performance advisors and resolve any issue caused by this migration.

- [ ] **Step 6: Commit**

```bash
git add supabase/schema/leads.sql
git commit -m "feat: add protected leads schema"
```

### Task 2: Implement and test the lead-routing domain

**Files:**
- Create: `supabase/functions/capture-lead/lead-domain.mjs`
- Create: `tests/lead-domain.test.mjs`

**Interfaces:**
- Produces: `normalizeLeadPayload(input) -> { ok: true, lead, targetNumber, message, whatsappUrl } | { ok: false, error }`.
- Produces: normalized `lead` with `{ name, whatsapp, services, responsible, status: 'Novo', source_url }`.
- Service slugs: `criacao-de-sites`, `seo`, `criacao-de-marca`, `branding`, `trafego-pago`, `estrategia-de-marketing`.

- [ ] **Step 1: Write the failing domain tests**

In `tests/lead-domain.test.mjs`, assert:

- empty services and unsupported services return `ok: false`;
- names shorter than 2 or longer than 100 characters are rejected after trimming;
- `+55 (11) 97212-1748` normalizes to `5511972121748` and valid 10–13 digit values remain accepted;
- duplicate services are removed while preserving the approved canonical order;
- Eudes-only selection returns `responsible: 'Eudes'` and target `5511972121748`;
- Wallyson-only selection returns `responsible: 'Wallyson'` and target `558882272079`;
- mixed selection returns `responsible: 'Ambos'` and target `558882272079`;
- the encoded WhatsApp message contains the normalized name and all service labels but not the submitted telephone number;
- an invalid or overlong `source_url` is rejected instead of stored.

- [ ] **Step 2: Run the domain tests to verify red**

Run: `node --test tests/lead-domain.test.mjs`

Expected: FAIL because `lead-domain.mjs` does not exist or does not export the required interface.

- [ ] **Step 3: Implement `normalizeLeadPayload(input)`**

Add the six-label allowlist, canonical ordering, field limits, telephone normalization, service ownership sets, `Ambos` rule, Portuguese list formatting, and `https://wa.me/{target}?text={encodedMessage}` construction. Return no WhatsApp URL on validation failure.

- [ ] **Step 4: Run the domain tests to verify green**

Run: `node --test tests/lead-domain.test.mjs`

Expected: all domain tests PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/capture-lead/lead-domain.mjs tests/lead-domain.test.mjs
git commit -m "feat: add lead routing rules"
```

### Task 3: Build and deploy the secure Edge Function

**Files:**
- Create: `supabase/functions/capture-lead/handler.mjs`
- Create: `supabase/functions/capture-lead/index.ts`
- Create: `tests/capture-handler.test.mjs`

**Interfaces:**
- Consumes: `normalizeLeadPayload(input)` from Task 2.
- Produces: `createCaptureHandler({ allowedOrigins, publishableKeys, insertLead }) -> (request: Request) => Promise<Response>`.
- `insertLead(lead) -> Promise<{ id: string }>` must reject on database failure.
- Public success response: `{ ok: true, whatsapp_url: string }` with HTTP 201.

- [ ] **Step 1: Write the failing handler tests**

In `tests/capture-handler.test.mjs`, use an in-memory insert dependency and assert:

- `OPTIONS` returns the CORS headers only for an approved origin;
- non-POST and non-JSON requests return 405/415;
- an unapproved origin returns 403 without calling `insertLead`;
- a missing or unrecognized `apikey` header returns 401 without calling `insertLead`;
- a filled `company_website` honeypot returns a generic accepted response without inserting or returning `whatsapp_url`;
- invalid payload returns 422 without inserting;
- a successful insert receives only the normalized lead and returns 201 with `whatsapp_url`;
- an insert rejection returns 503 and no `whatsapp_url`;
- the response never echoes the telephone number.

- [ ] **Step 2: Run the handler tests to verify red**

Run: `node --test tests/capture-handler.test.mjs`

Expected: FAIL because `handler.mjs` does not exist or lacks the required export.

- [ ] **Step 3: Implement the request handler**

Implement `createCaptureHandler` with strict origin matching, an exact match against the configured publishable-key values, explicit CORS headers, JSON size/type validation, honeypot handling, `normalizeLeadPayload`, insert-before-response ordering, generic server errors, and no leaked database details.

- [ ] **Step 4: Run the handler tests to verify green**

Run: `node --test tests/capture-handler.test.mjs`

Expected: all handler tests PASS.

- [ ] **Step 5: Implement the Supabase runtime adapter**

In `index.ts`, import `createClient` from pinned `npm:@supabase/supabase-js@2.95.0`; parse the platform-provided publishable-key and secret-key maps with legacy fallbacks; create a non-persisting admin client; bind the exact production and local-development origin allowlist plus every active publishable key; and pass an `insertLead` adapter that inserts into `public.leads` with `.select('id').single()`.

- [ ] **Step 6: Verify current Supabase guidance before deployment**

Recheck the Supabase changelog and official Edge Function documentation for breaking changes affecting API keys, CORS, `verify_jwt`, or environment variables. If current guidance conflicts with Step 5, update the adapter and this plan's implementation notes before deploying; do not silently use stale key placement.

- [ ] **Step 7: Deploy and test the function**

Deploy `capture-lead` with `verify_jwt: false` because no signed-in user JWT exists; the function's origin, publishable-key, payload, and honeypot checks remain active. Invoke invalid cases and assert the status codes above. Invoke one unique test lead, verify its exact stored values through a read-only SQL query, then remove only that tagged test row.

- [ ] **Step 8: Re-run database advisors and inspect function errors**

Expected: no new security advisory caused by the function/table, and no unexpected Edge Function error log for the verification window.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/capture-lead tests/capture-handler.test.mjs
git commit -m "feat: capture leads through Supabase"
```

### Task 4: Build the contact page and browser submission flow

**Files:**
- Create: `contato/index.html`
- Create: `contato/contato.css`
- Create: `contato/contato.mjs`
- Create: `contato/config.mjs`
- Create: `tests/contact-page.test.mjs`

**Interfaces:**
- Consumes: deployed `capture-lead` endpoint and active public publishable key from Task 3.
- Produces: a POST body `{ name, whatsapp, services, source_url, company_website }`.
- Consumes success `{ ok: true, whatsapp_url }`; redirects only for a valid `https://wa.me/` URL.
- Produces: `createSubmitController({ requestLead, navigate, readForm, setSubmitting, setStatus })`, allowing browser behavior to be tested without a real navigation.

- [ ] **Step 1: Write the failing contact-page tests**

Assert from the saved HTML and scripts that:

- the page has exactly one `h1`, required labelled name and telephone inputs, six checkbox values, a honeypot outside keyboard flow, a privacy note, and an `aria-live` status element;
- the module submits all checked service slugs and `document.referrer || location.href` as the source;
- `createSubmitController` calls `setSubmitting(true)` and ignores a second call while the first promise is pending;
- a rejected request calls `setSubmitting(false)`, never calls `navigate`, and reports a retryable error without clearing the form;
- a successful request calls `navigate` only after checking the response and only when `whatsapp_url` uses `https://wa.me/`;
- the browser configuration contains the resolved project URL and active publishable key, contains no placeholder, and contains no secret/service-role key pattern.

- [ ] **Step 2: Run the contact-page tests to verify red**

Run: `node --test tests/contact-page.test.mjs`

Expected: FAIL because the contact-page files do not exist.

- [ ] **Step 3: Create the meaningful contact-page slice**

Create semantic HTML with the existing Oriz header/menu/footer, a concise editorial heading, the visible form in the first viewport, checkbox cards for the six services, the privacy note, and loading/error hooks. Add responsive CSS that preserves the current palette and typography without horizontal overflow.

- [ ] **Step 4: Open the first meaningful preview**

Serve the static checkout at `http://127.0.0.1:4175/`, open `/contato/`, and confirm the recognizable desktop page and complete form are visible before adding network behavior.

- [ ] **Step 5: Implement the browser behavior**

Implement and export `createSubmitController`, then add the DOM adapter for telephone formatting, native/custom validity messages, multi-select serialization, one-in-flight submission protection, raw `fetch` to the Edge Function with `Content-Type: application/json` and the publishable key in `apikey`, safe response validation, error recovery, and `location.assign` only for the approved `wa.me` URL.

- [ ] **Step 6: Run the contact-page tests to verify green**

Run: `node --test tests/contact-page.test.mjs`

Expected: all contact-page tests PASS.

- [ ] **Step 7: Verify the page in desktop and mobile viewports**

Check 1280×800 and 390×844: labels remain readable, every checkbox and button is keyboard/touch operable, validation and saving/error states are visible, and `document.documentElement.scrollWidth <= innerWidth`. Do not complete or send a WhatsApp message during browser verification.

- [ ] **Step 8: Commit**

```bash
git add contato tests/contact-page.test.mjs
git commit -m "feat: add Oriz lead form"
```

### Task 5: Route every contact CTA through the form

**Files:**
- Modify: `content/page-template.cjs`
- Modify: `scripts/generate-pages.cjs`
- Modify: `scripts/verify-site.cjs`
- Modify: `index.html`
- Modify: `insights.html`
- Modify: `servicos/**/index.html` (generated)
- Modify: `cidades/**/index.html` (generated)
- Modify: `sitemap.xml` (generated)

**Interfaces:**
- Consumes: `/contato/` from Task 4.
- Produces: correct relative contact links from root, one-level, and two-level pages.

- [ ] **Step 1: Extend the site verifier first**

Add failing assertions that `/contato/index.html` exists, all main `VAMOS CONVERSAR`/`Conversar` CTAs resolve to it, no approved CTA still targets `index.html#contato`, the sitemap contains `/contato/`, and every contact asset uses the new cache token.

- [ ] **Step 2: Run the site verifier to verify red**

Run: `node scripts/verify-site.cjs`

Expected: FAIL for missing contact route/sitemap entry and legacy CTA destinations.

- [ ] **Step 3: Update templates, hand-authored pages, and sitemap generation**

Change root links to `contato/`, one-level links to `../contato/`, and two-level links to `../../contato/`. Keep the home contact section as an editorial CTA whose button now links to the page. Add `/contato/` to generated sitemap routes and bump the shared asset cache token once across all pages.

- [ ] **Step 4: Regenerate derived pages**

Run: `node scripts/generate-pages.cjs`

Expected: 6 service pages, 6 city pages, 2 indexes, and the sitemap regenerate without error.

- [ ] **Step 5: Run the full static suite to verify green**

Run: `node scripts/verify-site.cjs`

Expected: PASS for 15 routes, contact links, metadata, schema, assets, and sitemap.

- [ ] **Step 6: Commit**

```bash
git add content/page-template.cjs scripts/generate-pages.cjs scripts/verify-site.cjs index.html insights.html servicos cidades sitemap.xml
git commit -m "feat: route contact CTAs through lead capture"
```

### Task 6: End-to-end verification, documentation, and publication

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks 1–5 as one complete user journey.
- Produces: verified and published `hostinger` branch with documented Supabase ownership.

- [ ] **Step 1: Update operational documentation**

Document the `/contato/` route, the `leads` table/status workflow, where public configuration lives, the Edge Function name, safe key rules, commands for generation/tests, and how to inspect leads in Supabase Table Editor. Remove outdated README statements that the site has no backend or still needs WhatsApp integration.

- [ ] **Step 2: Run every automated check from a clean state**

Run:

```bash
node --test tests/*.test.mjs
node scripts/generate-pages.cjs
node scripts/verify-site.cjs
git diff --check
```

Expected: all tests PASS, generation succeeds, verifier reports 15 routes, and `git diff --check` prints no errors.

- [ ] **Step 3: Run the live persistence check**

Submit one uniquely tagged test payload to the deployed function, query the row by its unique telephone/source marker, verify `services`, `responsible`, `status = 'Novo'`, and `created_at`, verify the returned WhatsApp host/target/message without sending it, then remove only that test row.

- [ ] **Step 4: Run final browser verification**

Verify the Home CTA reaches `/contato/`, the form remains correct at desktop/mobile sizes, a simulated failure preserves inputs, and there are no console errors or broken local assets.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md
git commit -m "docs: document lead capture operations"
```

- [ ] **Step 6: Review the complete branch**

Inspect the full diff for credentials, accidental user data, stale contact anchors, ungenerated files, and scope beyond the approved spec. Confirm `git status --short` is clean.

- [ ] **Step 7: Publish and verify**

Push the reviewed HEAD to `origin/hostinger`, confirm `refs/heads/hostinger` resolves to the local commit, and report the commit plus the Supabase table/function verification result. If Hostinger deployment status is available, confirm it; otherwise state only that the publication branch was updated.
