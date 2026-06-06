# Desktop Redesign — Design Spec

**Date:** 2026-06-06
**App:** Mpenzi Shoe Shop Manager (Next.js 14 · Tailwind · InstantDB · Recharts)
**Goal:** Add a professional desktop experience to a currently mobile-only PWA, without regressing the mobile UI.

---

## 1. Summary

The app today is locked to a centered `max-w-[480px]` column with a fixed bottom tab bar — designed for phones. On a desktop browser it shows a narrow column stranded on the left of a wide screen.

This redesign introduces a **single responsive layout** that:
- Leaves the mobile experience (`< 1024px`) **visually unchanged**.
- Unlocks a professional desktop experience at **`≥ 1024px`**: a fixed left sidebar, a wide multi-column content area, a data-forward "command center" dashboard, and tabular layouts for list-heavy pages.

This is a **layout / presentation change only**. No changes to data models, InstantDB queries, business logic, auth, or permissions.

---

## 2. Goals & Non-Goals

### Goals
- Professional, dense-but-refined desktop UI across **all** pages.
- One codebase — responsive via Tailwind breakpoints, no duplicate page components.
- Preserve the existing design language (purple `#6C63FF`, indigo nav `#1E1B4B`, Inter, rounded cards, CSS-variable tokens) and dark mode.
- Mobile UI unchanged.

### Non-Goals
- No redesign of mobile layouts.
- No changes to data schema, queries, or business logic.
- No new dependencies (use existing Tailwind, lucide-react, Recharts).
- No new features beyond layout (e.g. no new reports, no new CRUD).

---

## 3. Responsive Strategy

Single breakpoint boundary at Tailwind's `lg` (1024px):

| Range | Navigation | Container | Content |
|---|---|---|---|
| `< 1024px` (mobile/tablet) | Bottom tab bar (today) | `max-w-[480px]` centered (today) | Stacked cards (today) — **unchanged** |
| `≥ 1024px` (`lg:`) | Fixed left sidebar (256px) | Full width, inner cap `max-w-[1400px]` | Multi-column grids & tables |

Implementation principle: every desktop change is an **additive `lg:` utility class** layered onto existing markup. Mobile classes are never removed. When markup must differ between mobile and desktop (e.g. card-list vs. table), render both and toggle with `lg:hidden` / `hidden lg:block`, keeping a single data source above.

---

## 4. App Shell — `app/(app)/layout.tsx`

Current shell:
```
<div min-h-screen bg>
  <div max-w-[480px] mx-auto>{children}</div>
  <BottomNav />
</div>
```

New shell:
```
<div min-h-screen bg>
  <Sidebar />                              {/* hidden lg:flex, fixed left, w-64 */}
  <div lg:pl-64>                           {/* offset for sidebar */}
    <div max-w-[480px] mx-auto             {/* mobile column */}
         lg:max-w-[1400px] lg:px-8>        {/* desktop wide container */}
      {children}
    </div>
  </div>
  <BottomNav />                            {/* gets lg:hidden */}
</div>
```

- Sidebar is `position: fixed`, full height, `hidden lg:flex`.
- `lg:pl-64` reserves space so content never sits under the sidebar.
- The `.page-content` bottom padding (for the bottom nav) is removed at `lg:` since there is no bottom nav on desktop.

### 4.1 `Sidebar.tsx` (new component)

- **Surface:** dark indigo `--color-nav-bg` (`#1E1B4B` light / `#0F0E1A` dark), `w-64`, full height, subtle right border, vertical flex.
- **Top:** brand mark (gradient logo tile + "Mpenzi" wordmark).
- **Nav items** (reuses a shared `NAV_ITEMS` array — see 4.3): Dashboard, Stock, Sell, Sales, Debts, Expenses, Reports. Each is a `Link` with icon + label.
  - Active state: solid purple pill (`--color-primary`), white text, `font-semibold`. Derived from `usePathname()` (same logic as `BottomNav`).
  - Inactive: `--color-nav-inactive` (`#8B89B8`), hover lightens to white + faint fill.
- **Footer** (pinned bottom via `mt-auto`): user name + role, then a row of the three account controls currently in the dashboard header — theme toggle, Team link (employer only, `useIsEmployer`), Logout. Rendered as labeled rows/buttons suited to the wider sidebar.

### 4.2 `BottomNav.tsx`

Add `lg:hidden` to the root `<nav>`. No other change. It keeps the 4 primary tabs on mobile.

### 4.3 Shared navigation source

Extract the navigation list into one exported array (e.g. `lib/nav.ts` or co-located) consumed by both `BottomNav` (first 4 primary tabs) and `Sidebar` (all 7). Each entry: `{ href, label, Icon }`. This prevents drift and is the single source of truth for routes/labels. Icons come from `lucide-react` (already a dependency) for consistency; existing inline `BottomNav` SVGs may remain for the 4 mobile tabs or be migrated to lucide for uniformity — implementer's choice, kept consistent.

---

## 5. PageHeader — `components/ui/PageHeader.tsx`

Today: sticky, blurred, `title` + `subtitle` + right-aligned `action` slot.

Desktop adjustments (additive):
- Larger title at `lg:` (e.g. `lg:text-[28px]`), increased horizontal padding to match `lg:px-8` container.
- The `action` slot keeps working on both. On the **dashboard**, the three account buttons move out of the header into the sidebar footer at `lg:`; on mobile they remain in the header. Pages whose `action` is page-specific (e.g. an "Add" button) keep it in the header at all sizes, right-aligned.
- Stays sticky; `top` offset accounts for no `safe-area` quirks on desktop.

---

## 6. Dashboard — Rich Command Center — `app/(app)/dashboard/page.tsx`

Mobile: stacks exactly as today. Desktop (`lg:`):

1. **Low-stock alert:** full-width banner above the grid (when present).
2. **Period selector:** stays; right-aligned next to the page title area on desktop.
3. **KPI row:** `grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4`.
   - Revenue, Expenses, Collected, Net Profit.
   - Uses existing `StatCard` with `trend` (▲/▼ %) and a colored left accent border per metric.
4. **Main analytics grid:** `lg:grid-cols-3`.
   - **Revenue — Last 7 Days** chart card spans `lg:col-span-2` (Recharts `BarChart`, taller on desktop).
   - **Right rail** (`lg:col-span-1`): Today's Target card + Stock Overview card stacked.
5. **Recent Sales:**
   - Mobile: existing `SaleRow` card list (`lg:hidden`).
   - Desktop: a table (`hidden lg:block`) with columns **Item · Payment · Date · Amount · Status**, ~10 rows, "See all" link to `/sales`. Reuses the same `recentSales` data already computed.

All values, queries, and `useMemo` computations are unchanged — only the presentational wrappers gain `lg:` grids and an alternate table renderer.

---

## 7. List & Form Pages — Consistent Wide Treatment

These pages are inherently tabular; desktop converts card-lists into tables and widens forms/modals. Pattern is shared via a small **responsive table** convention (see 8).

- **Stock (`stock/page.tsx`):** filter tabs + search in a header row; item list → table (Brand · Color · Size · Qty/Status · Buy · Sell · actions) at `lg:`. Add/Edit form (currently a sheet/modal) widens and centers with a 2-column field grid on desktop.
- **Sales (`sales/page.tsx`):** sales list → table (Item · Payment · Date · Amount · Status) at `lg:`.
- **Debts (`debts/page.tsx`):** debt list → table (Customer/Item · Total · Paid · Outstanding · Date · action) at `lg:`.
- **Expenses (`expenses/page.tsx`):** expense list → table (Category/Note · Amount · Date · action) at `lg:`; add form widens.
- **Users (`users/page.tsx`):** team list → table (Name · Role · actions) at `lg:`; centered form.
- **Sell (`sell/page.tsx`):** product picker → `lg:grid-cols-2/3` grid; the cart/summary moves from a bottom sheet to a **sticky right rail** (`lg:sticky lg:top-...`) on desktop. Checkout logic unchanged.
- **Reports (`reports/page.tsx`):** charts/sections arranged multi-column at `lg:`.

Mobile renderings for all of the above are preserved via `lg:hidden` / `hidden lg:block` toggles.

---

## 8. Shared Patterns / Components

- **New:** `components/Sidebar.tsx` (desktop nav shell).
- **New (small):** a responsive table convention for list pages — either a lightweight `components/ui/DataTable.tsx` (header + rows with column config) or a documented Tailwind table pattern reused per page. Chosen to avoid copy-paste drift across Stock/Sales/Debts/Expenses/Users. Keep it minimal (no sorting/pagination beyond what pages already do).
- **Edited:** `app/(app)/layout.tsx`, `components/ui/PageHeader.tsx`, `components/ui/BottomNav.tsx`, each page's layout wrappers, shared `NAV_ITEMS` source.
- **Unchanged:** `Card`, `StatCard`, `Badge`, `Button`, `Input`, `Select`, all of `lib/` (db, auth, schema, permissions, theme, utils), all data logic.

Design tokens: continue using the CSS variables in `globals.css`. Any new shared values (e.g. sidebar width `256px`, desktop content cap `1400px`) are expressed as Tailwind classes (`w-64`, `max-w-[1400px]`) or added as tokens if reused widely.

---

## 9. Dark Mode

The sidebar and all desktop additions must honor the existing `.dark` token overrides. Sidebar uses `--color-nav-bg` which already darkens in dark mode. Tables/grids use surface/border/text tokens, so dark mode comes for free. Verify contrast on the sidebar active pill and table separators in both themes.

---

## 10. Testing & Verification

Layout-only change → verification is visual/responsive, not unit-test-heavy.

- **Playwright responsive checks** at **390px** (mobile baseline — must match current UI) and **1440px** (desktop) for every route: dashboard, stock, sell, sales, debts, expenses, reports, users, login.
- Confirm: no horizontal scrollbar at either width; sidebar visible only `≥1024px`; bottom nav visible only `<1024px`; active nav state correct per route.
- **Dark mode** pass on the sidebar + at least the dashboard and one table page at 1440px.
- Smoke-test that data still renders and core flows (add stock, record sale) work at desktop width — confirming logic is untouched.
- Build passes (`next build`) with no TypeScript errors.

---

## 11. Risks & Mitigations

- **Mobile regression** — the biggest risk. Mitigation: only additive `lg:` classes on shared markup; verify 390px against current screenshots.
- **Markup duplication (card vs table)** drifting from a single data source. Mitigation: compute data once, render two presentations beneath it; share the table pattern.
- **Modal/sheet components** that assume the 480px column (`.sheet-x` helper) — must be reviewed so desktop modals center correctly rather than clamping to 480px.
- **Scope (all pages)** is broad. Mitigation: shell + dashboard first as the reference implementation, then apply the established table/grid pattern page-by-page.

---

## 12. Build Order (for the implementation plan)

1. Shared `NAV_ITEMS` source + `Sidebar.tsx`.
2. Responsive shell in `layout.tsx`; `BottomNav` `lg:hidden`; `PageHeader` desktop variant.
3. Dashboard command center (reference implementation of grids + table).
4. Shared responsive table pattern.
5. Apply to list pages: Stock, Sales, Debts, Expenses, Users.
6. Sell (grid + sticky cart rail) and Reports (multi-column).
7. Dark-mode pass + Playwright responsive verification + `next build`.
