# Cahan Academy · Ornate design system

This is the contract for every page in the client. If you restyle a page, read this file top to bottom, use only
what it describes, and run the checks in [Verification](#verification). Live gallery of everything below (dev
server only): **http://localhost:5173/_kit** (`src/pages/dev/KitPreview.jsx`).

Mood: a manuscript academy in deep wine: lace and satin at the edges, parchment for reading, a calligraphic hand
for headings, small-caps for labels. The ornament frames the data and never hides it. Tables, forms and numbers
stay crisp.

---

## 1. Colour law

**Only `#5C000E`, `#FFFFFF` and `#000000` exist in the UI.** Mathematically: every rendered colour (after alpha
compositing onto what is behind it) lies on the polyline **white → #5C000E → black**, tolerance ±4 per channel.
Pure white and pure black are on the line. **Neutral greys (r≈g≈b, not 0/255) are violations**, and so are blues,
greens, reds, ambers, and the old `#7B001C`.

Tone notation used in `index.css` comments: `s = 0` white, `s = 1` #5C000E, `s = 2` black.

| segment | formula | examples |
|---|---|---|
| white → wine (`0 ≤ s ≤ 1`) | `rgb(255-163s, 255-255s, 255-241s)` | `#FAF7F8` (.03), `#E2D1D4` (.18), `#C6A6AB` (.35), `#86424D` (.74) |
| wine → black (`1 ≤ s ≤ 2`) | `rgb(92(2-s), 0, 14(2-s))` | `#4A000B` (1.2), `#2E0007` (1.5), `#1E0005` (1.67), `#170004` (1.75) |

**Alpha rule.** Compositing stays on the line only when both colours are on the same segment:

- `#5C000E` with alpha (`rgba(92,0,14,a)`, `bg-wine/10`, `bg-bordo/20`) is safe over **any** allowed colour. Use it for overlays, tints, hovers, shadows in light mode.
- `rgba(0,0,0,a)` is safe only over the wine→black segment (dark surfaces). Over white it makes grey. Allowed only in token files.
- `rgba(255,255,255,a)` is safe only over the white→wine segment. Over dark wine it makes grey-pink. Allowed only in token files.
- **Never** put an opacity modifier on a token (`text-[var(--muted-foreground)]/60`, `text-ink-muted/70`, `border-line/50`). Pick the token that already has the tone you want (`ink-subtle`, `line-hair` …).
- Do not put `opacity-*` on elements whose content is a tint over a dark backdrop. In dark mode `opacity-60` on rose text turns it brownish grey. Use a token instead.

**Status without colour** (green/red are gone). Meaning is carried by **fill pattern + icon + text**, never colour alone:

| status | look | icon | use for |
|---|---|---|---|
| `success` | filled (solid wine) | check | done, passed, paid, approved, active |
| `present` | filled | check-check | attendance present |
| `late` | striped | clock | late, in progress |
| `partial` | striped | hourglass | partly paid / graded |
| `absent` | outline | x | absent, not submitted |
| `pending` | outline | circle | not started, upcoming, awaiting review |
| `excused` | dotted | feather | excused, optional |
| `warning` | dashed | alert-triangle | due soon, needs attention |
| `error` | alert (heavy outline, bold, soft fill) | alert-octagon | failed, overdue, rejected |
| `info` / `neutral` | muted | info / minus | informational, draft, archived |

Errors in forms: 1.5px border in `--accent-text` + `AlertCircle` icon + bold message (`FormField error=`).
Destructive buttons: `variant="danger"` (heavy outline + alert/trash icon).

**Charts**: one series = wine (`--accent-text`); more series = wine + `--ornament-soft` + dashed / dotted strokes and
different markers (circle, diamond, square). Grid lines `--line-hair`. No other hues.

**Exempt**: photos users upload. Render them through `<Avatar>` (which marks `data-user-image`) or add
`data-user-image` yourself. Third-party iframes are skipped by the audit (the Google button is invisible under our
own pill, see `GoogleButton`).

**Google sign-in**: the official multicolour G is off-palette. `components/common/GoogleButton.jsx` shows an
outline pill with a monochrome G (Simple Icons, CC0) and keeps Google's real button transparent on top (it issues
the ID token the API needs).

---

## 2. Tokens

All tokens live in `client/src/index.css` (`:root` = light, `.dark` = dark, `.theme-wine` = a wine panel in either
theme). Tailwind utilities exist for the semantic ones (`@theme inline`):

| token | Tailwind | light | dark | use |
|---|---|---|---|---|
| `--page` | `bg-page` | `#FAF7F8` | `#120003` | app background |
| `--surface` | `bg-surface` | `#FFFFFF` | `#1E0005` | cards, menus, modals |
| `--surface-2` | `bg-surface-2` | `#F5F0F1` | `#270006` | hover, muted fills, disabled |
| `--surface-3` | `bg-surface-3` | `#EBE0E2` | `#370008` | pressed / selected |
| `--paper` | `bg-paper` (+ `.paper`) | `#F8F4F4` | `#170004` | parchment panels (texture via `.paper`/`.card-paper`) |
| `--paper-base`, `--page-base` | — | | | the theme's paper/page even inside `.theme-wine` (wave fills) |
| `--field` | `bg-field` | `#FFFFFF` | `#170004` | inputs |
| `--ink` | `text-ink` | `#170004` | `#FFFFFF` | body text, data |
| `--ink-muted` | `text-ink-muted` | `#86424D` | `#C19EA3` | secondary text (AA on surface) |
| `--ink-subtle` | `text-ink-subtle` | `#A5737A` | `#A06B73` | placeholders, disabled, tertiary |
| `--accent` | `bg-accent` | `#5C000E` | `#5C000E` | primary fills (white inside `.theme-wine`) |
| `--accent-hover` | `bg-accent-hover` | `#4A000B` | `#742632` | primary hover |
| `--accent-fg` | `text-accent-fg` | `#FFFFFF` | `#FFFFFF` | text on accent |
| `--accent-text` | `text-accent-text` | `#5C000E` | `#E2D1D4` | links, active labels, icons, outline-button text |
| `--accent-soft` | `bg-accent-soft` | `#F2EBEC` | `#2E0007` | soft badge / selected row |
| `--line` | `border-line` | `#E2D1D4` | `#4A000B` | default borders |
| `--line-strong` | `border-line-strong` | `#C6A6AB` | `#803843` | inputs, table header rule, outline buttons |
| `--line-hair` | `border-line-hair` | `#F0E8E9` | `#2E0007` | row rules, inner frames |
| `--ornament` / `-soft` / `-strong` | `text-ornament…` | `#5C000E` / `#C6A6AB` / `#3C0009` | `#B68C93` / `#742632` / `#E2D1D4` | SVG ornaments (currentColor) |
| `--focus`, `--focus-soft` | `outline-focus` | wine | `#E2D1D4` | focus ring (global `:focus-visible`) |
| `--overlay` | — | wine .32 | black .6 | modal backdrop |
| `--shadow-sm/md/lg`, `--glow-inset` | `shadow-[var(--shadow-md)]` | wine alpha | black alpha | elevation, inner glow |
| `--radius-sm/md/lg/xl` | `rounded-[var(--radius-lg)]` | 8/12/18/26px | | |

Legacy aliases (`--background`, `--foreground`, `--card`, `--border`, `--muted`, `--muted-foreground`, `--input`,
`--primary`, `--bordo-contrast`, `--bordo-muted`, `--destructive`) still resolve to the new tokens so pages that
are not migrated keep working. **Do not use them in migrated code.** `bg-bordo` / `text-bordo` remain (= `#5C000E`).

`.theme-wine` on any element turns its subtree into a deep wine panel with dark-theme tokens and dark ornament
variants (`dark:` utilities apply inside it too). Use it for auth heroes and wine bands. `.login-hero` adds the
radial wine gradient + grain.

---

## 3. Typography

| role | family | token / class | rules |
|---|---|---|---|
| Script titles | **Great Vibes** | `font-script`, `.script-title`, `<ScriptTitle>` | page and section titles, empty-state line, auth hero line. **Never** for data, buttons, inputs, tables, nav. |
| Body + data | **EB Garamond** (400/500/600/700 + italic) | `font-serif` (default body) | everything readable. `.num` = lining tabular figures for tables/stats. `.time-italic` for times. |
| Small caps | **Cormorant SC** (500/600/700) | `font-sc`, `.sc` | labels, table headers, buttons, badges, subtitles, eyebrow, nav meta. Letter-spacing ~.1em is built in. Always rendered `text-transform: uppercase` with `<html lang>` synced to the UI language: Cormorant SC draws lowercase `i` as a dotless small cap, which reads as Azerbaijani "ı" — uppercase + `lang="az"` gives the correct "İ". Never remove the uppercase from SC styles. |

All three cover Azerbaijani (`əƏğĞıİşŞçÇöÖüÜ`) and Cyrillic. Proof: `python client/scripts/font-coverage.py` (uses
fontTools on the shipped woff2 files and their `unicode-range`). Fonts are self-hosted via `@fontsource`
(`src/fonts.js`, `font-display: swap`). Body has `font-size-adjust: ex-height .46` to lift Garamond's small x-height.
Do not add other families.

Sizes: page title 2.6–3.1rem script, section 2.1–2.4rem, card title `text-[1.2rem] font-semibold` serif, body 1rem,
dense UI `text-[0.95rem]`, small caps labels 0.8–0.9rem. Keep the script short (2–4 words). It is a heading, not a
sentence.

---

## 4. Motif and ornament rules

- **Primary motif: the edelweiss** from the logo. `<EdelweissGlyph>` (solid, 8–20px) for divider centres, bullets,
  button motif, current timeline dot, active menu item. `<Edelweiss>` (the logo's own line art) at ≥24px.
- **Secondary: the crescent** (curves of frames, the brand mark). Do not draw new crescents; use `BrandMark`.
- **Brand**: `BrandMark` (icon), `BrandLogo` (stacked), `BrandLockup` (horizontal), all currentColor. Never retype
  "CAHAN ACADEMY" in a font.
- Lace, ribbons and seal are **raster** (`public/ornaments/*.webp`, toned by `scripts/ornament-tone.py`); dark
  variants swap automatically under `.dark` and `.theme-wine` via CSS variables (`--tex-*`).
- Where ornaments go: lace on section **edges and corners** only; a bookmark ribbon only on **one featured card** per
  view; the draped ribbon only on auth heroes and celebratory spots (exam passed); wax seal = brand / closing
  moments (sidebar footer, auth, results). Corner flourishes on stat cards, featured/ornate cards and frames, **not**
  on every row of a dense list.
- **Do**: one ornament idea per region; centre compositions in heroes and empty states; plenty of air.
- **Don't**: ornaments behind text or data; lace inside tables; script in buttons/inputs; hearts, rings, wedding
  imagery; emoji as decoration; new colours; blur orbs; glows that are not wine/black alpha.

---

## 5. Component catalogue

Imports: `import { Button, Card, … } from '../components/ui'`,
`import { ScriptTitle, OrnamentDivider, … } from '../components/ornament'`, `import { BrandMark } from '../components/brand'`.
Every component file starts with a usage comment; this is the short version.

### Page structure
```jsx
<PageShell title={t('groups.title')} subtitle={t('groups.subtitle')}
           actions={<Button icon={Plus} onClick={openCreate}>{t('groups.create')}</Button>}>
  <Section title={t('groups.active')} variant="paper">…</Section>
</PageShell>
```
`PageShell` = max width + vertical rhythm + `ScriptTitle` header (`width="narrow|default|wide"`).
`ScriptTitle` props: `title, subtitle, eyebrow, actions, align="start|center", size="hero|page|section|card", divider`.

### Buttons
```jsx
<Button>{t('common.save')}</Button>                                  // primary, solid wine
<Button variant="outline" as={Link} to="/courses">…</Button>         // outline pill + edelweiss motif
<Button variant="ghost" onClick={close}>{t('common.cancel')}</Button>
<Button variant="danger" icon={Trash2} size="sm">{t('common.delete')}</Button>
<Button variant="ghost" iconOnly icon={X} aria-label={t('common.close')} />
<Button loading={isSaving} type="submit" block size="lg">…</Button>
```
One primary per area. Classes for raw elements: `.btn .btn-primary|outline|ghost|danger .btn-sm|lg .btn-block .btn-icon`.

### Cards
```jsx
<Card className="p-5">…</Card>                         // plain: lists, tables, forms
<Card variant="ornate" className="p-6">…</Card>        // summaries (inner hairline, 2 flourishes)
<Card variant="paper" className="p-6">…</Card>         // parchment, reading/forms
<Card variant="featured" hover as={Link} to=…>…</Card> // + bookmark ribbon; one per view
<CardHeader title=… subtitle=… actions=… />
<OrnateFrame className="p-6" corners="all|diagonal|none" paper>…</OrnateFrame>
```

### Status, badges
```jsx
<StatusPill status="present">{t('attendance.present')}</StatusPill>
<StatusDot status="late" label={t('attendance.late')} />   // dense grids/calendars
<Badge>12</Badge>  <Badge tone="accent">{t('common.new')}</Badge>
<span className="count-badge">3</span>                     // notification counts
```

### Tables
```jsx
<Table caption={t('students.list')} divider>
  <thead><tr><th>{t('common.name')}</th><th className="num">{t('common.score')}</th></tr></thead>
  <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name}</td><td className="num">{r.score}</td></tr>)}</tbody>
</Table>
```
Small-caps header, hairline rows, soft hover. Numbers right-aligned `.num`. Actions column: ghost `iconOnly` buttons.

### Forms
```jsx
<FormField label={t('auth.email')} error={errors.email?.message} hint={t('…')} required>
  {(id, describedBy, invalid) => (
    <Input id={id} aria-describedby={describedBy} invalid={invalid} icon={Mail} {...register('email')} />
  )}
</FormField>
<Textarea rows={4} />   <NativeSelect>…</NativeSelect>   <Checkbox label=… />
<Select options={[{ label, value }]} value={v} onChange={setV} />   // custom listbox (components/common)
<PasswordInput className="field" … />                               // components/common
```
Raw classes: `.field`, `.field-icon`, `.field-label`, `.field-hint`, `.field-error`, `.check`.

### Modal
```jsx
<Modal open={open} onClose={close} title={t('groups.create')} subtitle={t('groups.createHint')} size="md"
       footer={<><Button variant="ghost" onClick={close}>{t('common.cancel')}</Button>
                 <Button type="submit" form="group-form">{t('common.save')}</Button></>}>
  <form id="group-form" onSubmit={handleSubmit(onSave)}>…</form>
</Modal>
```
Framed panel + script title + divider; Escape/backdrop close; bottom sheet below 640px.

### Empty state, loading
```jsx
<EmptyState sketch="inkwell" title={t('homeworks.emptyTitle')} description={t('homeworks.emptyHint')}
            action={<Button variant="outline" icon={Plus}>{t('homeworks.create')}</Button>} />
<Skeleton className="h-5 w-40" />      <Spinner size="sm|md|lg" />
```
Sketches: `books` (courses/generic), `inkwell` (homework), `globe` (groups/students), `lamp` (schedule),
`cap` (exams/results), `notebook` (classwork/notes). Title = one short script line; description says what to do.

### Dashboard pieces
```jsx
<StatCard label={t('dashboard.students')} value={128} icon={Users} trend="up" trendLabel="+12" hint={t('dashboard.thisMonth')} />
<Timeline>
  <TimelineItem time="09:00" title="Riyaziyyat" meta="Qrup A · Otaq 3" state="done|current|upcoming|cancelled" />
</Timeline>
```

### Ornaments
```jsx
<OrnamentDivider />  <OrnamentDivider align="start" />  <OrnamentDivider motif="dot" draw={false} />
<CornerFlourish corner="tl|tr|bl|br" className="absolute left-2 top-2 h-8 w-8" />
<LaceEdge />  <LaceEdge direction="up" size={22} />  <LaceEdge vertical size={16} />
<LaceCorner corner="tr" className="absolute right-0 top-0 w-40" />
<WaveEdge fill="var(--paper-base)" className="absolute inset-x-0 -bottom-px" />   // + vertical
<BookmarkRibbon />  <DrapedRibbon className="absolute -right-6 -top-4 w-64" />
<WaxSeal size={72} />  <SketchIllustration name="globe" className="w-40" />
<Edelweiss className="h-10 w-10" />  <EdelweissGlyph className="h-4 w-4" />
```
To make an ornament fainter, wrap it: `<div className="opacity-30"><LaceCorner … /></div>`.

### Toasts
`toast.success / toast.error / toast(…)` as before. Styling comes from `components/ui/toast.js` (framed surface;
error = heavier border + cross icon). Copy: past tense of the action ("Qrup yadda saxlanıldı").

### Shell
`AppLayout` (page transition), `Sidebar` (wine panel, lace trim, ribbon marker sliding to the active item, wax seal
footer), `Header` (hairline + edelweiss, search pill, bell with `count-badge`, language menu, framed avatar),
`Avatar` (ornamental ring, `data-user-image` on photos), `Dropdown`, `Select`, `PasswordInput`, `Spinner`.

---

## 6. Recipes per page type

**List page** (Groups, Students, Courses, Homeworks…)
`PageShell` with title + subtitle (count or context in small caps) + primary action → filter row (`Input icon={Search}`
+ `Select`s, wrap on mobile) → `Table` on ≥ 640px; below 640px render the same rows as `Card` list items
(name serif semibold, meta `text-ink-muted`, status pill, actions as ghost icon buttons). Empty → `EmptyState`.
Loading → `Skeleton` rows. Pagination: ghost buttons + `.num` page numbers.

**Detail page** (StudentDetail, CourseDetail…)
`PageShell` with the entity name as script title, role/status as subtitle, actions (outline + primary). Top:
`OrnateFrame` summary with avatar/key facts, or `StatCard` row. Then `Section`s (`variant="paper"` for prose)
with tables/timelines. Back link: ghost button with `ArrowLeft`.

**Form / modal page**
Short forms → `Modal`. Long forms → `Section variant="paper"` with `FormField`s in a 1-col (mobile) / 2-col grid,
footer row right-aligned: ghost Cancel + primary Save. Validation via `FormField error`. Never script in labels.

**Dashboard-like page**
Greeting as `ScriptTitle` (no emoji), `StatCard` grid (`sm:grid-cols-2 xl:grid-cols-4`), "today" = `Timeline`
in an `OrnateFrame`, charts in `Card variant="ornate"` (wine series, dashed secondary, hairline grid), activity list in
a plain `Card`. One `featured` card at most.

**Auth page** (Login is the reference implementation: `src/pages/Login.jsx`)
Desktop: 46/54 grid, `theme-wine login-hero` panel (BrandLogo, script line, small-caps line, divider, wax seal,
lace corners, `PetalField`), vertical `WaveEdge` into a `.paper` form panel, `DrapedRibbon` across the join.
Mobile: wine band on top (logo, script line, language menu, ribbon, lace corner) → `LaceEdge direction="up"` +
`WaveEdge` → wax seal overlapping the join → form. Form: centred `ScriptTitle`, `FormField`s, primary block button,
"or" separator with edelweiss, `GoogleButton`, link to the sibling auth page.

**Empty state**: `EmptyState` inside the card/section that would hold the data, never a full blank page.

**Status display**: `StatusPill` in tables and cards, `StatusDot` in dense grids (attendance calendar), always with
text or `label`. Never colour-only, never green/red classes.

---

## 7. Motion

Tokens (`index.css`, mirrored in `src/lib/motion.js`): `--dur-1` 150ms (hover, press), `--dur-2` 250ms (menus,
modals), `--dur-3` 400ms (entrances), `--dur-draw` 900ms (one-shot line draw), `--ease-silk`
`cubic-bezier(.22,.61,.36,1)` (everything calm), `--ease-spring` (small pops; framer `EASE.spring`), `--stagger`
40ms, `--rise` 8px. Under `prefers-reduced-motion` durations collapse to near-instant and `--rise` to 0;
`<MotionConfig reducedMotion="user">` (App.jsx) strips framer transforms.

Primitives:

| need | use |
|---|---|
| route transition | built into `AppLayout` (`.route-enter`: CSS fade + 8px rise, once per pathname) |
| list/card entrance | `className="orn-stagger"` on the parent (CSS, first 8 children stagger, rest arrive together) or framer `listContainer`/`listItem` + `staggerDelay(i)` |
| one element entrance | `.orn-rise` (fade + rise) / `.orn-reveal` (fade) / `.orn-pop` (scale .98→1) |
| modal | `<Modal>` (scale .98→1 + fade, framer `modalVariants`) |
| dropdown / select menu | CSS `.orn-pop` (no JS animation) |
| toast | react-hot-toast built-in (transform/opacity) |
| hover lift | `.card-hover` / `<Card hover>` (translateY -2px, transform only) |
| active nav item | one marker moved by `transform` from cached link geometry (Sidebar, CSS transition) |
| ornament reveal | `OrnamentDivider` / `CornerFlourish draw` (stroke-dashoffset, ONCE), lace `.orn-reveal` |
| button press | `.btn:active` scale .97 |
| skeleton shimmer | `.skeleton` (translateX gradient on `::after`) |
| 3D | `PetalField` (lazy three.js chunk, auth pages only) |

Rules (from a real incident on this machine — do not bend them):
- Continuous animations only on **transform/opacity**, via CSS or WAAPI. No animated `width/height/top/left/box-shadow/filter`.
- Never animate inside `backdrop-filter` or `mask` layers; avoid `backdrop-filter` altogether.
- No animated SVG `textPath`. Stroke-draw animations run once.
- `will-change` only on the element while it animates, never in base styles.
- Entrances run once on mount; cap staggers at 8 items.
- 3D only lazy (`import()`), never on data-heavy pages; DPR ≤ 1.5; pause on `visibilitychange` and off-screen
  (`IntersectionObserver`); static fallback without WebGL or with reduced motion.

Measurement recipe (Chrome, 4x CPU throttle, production build):
```bash
cd client && VITE_API_URL=http://localhost:5000/api npm run build && npx vite preview --port 5173 --strictPort
E2E_PASSWORD=… node scripts/perf-probe.mjs --list-route /your-page         # with motion
E2E_PASSWORD=… node scripts/perf-probe.mjs --list-route /your-page --reduced-motion 1   # without: the difference is motion's cost
```
Targets: click handling < 50 ms, no long task > 100 ms *caused by animation* (compare the two runs), scroll ≈ 60 fps.

---

## 8. Mobile rules (390px is the reference width)

- Side gutter 16px (`px-4`), no horizontal page scroll; tables scroll inside `.table-wrap` or become card lists.
- `ScriptTitle` actions wrap under the title; keep at most 2 visible actions, move the rest into a `Dropdown`.
- Tap targets ≥ 40px (`btn` md is 40px, `btn-sm` 32px only in dense rows with spacing).
- Modals become bottom sheets automatically. Sidebar is a drawer (wine) with backdrop.
- Ornaments shrink, not multiply: lace corners `w-28–w-32`, no corner flourishes on list cards, sketches `w-24–w-36`.
- Header shows `BrandLockup` instead of the search field.

---

## 9. Verification

Run all of these for every page you touch, and attach the screenshots to your PR.

```bash
# 1. local stack (terminal 1): in-memory DB + seeded admin/teacher/student
cd server && E2E_PASSWORD='<any password>' npm run e2e:local

# 2. client (terminal 2) — port 5173 is required (CORS allow-list)
cd client && VITE_API_URL=http://localhost:5000/api npm run dev

# 3. screenshots: light + dark, 1440 + 390, every role that sees the page — then LOOK at them
E2E_PASSWORD='<same>' node scripts/screenshots.mjs --routes "admin:/groups,teacher:/groups,student:/groups" --out ../shots/groups

# 4. colour audit (runtime) — must print 0 violations for your routes, both themes, both widths
E2E_PASSWORD='<same>' node scripts/color-audit.mjs --routes "admin:/groups,teacher:/groups" --out ../shots/groups/audit
#    (--scope "main" audits only page content; --widths 1440 for a quick pass)

# 5. colour lint (static, also in CI) — remove your files from scripts/color-lint-pending.txt first
node scripts/color-lint.mjs

# 6. build, tests, lint
npm run build && npx vitest run && npx eslint <touched files>
```
Also open interactive states the screenshots miss (modal open, menu open, toast, error state, empty state) in
both themes, and check keyboard focus is visible. `/_kit` shows every component for comparison.

Tooling reference:
- `scripts/color-audit.mjs` — runtime audit (computed colours composited over their backdrop, pseudo-elements,
  placeholder, selection, scrollbar, focus rings, raster ornament pixels; user photos exempt). JSON + text report.
- `scripts/color-lint.mjs` — static literal/class check; `scripts/color-lint-pending.txt` = files not migrated yet.
- `scripts/screenshots.mjs`, `scripts/perf-probe.mjs`, `scripts/lib/session.mjs` — Playwright helpers (localhost only).
- `scripts/font-coverage.py` — fontTools proof of az + Cyrillic coverage.
- `scripts/ornament-tone.py` — raster art → colour-law tones + dark variants + lossless WebP. Prompts: `docs/design/ornament-prompts.md`.
- `scripts/build-brand.py` + `scripts/build-icons.mjs` — brand geometry, favicon, app icons, manifest from `src/assets/brand/logo-full.svg`.
