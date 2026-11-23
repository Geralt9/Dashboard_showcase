# Build: Print-on-Demand Production Dashboard (showcase)

You are building a **front-end showcase dashboard** for a custom apparel / print-on-demand shop (prints on t-shirts, hats, hoodies, etc.). It will be handed to a developer as the visual and functional reference, so it must look polished and the main interactions must work with mock data. **No backend.**

The visual reference is `reference/design-reference.png` in this folder. **Open it and study it before writing any code.** Match its layout, spacing, card style, colors and overall feel closely. Only the content changes (it's a medical-study dashboard; ours is a print shop).

---

## Tech stack (strict)

- **React + Vite** (JavaScript, not TypeScript)
- **Plain CSS** with CSS variables (one `global.css` for tokens/resets + one `.css` file per component). **No Tailwind, no UI kits (MUI, Chakra, AntD), no CSS-in-JS.**
- Allowed dependencies: `react-router-dom`, `lucide-react` (icons), `date-fns` (date math). Nothing else unless absolutely needed. **Build the calendar yourself, no calendar libraries.** Draw the charts/rings as hand-made SVG.
- State: React Context + `useReducer` (one `OrdersContext`) so a change anywhere (calendar, drawer, table) updates everywhere. Persist to `localStorage`, with a "Reset demo data" option in Settings.

---

## Business flow (this drives everything)

Each customer request is an **Order** that moves through these stages, in order:

1. **Request received**: customer submits a request
2. **Art received**: customer uploaded their artwork
3. **Art review / editing**: we review and edit the art if needed
4. **Art approved**: art is final
5. **Garments ordered**: we order blanks (t-shirts, hats, …) from the supplier, with an expected arrival date
6. **Print scheduled**: print date set and the customer is told
7. **Printing**: in production
8. **Ready**: finish date reached; ready for **pickup** or **shipped** (fulfillment type per order)
9. **Completed**

Each stage has its own color, used consistently on stage pills, progress bars and calendar events. Define these as CSS variables.

### Order data model (`src/data/mockData.js`)
```js
{
  id: "ORD-1042",
  customer: { name, company, email, phone },
  items: [{ garment: "T-shirt", brand: "Gildan 5000", color: "Black", sizes: { S: 10, M: 20, L: 15, XL: 5 }, printLocation: "Front", method: "Screen print" }],
  artwork: { fileName, thumbnailUrl /* placeholder image/colored box */, status: "pending" | "needs-edit" | "approved", notes, revisions: [] },
  stage: "art-review",            // one of the 9 stages
  stageHistory: [{ stage, date, by }],
  dates: { requested, artApprovalDue, garmentsEta, printDate, finishDate },
  fulfillment: "pickup" | "shipping",
  priority: "normal" | "rush",
  assignee: "Vincent",
  notes: ""
}
```
Generate **~25 realistic mock orders** spread over the current and next month, at every stage, with a few overdue, a few rush and a few done. Use plausible small-business customer names (cafés, gyms, schools, events, bands).

---

## Layout (mirror the reference image)

### Sidebar (dark, like the reference)
- Logo + shop name (placeholder: **"PrintFlow"**, easy to rename from one constant) + collapse icon (collapsing actually works → icons only).
- Nav items (active one = mint-green filled pill like "Dashboard" in the reference): **Dashboard, Orders, Production Calendar, Art Approvals, Garment Orders, Customers, Notifications, Settings**, then **Log out**.
- Bottom promo-style card (dark green, like "Payment And Free Trial"): **"This week's capacity"** with e.g. "1,240 / 1,500 prints booked" + a button "View calendar".

### Top bar
- "Welcome back, Sarah!" + subtitle "Here's what's happening in the shop today."
- Right side: a segmented toggle like "Custom / AI Mode" → **"Shop view / Customer view"** (customer view can just hide internal notes; keep it simple) + a **"+ New order"** button + notification bell with a badge.

### Dashboard page (same grid as the reference)
**Row 1: two KPI cards** (same style as "Performance" and "Ranking Percentile"):
- **Production overview**: purple donut = % of orders on schedule; legend items: *Active orders*, *Awaiting art approval*.
- **Shop capacity**: gold ring = % of this week's print capacity used; text: "Ready for pickup / shipping: 7" with an icon (like the trophy).

**Row 2, left: "Active Orders" table** (replaces "All System List", with "View all" link → Orders page):
Columns: Order / Customer · Items (e.g. "50× T-shirt") · Stage (colored pill) · Print date · Finish date · **Pipeline progress bar** (like the green/red bar: filled portion = how far through the 9 stages, red tail if overdue). Rows are clickable → open the Order drawer.

**Row 2, right: "Today's Production"** (replaces "Today Study Schedule"): the vertical purple timeline with time cards, e.g. "09:00–11:00 · Screen print 48 tees · Café Atlas · ORD-1042 · 2 hrs". Kebab menu on the card.

**Row 3, left: "Production Calendar" preview** (replaces "Study Schedule Plan"): Daily / Weekly / Monthly tabs, month + date label, "View calendar" + "Filters" buttons, prev/next arrows, teal **"+ Add job"** button, and the 7-day week grid with colored job blocks (title, qty, duration, small status tag like "In progress / Done / Late"), exactly like the reference.

**Row 3, right: "Deadline Watch"** (replaces "Exam Date Reminder"): small ring indicators + label + subtitle:
- **Overdue** (red ring, "3 orders past finish date", red "Late" tag)
- **At risk** ("garments not arrived / art not approved, print in < 3 days")
- **On track**

---

## Production Calendar page (the key feature the client asked for)

A full page calendar showing all customer requests, which the shop can **manage based on work progress**.

**Views:** Month / Week / Day tabs, Today button, prev/next.

**What shows on the calendar** (each event colored by type, with a stage pill):
- Print date (main event, block sized by estimated duration)
- Finish date (pickup / ship, with icon)
- Garment ETA
- Art approval due date

**Manage it:**
1. **Drag & drop** an event to another day/time (native HTML5 drag-and-drop) → updates the order's date. If moving a print date before the garments ETA or before art approval, show a warning toast and confirm.
2. **Click an event** → opens the **Order drawer** (below).
3. **"+ Add job"** → modal to create a new order/job (customer, items, dates, fulfillment, priority).
4. **Filters** sidebar or dropdown: by stage, event type, assignee, rush only, pickup vs shipping.
5. **Daily capacity indicator**: each day shows booked prints vs capacity (e.g. 300/day, set in Settings); the day header turns amber at >80% and red when over capacity.
6. **Unscheduled tray** (right side panel on desktop): approved orders with no print date yet. Drag them onto the calendar to schedule.
7. Overdue events get a red left border; completed events are faded.

---

## Order drawer (slide-in from the right, used everywhere)

- Header: order id, customer, rush badge, fulfillment type.
- **Horizontal stage stepper** showing the 9 stages, with current stage highlighted. Button **"Move to next stage"** + dropdown to set any stage. Every change is logged in `stageHistory`.
- Artwork panel: thumbnail, status, **Approve** / **Request edit** buttons, revision notes.
- Items table with size breakdown and total qty.
- Dates section with editable date inputs (art due, garments ETA, print date, finish date).
- **"Notify customer"** buttons next to print date and finish date → mock action: a toast "Customer notified: print date Nov 26" + entry in a small activity log.
- Internal notes.

---

## Other pages (simpler, but working)

- **Orders**: full table with search, stage filter chips, sort by date, a toggle between **Table** and **Kanban board** (columns = stages, cards draggable between columns).
- **Art Approvals**: grid of artwork cards awaiting review with Approve / Request edit.
- **Garment Orders**: list of supplier orders (supplier, garments, qty, ETA, status: ordered / shipped / received) with "Mark received".
- **Customers**: list with order count and last order; click → their orders.
- **Notifications**: generated from activity (art uploaded, garments arrived, order overdue…).
- **Settings**: shop name, daily print capacity, working hours, reset demo data.

---

## Design tokens (take exact values from the reference image; these are a starting point)

- Sidebar bg: near-black `#0F1513`; sidebar text: muted gray; active item: mint green `#22D17A` with dark text
- App bg: `#F3F4F6`; cards: white, radius `14px`, 1px border `#ECEEF1`, very soft shadow
- Primary accent (donut, timeline): purple `#5B2EE5`; gold ring `#D4A017`; primary button: teal `#14B8A6`
- Success green `#22C55E`, danger red `#E5484D`, warning amber `#F59E0B`
- Font: **Inter** (Google Fonts), body 14px, card titles 15–16px semibold, big numbers 22–28px
- Generous padding (20–24px in cards), 16–20px grid gaps, thin dividers between table rows
- Subtle hover states on rows, nav items and buttons; 150–200ms transitions

---

## Folder structure

```
src/
  main.jsx, App.jsx
  styles/global.css            # tokens, resets, typography
  data/mockData.js
  context/OrdersContext.jsx    # reducer + actions + localStorage
  utils/                       # dates, stage helpers, capacity calc
  components/
    layout/ Sidebar, Topbar, Layout
    ui/ Card, Button, StagePill, ProgressRing, PipelineBar, Modal, Drawer, Toast, Tabs
    dashboard/ KpiCards, ActiveOrdersTable, TodayProduction, CalendarPreview, DeadlineWatch
    calendar/ CalendarHeader, MonthView, WeekView, DayView, CalendarEvent, UnscheduledTray, Filters
    orders/ OrderDrawer, StageStepper, OrdersTable, KanbanBoard, NewOrderModal
  pages/ Dashboard, Orders, Calendar, ArtApprovals, GarmentOrders, Customers, Notifications, Settings
```

Keep components small and readable. The developer will extend this, so use clear names, no clever abstractions, and short comments only where logic isn't obvious.

---

## Responsiveness
Designed for desktop first (1440px, like the reference). It should still be usable at 1024px, and on mobile the sidebar collapses into a drawer and the grid stacks.

---

## How to work

1. Look at `reference/design-reference.png` first.
2. Scaffold with Vite in this folder, install deps.
3. Build tokens + layout shell (sidebar, topbar), then the Dashboard page, then the Calendar page, then the Order drawer, then the remaining pages.
4. Run `npm run build` at the end and fix all errors/warnings. Run `npm run dev` and check every page, especially drag & drop on the calendar and stage changes reflecting on the dashboard.
5. Write a short `README.md`: how to run, folder structure, the stage flow, and what's mocked vs. what the real backend will need to provide (API endpoints list suggestion: orders CRUD, stage update, notify customer, garment orders, capacity settings).

## Done when
- The Dashboard visually matches the reference layout and style.
- Calendar shows all event types; drag & drop rescheduling, unscheduled tray, filters and capacity indicators work.
- Changing a stage or date in the drawer instantly updates the table, calendar, KPIs and Deadline Watch.
- `npm run build` passes with no errors.
