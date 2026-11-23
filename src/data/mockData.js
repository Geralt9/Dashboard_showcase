// Mock data. Dates are generated relative to "today" so the demo always looks live.
// Swap this module for API calls once the backend exists.
import { addDays, subDays, isWeekend, isSaturday, setHours, setMinutes, min } from 'date-fns';
import { STAGES, stageIndex, stageLabel } from '../utils/stages';
import { toDateKey, toDateTimeKey } from '../utils/dates';
import { estimateHours } from '../utils/orders';

/* ---------- small helpers ---------- */

// Move a date off the weekend (forward for future dates, back for past ones).
function weekday(date, direction = 1) {
  let d = date;
  while (isWeekend(d)) d = addDays(d, direction);
  return d;
}

function shiftFromToday(base, days) {
  if (days === 0) return base;
  const d = addDays(base, days);
  if (!isWeekend(d)) return d;
  return days > 0 ? weekday(d, 1) : isSaturday(d) ? subDays(d, 1) : subDays(d, 2);
}

// Spread `total` across sizes with a typical apparel curve.
function sizeRun(total, sizes = ['S', 'M', 'L', 'XL']) {
  if (sizes.length === 1) return { [sizes[0]]: total };
  const curve = { XS: 0.5, S: 1.2, M: 2, L: 1.8, XL: 1, '2XL': 0.5, '3XL': 0.25 };
  const weights = sizes.map((s) => curve[s] ?? 1);
  const sum = weights.reduce((a, b) => a + b, 0);
  const run = {};
  let left = total;
  sizes.forEach((s, i) => {
    const n = i === sizes.length - 1 ? left : Math.round((total * weights[i]) / sum);
    run[s] = n;
    left -= n;
  });
  return run;
}

function item(garment, qty, brand, color, method, printLocation = 'Front', sizes) {
  const oneSize = ['Hat', 'Tote bag'].includes(garment);
  return {
    garment,
    brand,
    color,
    sizes: oneSize ? { OS: qty } : sizeRun(qty, sizes),
    printLocation,
    method,
  };
}

function slug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function initials(text) {
  return text
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Placeholder artwork thumbnail as an inline SVG data URL. */
export function makeThumbnail(label, bg, fg = '#ffffff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<rect width="120" height="120" rx="14" fill="${bg}"/>
<circle cx="60" cy="52" r="30" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="3"/>
<text x="60" y="62" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="28" font-weight="700" fill="${fg}">${label}</text>
<rect x="32" y="92" width="56" height="6" rx="3" fill="${fg}" fill-opacity=".45"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ---------- seed list ----------
   print: days from today (null = not scheduled yet), time: "HH:mm"
   plan:  rough days-from-today used for the other dates when print is null
   finish: optional override (days from today) — used to create overdue orders */
const SEEDS = [
  { id: 'ORD-1018', name: 'Dana Whitfield', company: 'Northside Little League', stage: 'completed', print: -16, time: '09:00', fulfillment: 'pickup', items: [item('T-shirt', 120, 'Gildan 5000', 'Royal Blue', 'Screen print', 'Front + Back', ['XS', 'S', 'M', 'L', 'XL'])], art: '#1d4ed8' },
  { id: 'ORD-1021', name: 'Marco Ruiz', company: 'Harbor Brewing Co.', stage: 'completed', print: -12, time: '10:00', fulfillment: 'pickup', items: [item('Hat', 48, 'Richardson 112', 'Charcoal / Black', 'Embroidery')], art: '#92400e' },
  { id: 'ORD-1024', name: 'Lena Park', company: 'Sunset 5K Run', stage: 'completed', print: -9, time: '08:00', fulfillment: 'shipping', items: [item('T-shirt', 250, 'Next Level 3600', 'Heather Orange', 'Screen print')], art: '#ea580c' },
  { id: 'ORD-1027', name: 'Tony Briggs', company: 'Ironworks Gym', stage: 'ready', print: -4, time: '13:00', fulfillment: 'pickup', items: [item('Tank top', 60, 'Bella+Canvas 3480', 'Black', 'DTG')], art: '#111827' },
  { id: 'ORD-1029', name: 'Rachel Ng', company: 'Maple Grove Elementary', stage: 'ready', print: -3, time: '09:30', fulfillment: 'shipping', items: [item('T-shirt', 180, 'Gildan 5000B', 'Forest Green', 'Screen print', 'Front', ['XS', 'S', 'M', 'L'])], art: '#15803d' },
  { id: 'ORD-1030', name: 'Jesse Romero', company: 'The Velvet Static', stage: 'ready', print: -2, time: '11:00', fulfillment: 'shipping', items: [item('Hoodie', 40, 'Independent SS4500', 'Black', 'Screen print', 'Back'), item('T-shirt', 80, 'Comfort Colors 1717', 'Pepper', 'Screen print')], art: '#7c3aed' },
  { id: 'ORD-1031', name: 'Ivy Chen', company: 'Bloom Florist', stage: 'ready', print: -1, time: '15:00', fulfillment: 'pickup', items: [item('Tote bag', 24, 'Liberty Bags 8502', 'Natural', 'Heat transfer')], art: '#db2777' },
  { id: 'ORD-1038', name: 'Owen Patel', company: 'Eastside Robotics Club', stage: 'printing', print: -2, time: '10:00', finish: -1, fulfillment: 'pickup', priority: 'rush', items: [item('T-shirt', 36, 'Gildan 64000', 'Silver', 'DTG')], art: '#475569' },
  { id: 'ORD-1039', name: 'Grace Okafor', company: 'Midtown Tech Meetup', stage: 'garments-ordered', print: null, plan: -3, finish: -2, garmentStatus: 'shipped', fulfillment: 'shipping', items: [item('Crewneck', 45, 'Gildan 18000', 'Navy', 'Embroidery', 'Left chest')], art: '#0e7490' },
  { id: 'ORD-1040', name: 'Paul Hendricks', company: 'City Hall Holiday Party', stage: 'art-review', print: -2, time: '13:00', finish: -1, artStatus: 'needs-edit', fulfillment: 'pickup', items: [item('T-shirt', 70, 'Bella+Canvas 3001', 'Red', 'Screen print')], art: '#b91c1c', revision: 'Logo is low-res, asked for vector file.' },
  { id: 'ORD-1042', name: 'Camille Laurent', company: 'Café Atlas', stage: 'printing', print: 0, time: '09:00', hours: 2, fulfillment: 'pickup', items: [item('T-shirt', 48, 'Comfort Colors 1717', 'Ivory', 'Screen print', 'Front')], art: '#78350f' },
  { id: 'ORD-1036', name: 'Nadia Torres', company: 'Lakeside Yoga Studio', stage: 'printing', print: 0, time: '11:30', hours: 1.5, fulfillment: 'shipping', items: [item('Crewneck', 30, 'Independent SS3000', 'Sage', 'DTG')], art: '#4d7c0f' },
  { id: 'ORD-1043', name: 'Hank Miller', company: 'Copper Kettle Diner', stage: 'print-scheduled', print: 0, time: '14:00', hours: 2.5, fulfillment: 'pickup', items: [item('T-shirt', 72, 'Gildan 5000', 'Maroon', 'Screen print', 'Front + Back')], art: '#9a3412' },
  { id: 'ORD-1044', name: 'Sofia Bennett', company: 'Westfield High Drama', stage: 'print-scheduled', print: 1, time: '09:00', garmentStatus: 'shipped', priority: 'rush', fulfillment: 'pickup', items: [item('T-shirt', 90, 'Gildan 5000', 'Purple', 'Screen print', 'Front', ['S', 'M', 'L', 'XL', '2XL'])], art: '#6d28d9' },
  { id: 'ORD-1045', name: 'Ella Brooks', company: 'Golden Hour Weddings', stage: 'print-scheduled', print: 3, time: '10:00', fulfillment: 'shipping', items: [item('Tote bag', 60, 'Q-Tees Q800', 'Natural', 'Screen print')], art: '#ca8a04' },
  { id: 'ORD-1046', name: 'Derek Vaughn', company: 'Peak Performance CrossFit', stage: 'print-scheduled', print: 4, time: '08:30', fulfillment: 'pickup', items: [item('T-shirt', 150, 'Next Level 6210', 'Charcoal', 'Screen print'), item('Hoodie', 40, 'Independent SS4500', 'Black', 'Screen print', 'Back')], art: '#0f172a' },
  { id: 'ORD-1047', name: 'Maya Lindqvist', company: 'Summer Sound Festival', stage: 'print-scheduled', print: 4, time: '13:00', priority: 'rush', fulfillment: 'shipping', items: [item('T-shirt', 220, 'Bella+Canvas 3001', 'Sunset', 'Screen print', 'Front + Back')], art: '#e11d48' },
  { id: 'ORD-1049', name: 'Coach Ray Dunn', company: 'Tidewater Swim Club', stage: 'print-scheduled', print: 8, time: '10:00', garmentStatus: 'ordered', fulfillment: 'pickup', items: [item('Hoodie', 55, 'Champion S700', 'Navy', 'Embroidery', 'Left chest')], art: '#0369a1' },
  { id: 'ORD-1050', name: 'Ben Carter', company: 'Pinecrest Scouts Troop 12', stage: 'garments-ordered', print: null, plan: 7, fulfillment: 'pickup', garmentStatus: 'shipped', items: [item('T-shirt', 64, 'Gildan 5000B', 'Olive', 'Screen print', 'Front', ['XS', 'S', 'M', 'L'])], art: '#3f6212' },
  { id: 'ORD-1051', name: 'Lucia Romano', company: 'Oak & Ember Pizza', stage: 'garments-ordered', print: null, plan: 5, priority: 'rush', garmentStatus: 'ordered', fulfillment: 'pickup', items: [item('T-shirt', 40, 'Comfort Colors 1717', 'Black', 'DTG'), item('Hat', 20, 'Yupoong 6245CM', 'Black', 'Embroidery')], art: '#c2410c' },
  { id: 'ORD-1052', name: 'Kat "Blitz" Moreno', company: 'Rolling Thunder Derby', stage: 'art-approved', print: null, plan: 10, fulfillment: 'shipping', items: [item('Tank top', 35, 'Next Level 1533', 'Hot Pink', 'Screen print')], art: '#be185d' },
  { id: 'ORD-1053', name: 'Amélie Dubois', company: 'Fern & Fig Bakery', stage: 'art-approved', print: null, plan: 9, fulfillment: 'pickup', items: [item('T-shirt', 30, 'Bella+Canvas 3001', 'Heather Mauve', 'DTG'), item('Tote bag', 30, 'Liberty Bags 8502', 'Natural', 'DTG')], art: '#9d174d' },
  { id: 'ORD-1054', name: 'Pastor Jim Hale', company: 'Hilltop Church Youth', stage: 'art-review', print: 2, time: '13:30', artStatus: 'needs-edit', fulfillment: 'pickup', items: [item('T-shirt', 85, 'Gildan 5000', 'Light Blue', 'Screen print')], art: '#2563eb', revision: 'Customer wants the year bigger and the verse removed.' },
  { id: 'ORD-1055', name: 'Mia Schultz', company: 'Velocity Cycling Club', stage: 'art-review', print: 12, time: '09:00', artStatus: 'pending', fulfillment: 'shipping', items: [item('Polo', 28, 'Sport-Tek ST650', 'True Red', 'Embroidery', 'Left chest')], art: '#dc2626' },
  { id: 'ORD-1056', name: 'Andre Wallace', company: 'Kingsway Barbers', stage: 'art-received', print: 14, time: '11:00', fulfillment: 'pickup', items: [item('T-shirt', 24, 'Comfort Colors 1717', 'Black', 'DTF')], art: '#18181b' },
  { id: 'ORD-1057', name: 'Zoe Fischer', company: 'Neon Arcade Bar', stage: 'art-received', print: 17, time: '14:00', priority: 'rush', fulfillment: 'shipping', items: [item('T-shirt', 100, 'Next Level 3600', 'Black', 'Screen print', 'Front + Back')], art: '#a21caf' },
  { id: 'ORD-1059', name: 'Samuel Price', company: 'Jazz on the Square', stage: 'request-received', print: 28, time: '10:00', fulfillment: 'pickup', items: [item('T-shirt', 150, 'Gildan 5000', 'Navy', 'Screen print')], art: '#1e3a8a' },
  { id: 'ORD-1060', name: 'Helen Ward', company: 'Riverside Marathon', stage: 'request-received', print: null, plan: 33, fulfillment: 'shipping', items: [item('T-shirt', 300, 'Next Level 3600', 'Heather Blue', 'Screen print', 'Front + Back')], art: '#0284c7' },
];

const ASSIGNEES = ['Vincent', 'Maya', 'Jordan', 'Priya'];
const SUPPLIERS = ['SanMar', 'S&S Activewear', 'alphabroder'];

function buildOrder(seed, index, now) {
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rush = seed.priority === 'rush';
  const idx = stageIndex(seed.stage);

  // Anchor date = print date (or planned date when unscheduled).
  const anchor = shiftFromToday(todayDate, seed.print ?? seed.plan ?? 7);
  const [hh, mm] = (seed.time || '09:00').split(':').map(Number);
  const printDate = seed.print === null || seed.print === undefined ? null : setMinutes(setHours(anchor, hh), mm);

  const requested = weekday(subDays(anchor, rush ? 9 : 18), -1);
  const artApprovalDue = weekday(subDays(anchor, rush ? 3 : 5), -1);
  const garmentsEta = weekday(subDays(anchor, 2), -1);
  const finishDate =
    seed.finish !== undefined ? shiftFromToday(todayDate, seed.finish) : weekday(addDays(anchor, rush ? 1 : 2), 1);

  // Stage history: one entry per stage reached, spread between request date and now.
  const stageHistory = STAGES.slice(0, idx + 1).map((s, i) => {
    const stepDate = min([addDays(requested, i * 2), now]);
    return {
      stage: s.id,
      date: toDateTimeKey(setHours(stepDate, 9 + (i % 6))),
      by: i < 2 ? seed.name : ASSIGNEES[(index + i) % ASSIGNEES.length],
    };
  });

  let artStatus = 'pending';
  if (idx >= stageIndex('art-approved')) artStatus = 'approved';
  if (seed.artStatus) artStatus = seed.artStatus;

  const hasArt = idx >= stageIndex('art-received');
  const label = initials(seed.company);

  let garmentOrder = null;
  if (idx >= stageIndex('garments-ordered')) {
    const status = seed.garmentStatus || 'received';
    garmentOrder = {
      po: `PO-${5300 + index * 7}`,
      supplier: SUPPLIERS[index % SUPPLIERS.length],
      orderedOn: toDateKey(min([addDays(artApprovalDue, 1), now])),
      status, // "ordered" | "shipped" | "received"
      receivedOn: status === 'received' ? toDateKey(min([garmentsEta, now])) : null,
    };
  }

  const items = seed.items;
  return {
    id: seed.id,
    customer: {
      name: seed.name,
      company: seed.company,
      email: `${slug(seed.name.split(' ')[0])}@${slug(seed.company)}.com`,
      phone: `(555) 01${String(10 + index).padStart(2, '0')}-${String(2300 + index * 37).slice(-4)}`,
    },
    items,
    artwork: {
      fileName: hasArt ? `${slug(seed.company)}-logo-v${seed.revision ? 2 : 1}.${index % 3 ? 'png' : 'ai'}` : null,
      thumbnailUrl: hasArt ? makeThumbnail(label, seed.art) : null,
      status: artStatus, // "pending" | "needs-edit" | "approved"
      notes: hasArt ? 'Print-ready file supplied by customer.' : '',
      revisions: seed.revision
        ? [{ date: toDateTimeKey(subDays(now, 1)), note: seed.revision, by: 'Sarah' }]
        : [],
    },
    stage: seed.stage,
    stageHistory,
    dates: {
      requested: toDateKey(requested),
      artApprovalDue: toDateKey(artApprovalDue),
      garmentsEta: toDateKey(garmentsEta),
      printDate: printDate ? toDateTimeKey(printDate) : null,
      finishDate: toDateKey(finishDate),
    },
    estimatedHours: seed.hours ?? estimateHours(items),
    garmentOrder,
    fulfillment: seed.fulfillment,
    priority: seed.priority || 'normal',
    assignee: ASSIGNEES[index % ASSIGNEES.length],
    notes: rush ? 'Rush job — customer confirmed rush fee.' : '',
  };
}

export function generateOrders(now = new Date()) {
  return SEEDS.map((seed, i) => buildOrder(seed, i, now));
}

/** Seed the activity feed from recent stage changes. */
export function generateActivity(orders, now = new Date()) {
  const recentCutoff = subDays(now, 6);
  const entries = [];
  for (const order of orders) {
    const who = order.customer.company;
    for (const step of order.stageHistory) {
      const date = new Date(step.date);
      if (date < recentCutoff || step.stage === 'request-received') continue;
      let type = 'stage';
      let message = `${order.id} moved to ${stageLabel(step.stage)}`;
      if (step.stage === 'art-received') {
        type = 'art-uploaded';
        message = `${who} uploaded artwork for ${order.id}`;
      } else if (step.stage === 'art-approved') {
        type = 'art-approved';
        message = `Artwork approved for ${order.id} (${who})`;
      }
      entries.push({ id: `${order.id}-${step.stage}`, type, orderId: order.id, message, date: step.date });
    }
    if (order.garmentOrder?.status === 'received' && order.garmentOrder.receivedOn) {
      const date = `${order.garmentOrder.receivedOn}T08:15`;
      if (new Date(date) >= recentCutoff) {
        entries.push({
          id: `${order.id}-garments`,
          type: 'garments-arrived',
          orderId: order.id,
          message: `Garments arrived from ${order.garmentOrder.supplier} for ${order.id}`,
          date,
        });
      }
    }
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40);
}
