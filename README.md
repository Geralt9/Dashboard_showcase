# PrintFlow: Production Dashboard (showcase)

Front-end reference build of a production dashboard for a custom apparel / print-on-demand shop.
Everything runs in the browser on **mock data**. There is no backend.

- React + Vite (JavaScript), plain CSS with CSS variables
- `react-router-dom`, `lucide-react` (icons), `date-fns` (date math). Nothing else.
- Calendar, charts and progress rings are hand-built (HTML5 drag & drop and SVG).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

The shop name comes from one constant, `SHOP_NAME` in `src/config.js`. It can also be changed at runtime in **Settings**.
State is saved to `localStorage`. **Settings → Reset demo data** regenerates the mock orders around today's date.

## Folder structure

```
src/
  main.jsx, App.jsx           # entry + routes
  config.js                   # shop name, capacity defaults, assignees, garment lists
  styles/global.css           # design tokens (colors, stage colors, radii), resets, shared table/tag/chip styles
  data/mockData.js            # 28 generated orders + seeded activity feed (dates relative to today)
  context/
    OrdersContext.jsx         # useReducer store: orders, activity, settings (+ localStorage)
    UIContext.jsx             # drawer, new-order modal, toasts, confirm dialog, shop/customer view, sidebar
  utils/
    stages.js                 # the 9 stages, labels, colors, progress
    orders.js                 # qty, overdue / at-risk rules, job status, print-time estimate
    capacity.js               # prints per day, capacity level, weekly usage
    events.js                 # orders → calendar events, filters
    dates.js, notifications.js
  components/
    layout/    Sidebar, Topbar, Layout
    ui/        Card, Button, StagePill, ProgressRing, PipelineBar, Modal, Drawer, Toast, Tabs, Menu, ConfirmDialog
    dashboard/ KpiCards, ActiveOrdersTable, TodayProduction, CalendarPreview, DeadlineWatch
    calendar/  CalendarHeader, MonthView, WeekView, DayView, TimeGrid, CalendarEvent, UnscheduledTray, Filters,
               dnd.js (drag helpers), useReschedule.js (move + conflict check)
    orders/    OrderDrawer, StageStepper, OrdersTable, KanbanBoard, NewOrderModal
  pages/       Dashboard, Orders, Calendar, ArtApprovals, GarmentOrders, Customers, Notifications, Settings
```

## Stage flow

| # | Stage id | Meaning |
|---|----------|---------|
| 1 | `request-received` | Customer submitted a request |
| 2 | `art-received` | Customer uploaded artwork |
| 3 | `art-review` | We review / edit the art |
| 4 | `art-approved` | Art is final |
| 5 | `garments-ordered` | Blanks ordered from supplier (creates a garment order with ETA) |
| 6 | `print-scheduled` | Print date set, customer told |
| 7 | `printing` | In production |
| 8 | `ready` | Ready for pickup or shipped (per-order `fulfillment`) |
| 9 | `completed` | Done |

Each stage has a color variable (`--stage-<id>` in `global.css`), used on pills, the kanban, the stepper and the calendar.
Every stage change is appended to `order.stageHistory` and to the activity feed.

Rules worth knowing (all in `src/utils/orders.js`):
- **Overdue**: the finish date has passed and the order isn't `ready` or `completed`.
- **At risk**: prints within 3 working days while the art isn't approved or the garments haven't been received.
- **Unscheduled tray**: stages 4–6 with no print date.
- Setting a print date on a `garments-ordered` order moves it to `print-scheduled`.
- Approving art moves early-stage orders to `art-approved`. Requesting an edit moves the order to `art-review`.
- Moving a print date before the garments ETA, or before the art is approved, asks for confirmation.

## What's mocked and what the backend needs to provide

Mocked today: all data (generated in `mockData.js`), auth (Log out just shows a toast), "Notify customer" (logs an
activity entry and shows a toast, no email or SMS is sent), artwork files (SVG placeholder thumbnails), supplier orders.

The reducer actions in `OrdersContext.jsx` map 1:1 to API calls. Suggested endpoints:

| Method | Endpoint | Used by |
|--------|----------|---------|
| GET | `/api/orders?from=&to=&stage=&assignee=` | Dashboard, Orders, Calendar |
| GET | `/api/orders/:id` | Order drawer |
| POST | `/api/orders` | New order modal |
| PATCH | `/api/orders/:id` | notes, assignee, priority, dates (`UPDATE_ORDER`, `UPDATE_DATES`) |
| POST | `/api/orders/:id/stage` `{ stage }` | stepper, kanban, "Move to next stage" (`SET_STAGE`). Server appends stageHistory |
| POST | `/api/orders/:id/artwork` (upload) | customer art upload |
| POST | `/api/orders/:id/artwork/approve` | `APPROVE_ART` |
| POST | `/api/orders/:id/artwork/revisions` `{ note }` | `REQUEST_ART_EDIT` |
| POST | `/api/orders/:id/notify` `{ kind: "print" \| "finish" }` | "Notify customer" (email/SMS) |
| GET | `/api/garment-orders` | Garment Orders page |
| PATCH | `/api/garment-orders/:po` `{ status }` | Mark shipped / received |
| GET | `/api/customers` | Customers page |
| GET | `/api/activity?since=` | Notifications + bell badge |
| GET/PUT | `/api/settings` | daily capacity, working days, working hours, shop name |

Capacity (prints per day versus `dailyCapacity`) is computed on the client from the orders. The backend only needs to store the settings.
