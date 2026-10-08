/** Use-case mockups (1536x1024), all-English Integram UI with Western sample data in USD. */
import {
  C, rect, text, line, circle, path, svgDoc, appShell, table, kpi, card, badge, badgeW, rel, progress, button,
  avatar, icon, fit, wrap, tw, bubble, toolCall, logo,
} from './lib.mjs'

const W = 1536
const H = 1024

const NAV = (items) => items.map(([label, ic, count]) => ({ label, icon: ic, count }))

function shell(o) {
  return appShell(W, H, o)
}

// ── 1. CRM ────────────────────────────────────────────────────────────────
function crm() {
  const sh = shell({
    workspace: 'Northwind Sales',
    nav: NAV([['Pipeline', 'chart'], ['Contacts', 'users', '2,418'], ['Companies', 'box', '364'], ['Activities', 'cal', '48'], ['Reports', 'doc'], ['Settings', 'cog']]),
    active: 0, title: 'Sales pipeline', crumbs: 'Deals  ·  Q4 2026  ·  All owners',
    actions: [{ label: 'Import', primary: false }, { label: '+ New deal', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const kw = (w - 3 * 20) / 4
  s += kpi(x, y, kw, 'Open pipeline', '$1,248,500', '+12.4%')
  s += kpi(x + (kw + 20), y, kw, 'Won this quarter', '$386,200', '+8.1%')
  s += kpi(x + 2 * (kw + 20), y, kw, 'Win rate', '34%', '+2.3 pts')
  s += kpi(x + 3 * (kw + 20), y, kw, 'Avg. deal size', '$18,240', '-3.2%', false)
  const cols = [
    ['Qualified', '12 deals  ·  $284,000', C.faint, [
      ['Brightwater Logistics', 'Daniel Brooks', '$42,000', 'blue', 'Demo booked'],
      ['Harbor & Finch LLP', 'Sophie Turner', '$18,500', 'gray', 'New'],
      ['Lumen Analytics', 'Marcus Reid', '$31,200', 'blue', 'Demo booked'],
      ['Oakridge Dental Group', 'Priya Nair', '$9,800', 'gray', 'New'],
    ]],
    ['Proposal sent', '9 deals  ·  $412,300', C.brand, [
      ['Summit Outdoor Co.', 'Daniel Brooks', '$64,000', 'violet', 'Awaiting reply'],
      ['Greenfield Foods', 'Olivia Hayes', '$27,900', 'amber', 'Follow up today'],
      ['Meridian Health Clinics', 'Marcus Reid', '$88,400', 'violet', 'Awaiting reply'],
    ]],
    ['Negotiation', '6 deals  ·  $351,700', C.violet, [
      ['Atlas Freight Partners', 'Sophie Turner', '$112,000', 'amber', 'Legal review'],
      ['Redwood Software Inc.', 'Olivia Hayes', '$46,500', 'violet', 'Pricing call'],
      ['Cobalt Energy', 'Priya Nair', '$38,000', 'violet', 'Pricing call'],
    ]],
    ['Won', '8 deals  ·  $386,200', C.green, [
      ['Pinecrest Realty', 'Marcus Reid', '$21,400', 'green', 'Signed Oct 3'],
      ['Beacon Marketing Ltd', 'Daniel Brooks', '$15,800', 'green', 'Signed Oct 1'],
      ['Alder & Co. Architects', 'Olivia Hayes', '$29,000', 'green', 'Signed Sep 28'],
      ['Kestrel Aviation', 'Sophie Turner', '$54,000', 'green', 'Signed Sep 26'],
    ]],
  ]
  const top = y + 104 + 28
  const colW = (w - 3 * 18) / 4
  cols.forEach(([name, sum, colr, cards], i) => {
    const cx = x + i * (colW + 18)
    s += rect(cx, top, colW, 6, { fill: colr, r: 3 })
    s += text(cx, top + 34, name, { size: 16, weight: 700, fill: C.ink }) + text(cx, top + 56, sum, { size: 13, fill: C.muted })
    cards.forEach((c, j) => {
      const cy = top + 76 + j * 150
      s += card(cx, cy, colW, 136)
      s += text(cx + 18, cy + 32, fit(c[0], 16, colW - 36, true), { size: 16, weight: 700, fill: C.ink })
      s += text(cx + 18, cy + 62, c[2], { size: 22, weight: 700, fill: C.ink })
      s += badge(cx + 18, cy + 92, c[4], c[3])
      s += avatar(cx + colW - 34, cy + 100, 15, c[1], j + i)
      s += text(cx + 18, cy + 124, c[1], { size: 12.5, fill: C.muted })
    })
  })
  return svgDoc(W, H, s)
}

// ── 2. Inventory ──────────────────────────────────────────────────────────
function inventory() {
  const sh = shell({
    workspace: 'Harbor Supply Co.',
    nav: NAV([['Stock levels', 'box', '1,284'], ['Warehouses', 'grid', '4'], ['Purchase orders', 'cart', '17'], ['Suppliers', 'users', '36'], ['Movements', 'chart'], ['Settings', 'cog']]),
    active: 0, title: 'Stock levels', crumbs: 'Products  ·  All warehouses',
    actions: [{ label: 'Export CSV', primary: false }, { label: '+ Stock movement', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const kw = (w - 3 * 20) / 4
  s += kpi(x, y, kw, 'Inventory value', '$2,458,320', '+4.2%')
  s += kpi(x + (kw + 20), y, kw, 'SKUs in stock', '1,284', '')
  s += kpi(x + 2 * (kw + 20), y, kw, 'Below reorder level', '23', '+5', false)
  s += kpi(x + 3 * (kw + 20), y, kw, 'Open purchase orders', '17', '$184,900')
  const tw_ = w - 360
  s += table(x, y + 132, tw_, [
    { h: 'SKU', w: 115 }, { h: 'Product', w: 215 }, { h: 'Warehouse', w: 170 }, { h: 'On hand', w: 90, align: 'right' }, { h: 'Reorder at', w: 100, align: 'right' }, { h: 'Unit cost', w: 100, align: 'right' }, { h: 'Status', w: 130 },
  ], [
    ['HW-1042', { t: 'bold', v: 'Steel bracket 40 mm' }, { t: 'rel', v: 'Chicago DC' }, { t: 'num', v: '4,820', b: 1 }, { t: 'num', v: '1,500' }, { t: 'num', v: '$0.84' }, { t: 'badge', v: 'In stock', c: 'green' }],
    ['HW-1187', { t: 'bold', v: 'Hex bolt M8 (box 100)' }, { t: 'rel', v: 'Chicago DC' }, { t: 'num', v: '312', b: 1, f: C.red }, { t: 'num', v: '400' }, { t: 'num', v: '$12.50' }, { t: 'badge', v: 'Reorder', c: 'amber' }],
    ['EL-2210', { t: 'bold', v: 'LED panel 60 W' }, { t: 'rel', v: 'Dallas Hub' }, { t: 'num', v: '1,096', b: 1 }, { t: 'num', v: '300' }, { t: 'num', v: '$24.90' }, { t: 'badge', v: 'In stock', c: 'green' }],
    ['EL-2304', { t: 'bold', v: 'Power supply 12 V' }, { t: 'rel', v: 'Dallas Hub' }, { t: 'num', v: '58', b: 1, f: C.red }, { t: 'num', v: '120' }, { t: 'num', v: '$9.35' }, { t: 'badge', v: 'Low stock', c: 'red' }],
    ['PK-3001', { t: 'bold', v: 'Shipping carton L' }, { t: 'rel', v: 'Newark Depot' }, { t: 'num', v: '9,400', b: 1 }, { t: 'num', v: '2,000' }, { t: 'num', v: '$0.62' }, { t: 'badge', v: 'In stock', c: 'green' }],
    ['PK-3018', { t: 'bold', v: 'Bubble wrap roll 50 m' }, { t: 'rel', v: 'Newark Depot' }, { t: 'num', v: '144', b: 1 }, { t: 'num', v: '150' }, { t: 'num', v: '$18.20' }, { t: 'badge', v: 'Reorder', c: 'amber' }],
    ['TL-4100', { t: 'bold', v: 'Cordless drill 18 V' }, { t: 'rel', v: 'Seattle Annex' }, { t: 'num', v: '76', b: 1 }, { t: 'num', v: '25' }, { t: 'num', v: '$89.00' }, { t: 'badge', v: 'In stock', c: 'green' }],
    ['TL-4122', { t: 'bold', v: 'Safety gloves (pair)' }, { t: 'rel', v: 'Seattle Annex' }, { t: 'num', v: '2,310', b: 1 }, { t: 'num', v: '500' }, { t: 'num', v: '$3.15' }, { t: 'badge', v: 'In stock', c: 'green' }],
    ['HW-1250', { t: 'bold', v: 'Anchor plate 6 mm' }, { t: 'rel', v: 'Chicago DC' }, { t: 'num', v: '0', b: 1, f: C.red }, { t: 'num', v: '200' }, { t: 'num', v: '$5.40' }, { t: 'badge', v: 'Out of stock', c: 'red' }],
    ['EL-2411', { t: 'bold', v: 'Cable tie pack 200' }, { t: 'rel', v: 'Dallas Hub' }, { t: 'num', v: '860', b: 1 }, { t: 'num', v: '250' }, { t: 'num', v: '$4.10' }, { t: 'badge', v: 'In stock', c: 'green' }],
    ['PK-3044', { t: 'bold', v: 'Packing tape 48 mm' }, { t: 'rel', v: 'Newark Depot' }, { t: 'num', v: '1,540', b: 1 }, { t: 'num', v: '400' }, { t: 'num', v: '$1.95' }, { t: 'badge', v: 'In stock', c: 'green' }],
  ], { rowH: 58, highlight: 3 })
  // side panel: stock by warehouse
  const px = x + tw_ + 20
  const pw = w - tw_ - 20
  s += card(px, y + 132, pw, 330)
  s += text(px + 22, y + 168, 'Value by warehouse', { size: 16, weight: 700, fill: C.ink })
  const wh = [['Chicago DC', 0.86, '$912K'], ['Dallas Hub', 0.64, '$684K'], ['Newark Depot', 0.5, '$520K'], ['Seattle Annex', 0.34, '$342K']]
  wh.forEach(([n, p, v], i) => {
    const by = y + 204 + i * 62
    s += text(px + 22, by + 12, n, { size: 13.5, fill: C.text }) + text(px + pw - 22, by + 12, v, { size: 13.5, weight: 700, fill: C.ink, anchor: 'end' })
    s += progress(px + 22, by + 24, pw - 44, p, [C.brand, C.violet, C.green, C.amber][i], 10)
  })
  s += card(px, y + 482, pw, 212)
  s += text(px + 22, y + 518, 'Reorder suggestions', { size: 16, weight: 700, fill: C.ink })
  ;[['Power supply 12 V', 'Order 400 pcs'], ['Hex bolt M8', 'Order 800 pcs'], ['Anchor plate 6 mm', 'Order 1,000 pcs']].forEach(([a, b], i) => {
    const by = y + 556 + i * 46
    s += text(px + 22, by + 4, a, { size: 13.5, weight: 700, fill: C.ink }) + text(px + 22, by + 22, b, { size: 12.5, fill: C.muted })
    s += button(px + pw - 82, by - 10, 'Create PO', { primary: false, w: 62, h: 30, size: 11 })
  })
  return svgDoc(W, H, s)
}

// ── 3. Orders ─────────────────────────────────────────────────────────────
function orders() {
  const sh = shell({
    workspace: 'Brightside Goods',
    nav: NAV([['Orders', 'cart', '312'], ['Customers', 'users', '1,870'], ['Products', 'box', '246'], ['Shipments', 'grid', '41'], ['Invoices', 'doc'], ['Settings', 'cog']]),
    active: 0, title: 'Orders', crumbs: 'Today  ·  42 orders  ·  $38,420 revenue',
    actions: [{ label: 'Filters', primary: false }, { label: '+ New order', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const tabs = [['All', '312'], ['Pending', '18'], ['Paid', '203'], ['Shipped', '74'], ['Refunded', '5']]
  let tx = x
  tabs.forEach(([t, n], i) => {
    const tw2 = tw(t, 14, true) + tw(n, 12, true) + 44
    s += rect(tx, y, tw2, 36, i === 0 ? { fill: C.ink, r: 18 } : { fill: C.white, stroke: C.line, r: 18 })
    s += text(tx + 16, y + 23, t, { size: 14, weight: 700, fill: i === 0 ? '#fff' : C.text }) + text(tx + 16 + tw(t, 14, true) + 8, y + 23, n, { size: 12, weight: 700, fill: i === 0 ? '#94a3b8' : C.faint })
    tx += tw2 + 10
  })
  const tw_ = w - 400
  s += table(x, y + 56, tw_, [
    { h: 'Order', w: 100 }, { h: 'Customer', w: 205 }, { h: 'Date', w: 135 }, { h: 'Items', w: 70, align: 'right' }, { h: 'Total', w: 110, align: 'right' }, { h: 'Payment', w: 110 }, { h: 'Status', w: 130 },
  ], [
    [{ t: 'bold', v: '#10482' }, { t: 'rel', v: 'Hannah Whitfield' }, 'Oct 7, 2026', { t: 'num', v: '3' }, { t: 'num', v: '$214.80', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Packing', c: 'blue' }],
    [{ t: 'bold', v: '#10481' }, { t: 'rel', v: 'Oliver Grant' }, 'Oct 7, 2026', { t: 'num', v: '1' }, { t: 'num', v: '$89.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Shipped', c: 'violet' }],
    [{ t: 'bold', v: '#10480' }, { t: 'rel', v: 'Maple & Oak Interiors' }, 'Oct 6, 2026', { t: 'num', v: '12' }, { t: 'num', v: '$1,962.40', b: 1 }, { t: 'badge', v: 'Pending', c: 'amber' }, { t: 'badge', v: 'New', c: 'gray' }],
    [{ t: 'bold', v: '#10479' }, { t: 'rel', v: 'Isabella Moreno' }, 'Oct 6, 2026', { t: 'num', v: '2' }, { t: 'num', v: '$142.50', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Shipped', c: 'violet' }],
    [{ t: 'bold', v: '#10478' }, { t: 'rel', v: 'Thomas Eriksen' }, 'Oct 6, 2026', { t: 'num', v: '5' }, { t: 'num', v: '$476.25', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Delivered', c: 'green' }],
    [{ t: 'bold', v: '#10477' }, { t: 'rel', v: 'Lakeview Cafe Group' }, 'Oct 5, 2026', { t: 'num', v: '24' }, { t: 'num', v: '$3,310.00', b: 1 }, { t: 'badge', v: 'Invoiced', c: 'blue' }, { t: 'badge', v: 'Packing', c: 'blue' }],
    [{ t: 'bold', v: '#10476' }, { t: 'rel', v: 'Grace Nakamura' }, 'Oct 5, 2026', { t: 'num', v: '1' }, { t: 'num', v: '$64.90', b: 1 }, { t: 'badge', v: 'Refunded', c: 'red' }, { t: 'badge', v: 'Returned', c: 'red' }],
    [{ t: 'bold', v: '#10475' }, { t: 'rel', v: 'Benjamin Clarke' }, 'Oct 5, 2026', { t: 'num', v: '4' }, { t: 'num', v: '$318.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Delivered', c: 'green' }],
    [{ t: 'bold', v: '#10474' }, { t: 'rel', v: 'Sunrise Pharmacy' }, 'Oct 4, 2026', { t: 'num', v: '18' }, { t: 'num', v: '$2,745.60', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Shipped', c: 'violet' }],
    [{ t: 'bold', v: '#10473' }, { t: 'rel', v: 'Chloe Anderson' }, 'Oct 4, 2026', { t: 'num', v: '2' }, { t: 'num', v: '$127.40', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Delivered', c: 'green' }],
    [{ t: 'bold', v: '#10472' }, { t: 'rel', v: 'Nathan Brooks' }, 'Oct 4, 2026', { t: 'num', v: '6' }, { t: 'num', v: '$589.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Delivered', c: 'green' }],
    [{ t: 'bold', v: '#10471' }, { t: 'rel', v: 'Evelyn Park' }, 'Oct 3, 2026', { t: 'num', v: '1' }, { t: 'num', v: '$45.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }, { t: 'badge', v: 'Delivered', c: 'green' }],
  ], { rowH: 54, highlight: 0 })
  // detail panel
  const px = x + tw_ + 20
  const pw = w - tw_ - 20
  s += card(px, y + 56, pw, 732, { shadow: true })
  s += text(px + 24, y + 96, 'Order #10482', { size: 20, weight: 700, fill: C.ink }) + badge(px + pw - 24 - badgeW('Packing'), y + 90, 'Packing', 'blue')
  s += text(px + 24, y + 120, 'Oct 7, 2026, 9:42 AM  ·  Web store', { size: 13, fill: C.muted })
  s += line(px + 24, y + 142, px + pw - 24, y + 142)
  s += avatar(px + 44, y + 182, 20, 'Hannah Whitfield', 0) + text(px + 74, y + 178, 'Hannah Whitfield', { size: 15, weight: 700, fill: C.ink }) + text(px + 74, y + 198, 'hannah.w@example.com', { size: 12.5, fill: C.muted })
  s += text(px + 24, y + 242, '742 Evergreen Terrace, Portland, OR 97205', { size: 13, fill: C.muted })
  s += line(px + 24, y + 264, px + pw - 24, y + 264)
  ;[['Ceramic pour-over set', '1 × $89.00', '$89.00'], ['Linen apron, sage', '2 × $42.50', '$85.00'], ['Cold brew beans 1 kg', '1 × $32.00', '$32.00']].forEach(([a, b, c], i) => {
    const iy = y + 296 + i * 64
    s += rect(px + 24, iy, 44, 44, { fill: C.slateSoft, r: 10 }) + icon('box', px + 34, iy + 10, 24, C.faint)
    s += text(px + 82, iy + 18, fit(a, 14, pw - 190, true), { size: 14, weight: 700, fill: C.ink }) + text(px + 82, iy + 38, b, { size: 12.5, fill: C.muted })
    s += text(px + pw - 24, iy + 26, c, { size: 14, weight: 700, fill: C.ink, anchor: 'end' })
  })
  s += line(px + 24, y + 500, px + pw - 24, y + 500)
  ;[['Subtotal', '$206.00'], ['Shipping', '$8.80'], ['Tax', '$0.00']].forEach(([a, b], i) => {
    s += text(px + 24, y + 530 + i * 26, a, { size: 13.5, fill: C.muted }) + text(px + pw - 24, y + 530 + i * 26, b, { size: 13.5, fill: C.text, anchor: 'end' })
  })
  s += text(px + 24, y + 624, 'Total', { size: 16, weight: 700, fill: C.ink }) + text(px + pw - 24, y + 626, '$214.80', { size: 24, weight: 700, fill: C.ink, anchor: 'end' })
  s += button(px + 24, y + 660, 'Create shipping label', { w: pw - 48, h: 44 })
  s += button(px + 24, y + 716, 'Send invoice', { primary: false, w: pw - 48, h: 44 })
  return svgDoc(W, H, s)
}

// ── 4. Project tracking ───────────────────────────────────────────────────
function projectTracking() {
  const sh = shell({
    workspace: 'Pixel & Pine',
    nav: NAV([['Timeline', 'cal'], ['Tasks', 'table', '86'], ['Projects', 'grid', '9'], ['Team', 'users', '14'], ['Time & budget', 'money'], ['Settings', 'cog']]),
    active: 0, title: 'Website redesign', crumbs: 'Projects  ·  Acme Retail  ·  Due Dec 12, 2026',
    actions: [{ label: 'Share', primary: false }, { label: '+ Add task', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const lw = 380
  const gx = x + lw
  const gw = w - lw
  const weeks = ['Oct 5', 'Oct 12', 'Oct 19', 'Oct 26', 'Nov 2', 'Nov 9', 'Nov 16', 'Nov 23', 'Nov 30', 'Dec 7']
  const ww = gw / weeks.length
  s += card(x, y, w, 760)
  s += rect(x, y, w, 52, { fill: '#f8fafc' }) + line(x, y + 52, x + w, y + 52)
  s += text(x + 22, y + 32, 'TASK', { size: 11.5, weight: 700, fill: C.muted, spacing: 0.6 }) + text(x + 300, y + 32, 'OWNER', { size: 11.5, weight: 700, fill: C.muted, spacing: 0.6 })
  weeks.forEach((wk, i) => {
    s += text(gx + i * ww + 12, y + 32, wk, { size: 12.5, weight: 700, fill: C.muted })
    s += line(gx + i * ww, y + 52, gx + i * ww, y + 760, { stroke: '#eef2f7' })
  })
  const tasks = [
    ['Discovery & research', 'Liam Foster', 0, 1.6, C.green, 1],
    ['Information architecture', 'Ava Mitchell', 1, 2.0, C.green, 1],
    ['Brand & visual direction', 'Noah Bennett', 1.5, 2.5, C.green, 1],
    ['Homepage design', 'Ava Mitchell', 3, 2.2, C.brand, 0.7],
    ['Product page templates', 'Noah Bennett', 3.5, 2.6, C.brand, 0.55],
    ['Design system & components', 'Ethan Cole', 4, 2.4, C.brand, 0.4],
    ['Front-end development', 'Mia Sullivan', 5.2, 3.2, C.violet, 0.2],
    ['CMS integration', 'Ethan Cole', 6.2, 2.0, C.violet, 0.1],
    ['Content migration', 'Liam Foster', 6.8, 2.2, C.amber, 0],
    ['QA & accessibility audit', 'Mia Sullivan', 8.2, 1.2, C.amber, 0],
    ['Launch', 'Olivia Ward', 9.0, 0.8, C.red, 0],
  ]
  const rh = 62
  tasks.forEach(([n, o, st, len, col, pr], i) => {
    const ry = y + 52 + i * rh
    if (i > 0) s += line(x, ry, x + w, ry, { stroke: '#eef2f7' })
    s += text(x + 22, ry + 36, n, { size: 14.5, weight: 700, fill: C.ink })
    s += avatar(x + 308, ry + 31, 14, o, i) + text(x + 330, ry + 36, o.split(' ')[0], { size: 13, fill: C.muted })
    const bx = gx + st * ww
    s += rect(bx, ry + 16, len * ww, 30, { fill: col, r: 8, opacity: 0.22 })
    s += rect(bx, ry + 16, Math.max(0, len * ww * pr), 30, { fill: col, r: 8 })
    if (pr >= 0.3 && pr < 1) s += text(bx + 12, ry + 36, Math.round(pr * 100) + '%', { size: 12.5, weight: 700, fill: '#fff' })
  })
  // today line
  const tx = gx + 3.6 * ww
  s += line(tx, y + 52, tx, y + 760, { stroke: C.red, sw: 2, dash: '5 4' })
  s += rect(tx - 28, y + 764, 56, 22, { fill: C.red, r: 11 }) + text(tx, y + 779.5, 'Today', { size: 12, weight: 700, fill: '#fff', anchor: 'middle' })
  s += text(x, y + 822, 'Milestone health', { size: 13, weight: 700, fill: C.muted })
  ;[['On track', 'green'], ['At risk: Front-end development (+4 days)', 'amber'], ['Budget used: $38,400 of $61,000', 'blue']].reduce((ax, [l, c]) => {
    s += badge(ax, y + 856, l, c, 13)
    return ax + badgeW(l, 13) + 14
  }, x)
  return svgDoc(W, H, s)
}

// ── 5. HR onboarding ──────────────────────────────────────────────────────
function hr() {
  const sh = shell({
    workspace: 'Clearwater Group', user: 'Rachel Kim', role: 'HR Manager',
    nav: NAV([['Onboarding', 'users', '6'], ['Employees', 'users', '142'], ['Checklists', 'table'], ['Documents', 'doc'], ['Equipment', 'box'], ['Settings', 'cog']]),
    active: 0, title: 'Onboarding', crumbs: 'New hires  ·  Starting in October',
    actions: [{ label: 'Templates', primary: false }, { label: '+ New hire', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const hires = [
    ['Jordan Ellis', 'Product Designer', 'Starts Oct 12', 0.85, C.green],
    ['Priya Raman', 'Data Analyst', 'Starts Oct 12', 0.6, C.brand],
    ['Marcus Webb', 'Account Executive', 'Starts Oct 19', 0.35, C.brand],
    ['Sofia Alvarez', 'Support Lead', 'Starts Oct 26', 0.15, C.amber],
  ]
  const cw = (w - 3 * 18) / 4
  hires.forEach(([n, r, d, p, col], i) => {
    const cx = x + i * (cw + 18)
    s += card(cx, y, cw, 176)
    s += avatar(cx + 38, y + 44, 22, n, i + 3) + text(cx + 72, y + 40, n, { size: 16, weight: 700, fill: C.ink }) + text(cx + 72, y + 60, r, { size: 13, fill: C.muted })
    s += text(cx + 22, y + 108, d, { size: 13, fill: C.muted }) + text(cx + cw - 22, y + 108, Math.round(p * 100) + '%', { size: 14, weight: 700, fill: C.ink, anchor: 'end' })
    s += progress(cx + 22, y + 122, cw - 44, p, col, 10)
    s += text(cx + 22, y + 160, Math.round(p * 14) + ' of 14 tasks done', { size: 12.5, fill: C.muted })
  })
  s += text(x, y + 222, 'Jordan Ellis: onboarding checklist', { size: 18, weight: 700, fill: C.ink })
  s += table(x, y + 244, w, [
    { h: 'Task', w: 340 }, { h: 'Owner', w: 190 }, { h: 'Linked record', w: 220 }, { h: 'Due', w: 120 }, { h: 'Status', w: 140 },
  ], [
    [{ t: 'bold', v: 'Sign employment agreement' }, { t: 'name', v: 'Rachel Kim' }, { t: 'rel', v: 'Contract #C-2026-118' }, 'Oct 8', { t: 'badge', v: 'Done', c: 'green' }],
    [{ t: 'bold', v: 'Collect tax and bank forms' }, { t: 'name', v: 'Rachel Kim' }, { t: 'rel', v: 'Forms W-4, direct deposit' }, 'Oct 9', { t: 'badge', v: 'Done', c: 'green' }],
    [{ t: 'bold', v: 'Order laptop and accessories' }, { t: 'name', v: 'Dylan Ross' }, { t: 'rel', v: 'MacBook Pro 14"' }, 'Oct 9', { t: 'badge', v: 'Done', c: 'green' }],
    [{ t: 'bold', v: 'Create email and SSO accounts' }, { t: 'name', v: 'Dylan Ross' }, { t: 'rel', v: 'j.ellis@clearwater.example' }, 'Oct 10', { t: 'badge', v: 'Done', c: 'green' }],
    [{ t: 'bold', v: 'Schedule first-week meetings' }, { t: 'name', v: 'Karen Doyle' }, { t: 'rel', v: 'Design team' }, 'Oct 11', { t: 'badge', v: 'In progress', c: 'blue' }],
    [{ t: 'bold', v: 'Assign onboarding buddy' }, { t: 'name', v: 'Karen Doyle' }, { t: 'rel', v: 'Ava Mitchell' }, 'Oct 11', { t: 'badge', v: 'In progress', c: 'blue' }],
    [{ t: 'bold', v: 'Security & compliance training' }, { t: 'name', v: 'Jordan Ellis' }, { t: 'rel', v: 'Course SEC-101' }, 'Oct 14', { t: 'badge', v: 'To do', c: 'gray' }],
    [{ t: 'bold', v: '30-day check-in' }, { t: 'name', v: 'Karen Doyle' }, { t: 'rel', v: 'Calendar event' }, 'Nov 11', { t: 'badge', v: 'To do', c: 'gray' }],
  ], { rowH: 60 })
  return svgDoc(W, H, s)
}

// ── 6. Asset management ───────────────────────────────────────────────────
function assets() {
  const sh = shell({
    workspace: 'Vertex Engineering', user: 'Carlos Mendes', role: 'IT Admin',
    nav: NAV([['Assets', 'box', '618'], ['Assignments', 'users'], ['Maintenance', 'wrench', '9'], ['Locations', 'grid', '6'], ['Audit log', 'doc'], ['Settings', 'cog']]),
    active: 0, title: 'Assets', crumbs: 'All categories  ·  618 items  ·  $1,126,400 book value',
    actions: [{ label: 'Scan barcode', primary: false }, { label: '+ Add asset', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const tw_ = w - 340
  s += table(x, y, tw_, [
    { h: 'Tag', w: 100 }, { h: 'Asset', w: 210 }, { h: 'Assigned to', w: 180 }, { h: 'Location', w: 150 }, { h: 'Warranty', w: 125 }, { h: 'Value', w: 100, align: 'right' }, { h: 'Status', w: 120 },
  ], [
    ['A-0412', { t: 'bold', v: 'MacBook Pro 16"' }, { t: 'rel', v: 'Jordan Ellis' }, 'Austin office', 'Mar 2028', { t: 'num', v: '$2,899', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0413', { t: 'bold', v: 'Dell UltraSharp 27"' }, { t: 'rel', v: 'Priya Raman' }, 'Austin office', 'Jan 2028', { t: 'num', v: '$549', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0455', { t: 'bold', v: 'ThinkPad X1 Carbon' }, { t: 'rel', v: 'Marcus Webb' }, 'Denver office', 'Jun 2027', { t: 'num', v: '$1,780', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0498', { t: 'bold', v: 'iPhone 15 Pro' }, { t: 'rel', v: 'Sofia Alvarez' }, 'Remote', 'Sep 2026', { t: 'num', v: '$999', b: 1 }, { t: 'badge', v: 'Expiring', c: 'amber' }],
    ['A-0521', { t: 'bold', v: 'HP LaserJet Pro M404' }, { t: 'rel', v: 'Front desk' }, 'Austin office', 'Nov 2026', { t: 'num', v: '$329', b: 1 }, { t: 'badge', v: 'Repair', c: 'red' }],
    ['A-0533', { t: 'bold', v: 'Cisco Meraki MR46' }, { t: 'rel', v: 'IT infrastructure' }, 'Server room', 'Feb 2029', { t: 'num', v: '$899', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0561', { t: 'bold', v: 'Herman Miller Aeron' }, { t: 'rel', v: 'Dylan Ross' }, 'Denver office', '-', { t: 'num', v: '$1,195', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0577', { t: 'bold', v: 'Logitech Rally Bar' }, { t: 'rel', v: 'Boardroom' }, 'Austin office', 'Apr 2028', { t: 'num', v: '$3,999', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0602', { t: 'bold', v: 'MacBook Air 13"' }, { t: 'badge', v: 'Unassigned', c: 'gray' }, 'Storage', 'Aug 2028', { t: 'num', v: '$1,099', b: 1 }, { t: 'badge', v: 'Available', c: 'blue' }],
    ['A-0618', { t: 'bold', v: 'Wacom Cintiq 22' }, { t: 'rel', v: 'Ava Mitchell' }, 'Austin office', 'May 2027', { t: 'num', v: '$1,199', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0634', { t: 'bold', v: 'Surface Laptop 5' }, { t: 'rel', v: 'Noah Bennett' }, 'Denver office', 'Oct 2026', { t: 'num', v: '$1,299', b: 1 }, { t: 'badge', v: 'Expiring', c: 'amber' }],
    ['A-0640', { t: 'bold', v: 'Synology NAS DS923+' }, { t: 'rel', v: 'IT infrastructure' }, 'Server room', 'Dec 2028', { t: 'num', v: '$599', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
    ['A-0655', { t: 'bold', v: 'iPad Pro 12.9"' }, { t: 'rel', v: 'Field team' }, 'Denver office', 'Jul 2027', { t: 'num', v: '$1,099', b: 1 }, { t: 'badge', v: 'In use', c: 'green' }],
  ], { rowH: 58, highlight: 4 })
  const px = x + tw_ + 20
  const pw = w - tw_ - 20
  s += card(px, y, pw, 400)
  s += text(px + 22, y + 36, 'By category', { size: 16, weight: 700, fill: C.ink })
  // donut
  const cx = px + pw / 2, cy = y + 160, R = 78, r = 50
  const segs = [[0.46, C.brand, 'Laptops'], [0.24, C.violet, 'Monitors'], [0.16, C.green, 'Mobile'], [0.14, C.amber, 'Other']]
  let a0 = -Math.PI / 2
  segs.forEach(([f, col]) => {
    const a1 = a0 + f * Math.PI * 2
    const big = f > 0.5 ? 1 : 0
    const p = (a, rr) => `${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`
    s += path(`M${p(a0, R)} A${R} ${R} 0 ${big} 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 ${big} 0 ${p(a0, r)} Z`, { fill: col })
    a0 = a1
  })
  s += text(cx, cy + 2, '618', { size: 26, weight: 700, fill: C.ink, anchor: 'middle' }) + text(cx, cy + 22, 'assets', { size: 12.5, fill: C.muted, anchor: 'middle' })
  segs.forEach(([f, col, n], i) => {
    const ly = y + 280 + i * 28
    s += circle(px + 30, ly - 4, 6, col) + text(px + 46, ly, n, { size: 13.5, fill: C.text }) + text(px + pw - 22, ly, Math.round(f * 100) + '%', { size: 13.5, weight: 700, fill: C.ink, anchor: 'end' })
  })
  s += card(px, y + 420, pw, 280)
  s += text(px + 22, y + 456, 'Needs attention', { size: 16, weight: 700, fill: C.ink })
  ;[['9 items', 'in maintenance', 'amber'], ['4 warranties', 'expire in 60 days', 'red'], ['11 laptops', 'older than 4 years', 'gray']].forEach(([a, b, c], i) => {
    const by = y + 494 + i * 64
    s += rect(px + 22, by, pw - 44, 52, { fill: C.slateSoft, r: 10 })
    s += text(px + 38, by + 32, a, { size: 15, weight: 700, fill: C.ink }) + text(px + 38 + tw(a, 15, true) + 8, by + 32, b, { size: 13.5, fill: C.muted })
  })
  return svgDoc(W, H, s)
}

// ── 7. AI knowledge base ──────────────────────────────────────────────────
function aiKb() {
  const sh = shell({
    workspace: 'Lighthouse',
    nav: NAV([['Ask AI', 'spark'], ['Articles', 'doc', '412'], ['Collections', 'grid', '18'], ['Sources', 'table', '7'], ['Analytics', 'chart'], ['Settings', 'cog']]),
    active: 0, title: 'Ask the knowledge base', crumbs: 'Answers grounded in your own documents',
    actions: [{ label: 'New chat', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const cw = w - 400
  s += card(x, y, cw, 836)
  let by = y + 28
  let b = bubble(x + cw - 460 - 24, by, 460, 'user', ['How many vacation days do new employees get, and who approves requests?'])
  s += b.svg
  by += b.h + 20
  s += circle(x + 44, by + 20, 18, C.brand) + icon('spark', x + 34, by + 10, 20, '#fff', 1.8)
  b = bubble(x + 76, by, cw - 76 - 40, 'ai', [
    'New employees get 20 paid vacation days per year, accrued monthly from the start date. Unused days (up to 5) carry over into the next calendar year.',
    'Requests are approved by the direct manager in the HR portal; absences longer than 10 working days also need HR sign-off.',
  ])
  s += b.svg
  by += b.h + 14
  s += text(x + 76, by + 14, 'SOURCES', { size: 11.5, weight: 700, fill: C.faint, spacing: 1 })
  const srcs = [['Employee Handbook, 4.2', 'Handbook.pdf'], ['Time-off policy v3', 'Policies / HR'], ['Manager guide: approvals', 'Wiki']]
  srcs.forEach(([a, c], i) => {
    const sx = x + 76 + i * ((cw - 76 - 40) / 3 + 0)
    const sw = (cw - 76 - 40) / 3 - 12
    s += rect(sx, by + 26, sw, 62, { fill: C.slateSoft, r: 10 }) + icon('doc', sx + 12, by + 40, 22, C.brand)
    s += text(sx + 44, by + 50, fit(a, 13, sw - 56, true), { size: 13, weight: 700, fill: C.ink }) + text(sx + 44, by + 70, c, { size: 12, fill: C.muted })
  })
  by += 110
  b = bubble(x + cw - 400 - 24, by, 400, 'user', ['Draft a short welcome email that explains this.'])
  s += b.svg
  by += b.h + 20
  s += circle(x + 44, by + 20, 18, C.brand) + icon('spark', x + 34, by + 10, 20, '#fff', 1.8)
  b = bubble(x + 76, by, cw - 76 - 40, 'ai', [
    'Subject: Welcome to Lighthouse, here is how time off works',
    'Hi Jordan, welcome aboard! You start with 20 vacation days a year, accrued monthly. Send requests to your manager through the HR portal. Anything over 10 working days also needs HR approval. Enjoy your first week!',
  ])
  s += b.svg
  // input
  s += rect(x + 24, y + 836 - 76, cw - 48, 52, { fill: C.white, stroke: C.line, r: 14, sw: 1.5 })
  s += text(x + 46, y + 836 - 44, 'Ask anything about your company…', { size: 15, fill: C.faint })
  s += rect(x + cw - 24 - 44, y + 836 - 72, 40, 44, { fill: C.brand, r: 12 }) + path(`M${x + cw - 56} ${y + 836 - 50} l12 -0 m-5 -6 l5 6 l-5 6`, { stroke: '#fff', sw: 2.2 })
  // right panel: popular
  const px = x + cw + 20
  const pw = w - cw - 20
  s += card(px, y, pw, 410)
  s += text(px + 22, y + 36, 'Most asked this week', { size: 16, weight: 700, fill: C.ink })
  ;[['Expense reimbursement limits', '48'], ['Remote work equipment budget', '37'], ['Parental leave policy', '31'], ['How to request a laptop', '26'], ['Travel booking process', '19']].forEach(([a, n], i) => {
    const ry = y + 62 + i * 68
    s += line(px + 22, ry, px + pw - 22, ry)
    s += text(px + 22, ry + 30, fit(a, 14, pw - 100, true), { size: 14, weight: 700, fill: C.ink }) + text(px + 22, ry + 50, n + ' questions', { size: 12.5, fill: C.muted })
    s += progress(px + pw - 82, ry + 25, 60, Number(n) / 50, C.brand, 6)
  })
  s += card(px, y + 430, pw, 406)
  s += text(px + 22, y + 466, 'Content health', { size: 16, weight: 700, fill: C.ink })
  ;[['Answered with sources', '94%', C.green], ['Needs a better article', '4%', C.amber], ['Unanswered', '2%', C.red]].forEach(([a, v, col], i) => {
    const ry = y + 496 + i * 70
    s += text(px + 22, ry + 20, a, { size: 13.5, fill: C.text }) + text(px + pw - 22, ry + 20, v, { size: 16, weight: 700, fill: C.ink, anchor: 'end' })
    s += progress(px + 22, ry + 32, pw - 44, parseInt(v) / 100, col, 9)
  })
  s += badge(px + 22, y + 740, '3 articles flagged outdated', 'amber', 13)
  s += button(px + 22, y + 770, 'Review articles', { primary: false, w: pw - 44 })
  return svgDoc(W, H, s)
}

// ── 8. Client portal ──────────────────────────────────────────────────────
function portal() {
  let s = rect(0, 0, W, H, { fill: C.bg })
  s += rect(0, 0, W, 76, { fill: C.white }) + line(0, 76, W, 76)
  s += rect(32, 20, 36, 36, { fill: '#0f766e', r: 9 }) + text(50, 45, 'B', { size: 20, weight: 700, fill: '#fff', anchor: 'middle' })
  s += text(80, 46, 'Bluebird Accounting', { size: 19, weight: 700, fill: C.ink })
  ;[['Overview', 1], ['Documents', 0], ['Invoices', 0], ['Messages', 0]].reduce((nx, [n, a]) => {
    const ww = tw(n, 15, true) + 32
    if (a) s += rect(nx, 22, ww, 34, { fill: '#ccfbf1', r: 17 })
    s += text(nx + ww / 2, 44, n, { size: 15, weight: 700, fill: a ? '#0f766e' : C.muted, anchor: 'middle' })
    return nx + ww + 6
  }, 420)
  s += text(W - 100, 44, 'Sarah Whitman', { size: 14.5, weight: 700, fill: C.ink, anchor: 'end' }) + avatar(W - 66, 38, 18, 'Sarah Whitman', 4)
  const x = 64, w = W - 128, y = 112
  s += text(x, y + 30, 'Welcome back, Sarah', { size: 32, weight: 700, fill: C.ink })
  s += text(x, y + 62, 'Whitman Design Studio LLC  ·  Your accountant: Michael Hughes', { size: 16, fill: C.muted })
  const kw = (w - 2 * 20) / 3
  s += kpi(x, y + 92, kw, 'Balance due', '$2,450.00', 'Due Oct 15', false, 112)
  s += kpi(x + kw + 20, y + 92, kw, 'Documents awaiting you', '3', '2 to sign', false, 112)
  s += kpi(x + 2 * (kw + 20), y + 92, kw, 'Q3 tax estimate', '$6,180.00', 'Filed', true, 112)
  const lw = (w - 20) * 0.58
  const ty = y + 232
  s += text(x, ty + 22, 'Invoices', { size: 20, weight: 700, fill: C.ink })
  s += table(x, ty + 42, lw, [{ h: 'Invoice', w: 110 }, { h: 'Description', w: 250 }, { h: 'Date', w: 110 }, { h: 'Amount', w: 110, align: 'right' }, { h: 'Status', w: 110 }], [
    [{ t: 'bold', v: 'INV-1048' }, 'Bookkeeping, October', 'Oct 1, 2026', { t: 'num', v: '$1,250.00', b: 1 }, { t: 'badge', v: 'Due', c: 'amber' }],
    [{ t: 'bold', v: 'INV-1047' }, 'Quarterly tax prep', 'Sep 28, 2026', { t: 'num', v: '$1,200.00', b: 1 }, { t: 'badge', v: 'Due', c: 'amber' }],
    [{ t: 'bold', v: 'INV-1039' }, 'Bookkeeping, September', 'Sep 1, 2026', { t: 'num', v: '$1,250.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }],
    [{ t: 'bold', v: 'INV-1031' }, 'Payroll setup', 'Aug 14, 2026', { t: 'num', v: '$480.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }],
    [{ t: 'bold', v: 'INV-1022' }, 'Bookkeeping, August', 'Aug 1, 2026', { t: 'num', v: '$1,250.00', b: 1 }, { t: 'badge', v: 'Paid', c: 'green' }],
  ], { rowH: 60 })
  s += button(x, ty + 42 + 42 + 5 * 60 + 22, 'Pay $2,450.00 now', { h: 46, size: 15 })
  const rx = x + lw + 20
  const rw = w - lw - 20
  s += text(rx, ty + 22, 'Documents', { size: 20, weight: 700, fill: C.ink })
  s += card(rx, ty + 42, rw, 342)
  ;[['2026 engagement letter.pdf', 'Needs your signature', 'amber'], ['Q3 expense summary.xlsx', 'Needs your signature', 'amber'], ['W-9 form.pdf', 'Review', 'blue'], ['Bank statement Sep.pdf', 'Uploaded by you', 'gray'], ['2025 tax return.pdf', 'Signed', 'green']].forEach(([a, b, c], i) => {
    const ry = ty + 42 + i * 68
    if (i) s += line(rx + 20, ry, rx + rw - 20, ry)
    s += rect(rx + 20, ry + 14, 40, 40, { fill: C.brandSoft, r: 10 }) + icon('doc', rx + 29, ry + 23, 22, C.brand)
    s += text(rx + 76, ry + 31, fit(a, 14.5, rw - 96, true), { size: 14.5, weight: 700, fill: C.ink })
    s += badge(rx + 76, ry + 52, b, c, 11.5)
  })
  s += button(rx, ty + 42 + 342 + 22, 'Upload a document', { primary: false, h: 46, size: 15, w: rw })
  // latest message
  const my = ty + 42 + 342 + 100
  s += card(x, my, w, 112)
  s += avatar(x + 48, my + 56, 22, 'Michael Hughes', 1) + text(x + 86, my + 42, 'Michael Hughes', { size: 15, weight: 700, fill: C.ink }) + text(x + 86 + 140, my + 42, 'Oct 6, 4:12 PM', { size: 12.5, fill: C.muted })
  s += text(x + 86, my + 70, 'Hi Sarah, your Q3 estimate is filed. Please sign the engagement letter when you have a minute, and send over', { size: 14.5, fill: C.text })
  s += text(x + 86, my + 92, 'the September bank statement so we can close the books.', { size: 14.5, fill: C.text })
  s += button(x + w - 24 - 100, my + 38, 'Reply', { primary: false, w: 100, h: 36 })
  return svgDoc(W, H, s)
}

// ── 9. Field service ──────────────────────────────────────────────────────
function field() {
  const sh = shell({
    workspace: 'ClearFlow HVAC', user: 'Dana Whitaker', role: 'Dispatcher',
    nav: NAV([['Schedule', 'cal'], ['Jobs', 'wrench', '38'], ['Customers', 'users', '924'], ['Technicians', 'users', '9'], ['Invoices', 'money'], ['Settings', 'cog']]),
    active: 0, title: 'Dispatch board', crumbs: 'Thursday, October 8, 2026  ·  26 jobs  ·  9 technicians',
    actions: [{ label: 'Optimize routes', primary: false }, { label: '+ New job', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const bw = w - 380
  const techs = ['Tyler Brooks', 'Maria Lopez', 'Kevin O’Neil', 'Aisha Johnson', 'Ryan Patel']
  const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM']
  const lw = 180
  const hw = (bw - lw) / hours.length
  s += card(x, y, bw, 700)
  s += rect(x, y, bw, 48, { fill: '#f8fafc' }) + line(x, y + 48, x + bw, y + 48)
  hours.forEach((h, i) => {
    s += text(x + lw + i * hw + 10, y + 30, h, { size: 12.5, weight: 700, fill: C.muted })
    s += line(x + lw + i * hw, y + 48, x + lw + i * hw, y + 700, { stroke: '#eef2f7' })
  })
  const rh = 130
  const jobs = [
    [0, 0, 1.6, 'AC repair', 'Hartley home', C.brand],
    [0, 1.7, 1.5, 'Filter swap', 'Lakeside Dental', C.green],
    [0, 3.4, 2.2, 'Furnace install', 'Greene home', C.violet],
    [1, 0.3, 2.0, 'Duct inspection', 'Orchard Lofts', C.green],
    [1, 2.4, 1.6, 'Thermostat', 'Rowan Bakery', C.brand],
    [1, 4.2, 2.0, 'AC tune-up', 'Delgado home', C.brand],
    [2, 0, 1.5, 'No heat', 'Pine St. Apts', C.red],
    [2, 1.6, 2.6, 'Rooftop unit service', 'Crest Office Park', C.violet],
    [2, 4.4, 2.4, 'Boiler service', 'St. Mark’s School', C.amber],
    [3, 1.0, 1.9, 'Heat pump quote', 'Nguyen home', C.green],
    [3, 3.0, 3.0, 'Mini-split install', 'Kowalski home', C.violet],
    [4, 0, 2.0, 'Leak diagnosis', 'Maple Court HOA', C.brand],
    [4, 2.2, 1.9, 'Annual service', 'Foster Law', C.green],
    [4, 4.3, 2.4, 'Compressor swap', 'Wilson home', C.red],
  ]
  const nx = x + lw + 2.3 * hw
  s += line(nx, y + 48, nx, y + 700, { stroke: C.red, sw: 2 })
  s += circle(nx, y + 48, 5, C.red)
  techs.forEach((t, i) => {
    const ry = y + 48 + i * rh
    if (i) s += line(x, ry, x + bw, ry, { stroke: '#eef2f7' })
    s += avatar(x + 34, ry + 45, 19, t, i) + text(x + 62, ry + 42, t.split(' ')[0], { size: 14.5, weight: 700, fill: C.ink }) + text(x + 62, ry + 62, ['Van 12', 'Van 07', 'Van 03', 'Van 09', 'Van 05'][i], { size: 12.5, fill: C.muted })
  })
  jobs.forEach(([r, st, len, a, b, col]) => {
    const jx = x + lw + st * hw + 3
    const jy = y + 48 + r * rh + 14
    const jw = len * hw - 6
    s += rect(jx, jy, jw, 102, { fill: '#fff', r: 10 }) + rect(jx, jy, jw, 102, { fill: col, r: 10, opacity: 0.14 }) + rect(jx, jy, 5, 102, { fill: col, r: 2 })
    s += text(jx + 16, jy + 30, fit(a, 14, jw - 24, true), { size: 14, weight: 700, fill: C.ink })
    s += text(jx + 16, jy + 52, fit(b, 12.5, jw - 24), { size: 12.5, fill: C.muted })
  })
  // job detail
  const px = x + bw + 20
  const pw = w - bw - 20
  s += card(px, y, pw, 700, { shadow: true })
  s += badge(px + 24, y + 38, 'In progress', 'blue', 13)
  s += text(px + 24, y + 82, 'Rooftop unit service', { size: 21, weight: 700, fill: C.ink })
  s += text(px + 24, y + 106, 'Job #4871  ·  Crest Office Park', { size: 13.5, fill: C.muted })
  s += line(px + 24, y + 128, px + pw - 24, y + 128)
  ;[['Customer', 'Crest Property Management'], ['Address', '1200 Crest Dr, Suite B, Austin, TX'], ['Technician', 'Maria Lopez, Van 07'], ['Window', '9:36 AM - 12:00 PM']].forEach(([a, b], i) => {
    s += text(px + 24, y + 160 + i * 52, a.toUpperCase(), { size: 11, weight: 700, fill: C.faint, spacing: 0.8 }) + text(px + 24, y + 182 + i * 52, fit(b, 14.5, pw - 48, true), { size: 14.5, weight: 700, fill: C.ink })
  })
  s += text(px + 24, y + 392, 'CHECKLIST', { size: 11, weight: 700, fill: C.faint, spacing: 0.8 })
  ;[['Inspect belts and bearings', 1], ['Replace air filters (x4)', 1], ['Check refrigerant pressure', 0], ['Photo of nameplate', 0]].forEach(([a, d], i) => {
    const cy = y + 416 + i * 40
    s += rect(px + 24, cy, 22, 22, d ? { fill: C.green, r: 6 } : { fill: C.white, stroke: C.faint, r: 6, sw: 1.5 })
    if (d) s += path(`M${px + 29} ${cy + 11} l4 4 l8 -8`, { stroke: '#fff', sw: 2.2 })
    s += text(px + 58, cy + 17, a, { size: 14, fill: d ? C.muted : C.text })
  })
  s += line(px + 24, y + 590, px + pw - 24, y + 590)
  s += text(px + 24, y + 626, 'Estimate', { size: 14, fill: C.muted }) + text(px + pw - 24, y + 628, '$486.00', { size: 22, weight: 700, fill: C.ink, anchor: 'end' })
  s += button(px + 24, y + 648, 'Complete & invoice', { w: pw - 48, h: 38 })
  return svgDoc(W, H, s)
}

// ── 10. Budgeting ─────────────────────────────────────────────────────────
function budgeting() {
  const sh = shell({
    workspace: 'Summit Ventures', user: 'Laura Bennett', role: 'Finance Lead',
    nav: NAV([['Budget vs actual', 'chart'], ['Departments', 'grid', '8'], ['Expenses', 'money', '1,204'], ['Forecasts', 'cal'], ['Approvals', 'doc', '5'], ['Settings', 'cog']]),
    active: 0, title: 'Budget vs actual', crumbs: 'FY 2026  ·  Year to date through September',
    actions: [{ label: 'Export', primary: false }, { label: '+ Add budget line', primary: true }],
  })
  let s = sh.svg
  const { x, y, w } = sh
  const kw = (w - 3 * 20) / 4
  s += kpi(x, y, kw, 'Annual budget', '$4,820,000', '')
  s += kpi(x + (kw + 20), y, kw, 'Spent YTD', '$3,412,860', '70.8%')
  s += kpi(x + 2 * (kw + 20), y, kw, 'Remaining', '$1,407,140', '')
  s += kpi(x + 3 * (kw + 20), y, kw, 'Forecast variance', '-$62,400', 'Under budget', true)
  // chart
  const cy = y + 132
  const cw = w * 0.56
  s += card(x, cy, cw, 400)
  s += text(x + 24, cy + 36, 'Spend by department ($K)', { size: 16, weight: 700, fill: C.ink })
  s += rect(x + cw - 190, cy + 22, 12, 12, { fill: '#cbd5e1', r: 3 }) + text(x + cw - 172, cy + 33, 'Budget', { size: 12.5, fill: C.muted })
  s += rect(x + cw - 104, cy + 22, 12, 12, { fill: C.brand, r: 3 }) + text(x + cw - 86, cy + 33, 'Actual', { size: 12.5, fill: C.muted })
  const depts = [['Engineering', 1400, 1010], ['Sales', 980, 842], ['Marketing', 720, 706], ['Operations', 640, 512], ['Support', 480, 301], ['G&A', 380, 305], ['HR', 220, 168]]
  const baseY = cy + 350, topY = cy + 70, max = 1500
  for (let g = 0; g <= 3; g++) {
    const gy = baseY - (g * (baseY - topY)) / 3
    s += line(x + 70, gy, x + cw - 24, gy, { stroke: '#eef2f7' }) + text(x + 58, gy + 4, String(g * 500), { size: 11.5, fill: C.faint, anchor: 'end' })
  }
  const gw = (cw - 94) / depts.length
  depts.forEach(([n, b, a], i) => {
    const gx = x + 70 + i * gw + gw / 2
    const hb = ((b / max) * (baseY - topY)), ha = ((a / max) * (baseY - topY))
    const over = a > b * 0.98
    s += rect(gx - 28, baseY - hb, 26, hb, { fill: '#cbd5e1', r: 5 }) + rect(gx + 2, baseY - ha, 26, ha, { fill: over ? C.amber : C.brand, r: 5 })
    s += text(gx, baseY + 22, n, { size: 12.5, fill: C.muted, anchor: 'middle' })
  })
  // right: approvals
  const rx = x + cw + 20
  const rw = w - cw - 20
  s += card(rx, cy, rw, 400)
  s += text(rx + 24, cy + 36, 'Pending approvals', { size: 16, weight: 700, fill: C.ink })
  ;[['AWS reserved instances', 'Engineering', '$48,000'], ['Trade show booth, Las Vegas', 'Marketing', '$26,500'], ['Annual security audit', 'G&A', '$18,200'], ['Sales kickoff venue', 'Sales', '$14,750'], ['Ergonomic chairs (12)', 'HR', '$8,940']].forEach(([a, b, c], i) => {
    const ry = cy + 56 + i * 66
    s += line(rx + 24, ry, rx + rw - 24, ry)
    s += text(rx + 24, ry + 28, fit(a, 14, rw - 160, true), { size: 14, weight: 700, fill: C.ink }) + text(rx + 24, ry + 48, b, { size: 12.5, fill: C.muted })
    s += text(rx + rw - 24, ry + 38, c, { size: 15, weight: 700, fill: C.ink, anchor: 'end' })
  })
  // table
  s += table(x, cy + 420, w, [
    { h: 'Department', w: 200 }, { h: 'Owner', w: 200 }, { h: 'Budget', w: 120, align: 'right' }, { h: 'Actual', w: 120, align: 'right' }, { h: 'Variance', w: 120, align: 'right' }, { h: 'Used', w: 260 },
  ], [
    [{ t: 'bold', v: 'Engineering' }, { t: 'name', v: 'Henry Walsh' }, { t: 'num', v: '$1,400,000' }, { t: 'num', v: '$1,010,420', b: 1 }, { t: 'num', v: '+$389,580', f: C.green }, { t: 'prog', v: 0.72 }],
    [{ t: 'bold', v: 'Marketing' }, { t: 'name', v: 'Zoe Hamilton' }, { t: 'num', v: '$720,000' }, { t: 'num', v: '$706,150', b: 1 }, { t: 'num', v: '+$13,850', f: C.green }, { t: 'prog', v: 0.98, c: C.amber }],
    [{ t: 'bold', v: 'Sales' }, { t: 'name', v: 'Ian Fletcher' }, { t: 'num', v: '$980,000' }, { t: 'num', v: '$842,300', b: 1 }, { t: 'num', v: '+$137,700', f: C.green }, { t: 'prog', v: 0.86 }],
    [{ t: 'bold', v: 'Operations' }, { t: 'name', v: 'Grace Morgan' }, { t: 'num', v: '$640,000' }, { t: 'num', v: '$512,780', b: 1 }, { t: 'num', v: '+$127,220', f: C.green }, { t: 'prog', v: 0.8 }],
    [{ t: 'bold', v: 'Support' }, { t: 'name', v: 'Tom Hendricks' }, { t: 'num', v: '$480,000' }, { t: 'num', v: '$301,940', b: 1 }, { t: 'num', v: '+$178,060', f: C.green }, { t: 'prog', v: 0.63 }],
  ], { rowH: 52 })
  return svgDoc(W, H, s)
}

export const useCaseScenes = {
  crm, inventory, orders, 'project-tracking': projectTracking, 'hr-onboarding': hr,
  'asset-management': assets, 'ai-knowledge-base': aiKb, 'client-portal': portal, 'field-service': field, budgeting,
}
