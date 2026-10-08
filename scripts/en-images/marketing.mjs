/** Hero, Excel-to-app, AI/MCP illustrations and Open Graph cards for the English site. */
import {
  C, rect, text, line, circle, path, svgDoc, table, kpi, card, badge, badgeW, rel, progress, button,
  avatar, icon, fit, wrap, tw, bubble, toolCall, logo, logoIcon,
} from './lib.mjs'

function windowChrome(x, y, w, h, url) {
  let s = rect(x, y, w, h, { fill: C.bg, r: 16, stroke: C.line, extra: 'filter="url(#shl)"' })
  s += `<clipPath id="wc${x}_${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/></clipPath><g clip-path="url(#wc${x}_${y})">`
  s += rect(x, y, w, 48, { fill: C.white }) + line(x, y + 48, x + w, y + 48)
  s += circle(x + 24, y + 24, 6.5, '#f87171') + circle(x + 44, y + 24, 6.5, '#fbbf24') + circle(x + 64, y + 24, 6.5, '#34d399')
  s += rect(x + w / 2 - 190, y + 12, 380, 26, { fill: C.slateSoft, r: 13 }) + text(x + w / 2, y + 30, url, { size: 12.5, fill: C.muted, anchor: 'middle' })
  return { head: s, end: '</g>', cx: x, cy: y + 48, cw: w, ch: h - 48 }
}

// ── Hero ──────────────────────────────────────────────────────────────────
export function hero() {
  const W = 1600, H = 1000
  let s = rect(0, 0, W, H, { fill: 'url(#gsoft)' })
  s += circle(1380, 120, 260, '#307fe2', 'opacity="0.10"') + circle(160, 900, 300, '#7c3aed', 'opacity="0.08"')
  const wx = 150, wy = 110, ww = 1000, wh = 740
  const win = windowChrome(wx, wy, ww, wh, 'app.ideav.pro/acme/orders')
  s += win.head
  // mini sidebar
  s += rect(wx, wy + 48, 190, wh - 48, { fill: C.white }) + line(wx + 190, wy + 48, wx + 190, wy + wh)
  s += logo(wx + 22, wy + 70, 24)
  ;[['Customers', 'users'], ['Orders', 'cart'], ['Products', 'box'], ['Reports', 'chart'], ['AI assistant', 'spark']].forEach(([n, ic], i) => {
    const ny = wy + 130 + i * 44
    const act = i === 1
    if (act) s += rect(wx + 12, ny, 166, 38, { fill: C.brandSoft, r: 9 })
    s += icon(ic, wx + 24, ny + 9, 20, act ? C.brand : C.muted) + text(wx + 54, ny + 24.5, n, { size: 14.5, weight: act ? 700 : 400, fill: act ? C.brandDark : C.text })
  })
  const cx = wx + 222
  const cw = ww - 222 - 100
  s += text(cx, wy + 96, 'Orders', { size: 24, weight: 700, fill: C.ink }) + button(cx + cw - 118, wy + 70, '+ New order', { w: 118, h: 36, size: 13.5 })
  const kw = (cw - 40) / 3
  s += kpi(cx, wy + 120, kw, 'Revenue (30 days)', '$128,430', '', true, 96)
  s += kpi(cx + kw + 20, wy + 120, kw, 'Open orders', '312', '', true, 96)
  s += kpi(cx + 2 * (kw + 20), wy + 120, kw, 'Repeat customers', '41%', '+3 pts', true, 96)
  s += table(cx, wy + 240, cw, [{ h: 'Order', w: 110 }, { h: 'Customer', w: 200 }, { h: 'Product', w: 180 }, { h: 'Total', w: 100, align: 'right' }, { h: 'Status', w: 120 }], [
    [{ t: 'bold', v: '#10482' }, { t: 'rel', v: 'Hannah Whitfield' }, { t: 'rel', v: 'Pour-over set' }, { t: 'num', v: '$214.80', b: 1 }, { t: 'badge', v: 'Packing', c: 'blue' }],
    [{ t: 'bold', v: '#10481' }, { t: 'rel', v: 'Oliver Grant' }, { t: 'rel', v: 'Linen apron' }, { t: 'num', v: '$89.00', b: 1 }, { t: 'badge', v: 'Shipped', c: 'violet' }],
    [{ t: 'bold', v: '#10480' }, { t: 'rel', v: 'Maple & Oak' }, { t: 'rel', v: 'Cold brew 1 kg' }, { t: 'num', v: '$1,962.40', b: 1 }, { t: 'badge', v: 'Pending', c: 'amber' }],
    [{ t: 'bold', v: '#10479' }, { t: 'rel', v: 'Isabella Moreno' }, { t: 'rel', v: 'Pour-over set' }, { t: 'num', v: '$142.50', b: 1 }, { t: 'badge', v: 'Delivered', c: 'green' }],
    [{ t: 'bold', v: '#10478' }, { t: 'rel', v: 'Thomas Eriksen' }, { t: 'rel', v: 'Linen apron' }, { t: 'num', v: '$476.25', b: 1 }, { t: 'badge', v: 'Delivered', c: 'green' }],
    [{ t: 'bold', v: '#10477' }, { t: 'rel', v: 'Lakeview Cafe' }, { t: 'rel', v: 'Cold brew 1 kg' }, { t: 'num', v: '$3,310.00', b: 1 }, { t: 'badge', v: 'Packing', c: 'blue' }],
  ], { rowH: 56, highlight: 0 })
  s += win.end

  // floating AI card (right)
  const ax = 1100, ay = 190, aw = 440, ah = 450
  s += rect(ax, ay, aw, ah, { fill: C.white, r: 18, stroke: C.line, extra: 'filter="url(#shl)"' })
  s += circle(ax + 36, ay + 38, 18, C.brand) + icon('spark', ax + 26, ay + 28, 20, '#fff')
  s += text(ax + 64, ay + 34, 'Integram AI', { size: 16, weight: 700, fill: C.ink }) + text(ax + 64, ay + 54, 'Connected via MCP', { size: 12.5, fill: C.green, weight: 700 })
  s += line(ax, ay + 76, ax + aw, ay + 76)
  let b = bubble(ax + 40, ay + 94, aw - 64, 'user', ['Add a Gold tier for customers with 5+ orders and email them a 10% code.'], { size: 14.5 })
  s += b.svg
  let t1 = toolCall(ax + 24, ay + 94 + b.h + 14, aw - 48, 'integram_create_field', 'table: Customers, name: Tier')
  s += t1.svg
  let t2 = toolCall(ax + 24, ay + 94 + b.h + 14 + 62, aw - 48, 'integram_update_records', '38 customers set to Gold')
  s += t2.svg
  b = bubble(ax + 24, ay + 94 + b.h + 14 + 124, aw - 64, 'ai', ['Done. 38 customers are now Gold and the campaign is drafted in Outbox.'], { size: 14.5 })
  s += b.svg

  // floating form card (bottom-left)
  const fx = 70, fy = 640, fw = 440, fh = 300
  s += rect(fx, fy, fw, fh, { fill: C.white, r: 18, stroke: C.line, extra: 'filter="url(#shl)"' })
  s += text(fx + 26, fy + 44, 'New customer', { size: 18, weight: 700, fill: C.ink })
  ;[['Full name', 'Hannah Whitfield'], ['Company', 'Whitfield Design Co.'], ['Account manager', 'Emma Carter']].forEach(([l, v], i) => {
    const ry = fy + 70 + i * 66
    s += text(fx + 26, ry + 12, l, { size: 12.5, weight: 700, fill: C.muted })
    s += rect(fx + 26, ry + 20, fw - 52, 36, { fill: C.white, stroke: i === 1 ? C.brand : C.line, sw: i === 1 ? 2 : 1, r: 9 }) + text(fx + 40, ry + 44, v, { size: 14.5, fill: C.ink })
  })
  s += button(fx + fw - 26 - 80, fy + 20, 'Save', { w: 80, h: 34, size: 13.5 })

  // floating chart card (bottom-right)
  const gx = 1000, gy = 760, gw = 480, gh = 190
  s += rect(gx, gy, gw, gh, { fill: C.white, r: 18, stroke: C.line, extra: 'filter="url(#shl)"' })
  s += text(gx + 26, gy + 38, 'Weekly revenue', { size: 16, weight: 700, fill: C.ink }) + text(gx + gw - 26, gy + 38, '$31,820', { size: 16, weight: 700, fill: C.green, anchor: 'end' })
  const bars = [0.4, 0.55, 0.45, 0.7, 0.62, 0.85, 0.78, 0.95]
  bars.forEach((v, i) => {
    const bh = v * 100
    s += rect(gx + 30 + i * 52, gy + 160 - bh, 34, bh, { fill: i === 7 ? C.brand : '#bfdbfe', r: 6 })
  })
  return svgDoc(W, H, s)
}

// ── Excel to app ──────────────────────────────────────────────────────────
export function excelToApp() {
  const W = 1536, H = 1024
  let s = rect(0, 0, W, H, { fill: 'url(#gsoft)' })
  // Spreadsheet window
  const ex = 50, ey = 150, ew = 600, eh = 700
  s += rect(ex, ey, ew, eh, { fill: C.white, r: 14, stroke: '#cbd5e1', extra: 'filter="url(#sh)"' })
  s += `<clipPath id="exc"><rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" rx="14"/></clipPath><g clip-path="url(#exc)">`
  s += rect(ex, ey, ew, 52, { fill: '#107c41' }) + text(ex + 22, ey + 33, 'clients_2026.xlsx', { size: 16, weight: 700, fill: '#fff' })
  s += rect(ex, ey + 52, ew, 34, { fill: '#f3f4f6' }) + line(ex, ey + 86, ex + ew, ey + 86, { stroke: '#d1d5db' })
  const cols = [['A', 'Client', 150], ['B', 'Project', 140], ['C', 'Manager', 100], ['D', 'Amount', 90], ['E', 'Status', 84]]
  let cx = ex + 36
  const rows = [
    ['Acme Retail', 'Website redesign', 'Liam F.', '$61,000', 'Active'],
    ['Northwind Co.', 'CRM rollout', 'Ava M.', '$24,500', 'Active'],
    ['Bluebird LLC', 'Bookkeeping', 'Noah B.', '$15,000', 'Paid'],
    ['Orchard Lofts', 'HVAC service', 'Mia S.', '$8,200', 'Active'],
    ['Pinecrest Realty', 'Brand refresh', 'Liam F.', '$21,400', 'Paid'],
    ['Summit Outdoor', 'E-commerce', 'Ava M.', '$64,000', 'Pending'],
    ['Harbor & Finch', 'Legal portal', 'Noah B.', '$18,500', 'Active'],
    ['Lumen Analytics', 'Dashboards', 'Mia S.', '$31,200', 'Pending'],
    ['Cobalt Energy', 'Data cleanup', 'Liam F.', '$38,000', 'Active'],
    ['Kestrel Aviation', 'Fleet tracker', 'Ava M.', '$54,000', 'Paid'],
    ['Redwood Software', 'API design', 'Noah B.', '$46,500', 'Active'],
    ['Greenfield Foods', 'Order system', 'Mia S.', '$27,900', 'Pending'],
  ]
  cols.forEach(([l, n, w], i) => {
    s += text(cx + w / 2, ey + 74, l, { size: 12.5, fill: C.muted, anchor: 'middle' })
    s += line(cx - 0, ey + 52, cx, ey + eh, { stroke: '#e5e7eb' })
    cx += w
  })
  s += rect(ex, ey + 86, 36, eh, { fill: '#f3f4f6' })
  s += rect(ex + 36, ey + 86, ew, 38, { fill: '#e8f5ee' })
  cx = ex + 36
  cols.forEach(([l, n, w]) => {
    s += text(cx + 10, ey + 111, n, { size: 14, weight: 700, fill: '#0f5132' })
    cx += w
  })
  rows.forEach((r, i) => {
    const ry = ey + 124 + i * 40
    s += line(ex, ry, ex + ew, ry, { stroke: '#e5e7eb' })
    s += text(ex + 18, ry + 26, String(i + 2), { size: 12, fill: C.muted, anchor: 'middle' })
    cx = ex + 36
    cols.forEach(([, , w], j) => {
      s += text(j === 3 ? cx + w - 10 : cx + 10, ry + 26, fit(r[j], 14, w - 20), { size: 14, fill: C.text, anchor: j === 3 ? 'end' : 'start' })
      cx += w
    })
  })
  s += '</g>'
  s += text(ex, ey - 24, 'Your spreadsheet', { size: 22, weight: 700, fill: C.ink })

  // Arrow / generation
  const mx = 770
  s += rect(mx - 66, 440, 132, 132, { fill: 'url(#gbrand)', r: 30, extra: 'filter="url(#sh)"' })
  s += logoIcon(mx - 40, 486, 40, '#fff')
  s += path('M700 600 h140 m-24 -22 l24 22 l-24 22', { stroke: C.brand, sw: 5 })
  s += text(mx, 664, 'Upload', { size: 17, weight: 700, fill: C.brandDark, anchor: 'middle' }) + text(mx, 688, 'Get an app', { size: 14, fill: C.muted, anchor: 'middle' })

  // App window
  const ax = 880, ay = 110, aw = 620, ah = 790
  const win = windowChrome(ax, ay, aw, ah, 'app.ideav.pro/clients')
  s += win.head
  s += text(ax + 28, ay + 92, 'Clients', { size: 24, weight: 700, fill: C.ink }) + button(ax + aw - 28 - 112, ay + 66, '+ Add client', { w: 112, h: 36, size: 13.5 })
  const kw = (aw - 56 - 20) / 2
  s += kpi(ax + 28, ay + 116, kw, 'Active projects', '7', '', true, 92) + kpi(ax + 28 + kw + 20, ay + 116, kw, 'Total value', '$410,200', '', true, 92)
  s += table(ax + 28, ay + 230, aw - 56, [{ h: 'Client', w: 170 }, { h: 'Manager', w: 175 }, { h: 'Amount', w: 100, align: 'right' }, { h: 'Status', w: 105 }], [
    [{ t: 'bold', v: 'Acme Retail' }, { t: 'rel', v: 'Liam Foster' }, { t: 'num', v: '$61,000', b: 1 }, { t: 'badge', v: 'Active', c: 'green' }],
    [{ t: 'bold', v: 'Northwind Co.' }, { t: 'rel', v: 'Ava Mitchell' }, { t: 'num', v: '$24,500', b: 1 }, { t: 'badge', v: 'Active', c: 'green' }],
    [{ t: 'bold', v: 'Bluebird LLC' }, { t: 'rel', v: 'Noah Bennett' }, { t: 'num', v: '$15,000', b: 1 }, { t: 'badge', v: 'Paid', c: 'blue' }],
    [{ t: 'bold', v: 'Orchard Lofts' }, { t: 'rel', v: 'Mia Sullivan' }, { t: 'num', v: '$8,200', b: 1 }, { t: 'badge', v: 'Active', c: 'green' }],
    [{ t: 'bold', v: 'Summit Outdoor' }, { t: 'rel', v: 'Ava Mitchell' }, { t: 'num', v: '$64,000', b: 1 }, { t: 'badge', v: 'Pending', c: 'amber' }],
  ], { rowH: 54 })
  // form snippet
  s += card(ax + 28, ay + 572, aw - 56, 150)
  s += text(ax + 52, ay + 606, 'Edit client', { size: 16, weight: 700, fill: C.ink })
  ;[['Client', 'Acme Retail'], ['Status', 'Active']].forEach(([l, v], i) => {
    const fx = ax + 52 + i * ((aw - 104) / 2)
    const fw = (aw - 104) / 2 - 16
    s += text(fx, ay + 636, l, { size: 12, weight: 700, fill: C.muted }) + rect(fx, ay + 646, fw, 36, { fill: C.white, stroke: C.line, r: 9 }) + text(fx + 14, ay + 670, v, { size: 14, fill: C.ink })
  })
  s += win.end
  s += text(ax, ey - 24 + 10, '', {})
  s += text(ax + aw / 2, 952, 'A working app: forms, relations, roles and an API', { size: 20, weight: 700, fill: C.ink, anchor: 'middle' })
  s += text(ex + ew / 2, 952, '', {})
  return svgDoc(W, H, s)
}

// ── AI + MCP ──────────────────────────────────────────────────────────────
export function aiMcp() {
  const W = 1536, H = 1024
  let s = rect(0, 0, W, H, { fill: 'url(#gdark)' })
  s += circle(1300, 140, 280, '#307fe2', 'opacity="0.12"') + circle(200, 900, 260, '#7c3aed', 'opacity="0.12"')
  // chat panel
  const px = 56, py = 70, pw = 700, ph = 884
  s += rect(px, py, pw, ph, { fill: C.white, r: 22, extra: 'filter="url(#shl)"' })
  s += circle(px + 44, py + 46, 20, '#d97757') + text(px + 44, py + 53, 'C', { size: 20, weight: 700, fill: '#fff', anchor: 'middle' })
  s += text(px + 76, py + 42, 'AI assistant', { size: 18, weight: 700, fill: C.ink }) + text(px + 76, py + 64, 'Any MCP client  ·  connected to Integram', { size: 13, fill: C.green, weight: 700 })
  s += line(px, py + 92, px + pw, py + 92)
  let y = py + 114
  let b = bubble(px + 150, y, pw - 150 - 28, 'user', ['Create a Projects table with client, owner, budget and status. Then add three sample projects.'], { size: 15.5 })
  s += b.svg; y += b.h + 18
  const calls = [
    ['integram_create_table', 'name: "Projects"'],
    ['integram_add_field', 'client → Clients (relation)'],
    ['integram_add_field', 'budget (number, USD)'],
    ['integram_create_records', 'table: Projects, count: 3'],
  ]
  calls.forEach(([n, a]) => {
    const t = toolCall(px + 28, y, pw - 56, n, a)
    s += t.svg; y += t.h + 10
  })
  y += 10
  b = bubble(px + 28, y, pw - 28 - 80, 'ai', ['Done. The Projects table is live with a relation to Clients and three sample records. I can also expose it through the REST API or build a dashboard on top.'], { size: 15.5 })
  s += b.svg; y += b.h + 22
  s += table(px + 28, y, pw - 56, [{ h: 'Project', w: 200 }, { h: 'Client', w: 180 }, { h: 'Budget', w: 100, align: 'right' }], [
    [{ t: 'bold', v: 'Website redesign' }, { t: 'rel', v: 'Acme Retail' }, { t: 'num', v: '$61,000', b: 1 }],
    [{ t: 'bold', v: 'CRM rollout' }, { t: 'rel', v: 'Northwind Co.' }, { t: 'num', v: '$24,500', b: 1 }],
    [{ t: 'bold', v: 'Fleet tracker' }, { t: 'rel', v: 'Kestrel Aviation' }, { t: 'num', v: '$54,000', b: 1 }],
  ], { rowH: 50, headH: 38 })
  s += rect(px + 28, py + ph - 76, pw - 56, 52, { fill: C.white, stroke: C.line, r: 14, sw: 1.5 }) + text(px + 50, py + ph - 44, 'Message your assistant…', { size: 15, fill: C.faint })

  // right: MCP panel
  const rx = 800, rw = 680
  s += text(rx, 100, 'Model Context Protocol', { size: 15, weight: 700, fill: '#7dd3fc', spacing: 1.5 })
  s += text(rx, 160, 'Your data, in your AI’s hands', { size: 44, weight: 700, fill: '#fff' })
  s += text(rx, 202, 'Every table and action in Integram is a tool your AI can call.', { size: 18, fill: '#94a3b8' })
  s += rect(rx, 250, rw, 500, { fill: '#0b1224', r: 18, stroke: '#1e2b4a' })
  s += circle(rx + 26, 280, 6, '#f87171') + circle(rx + 46, 280, 6, '#fbbf24') + circle(rx + 66, 280, 6, '#34d399')
  s += text(rx + 100, 285, 'tools/call', { size: 13, fill: '#64748b' })
  const code = [
    ['{', '#e2e8f0'],
    ['  "method": "tools/call",', '#e2e8f0'],
    ['  "params": {', '#e2e8f0'],
    ['    "name": "integram_create_records",', '#7dd3fc'],
    ['    "arguments": {', '#e2e8f0'],
    ['      "table": "Projects",', '#a5f3b8'],
    ['      "records": [', '#e2e8f0'],
    ['        { "name": "Website redesign",', '#a5f3b8'],
    ['          "client": "Acme Retail",', '#a5f3b8'],
    ['          "budget": 61000 },', '#fcd34d'],
    ['        ...', '#64748b'],
    ['      ]', '#e2e8f0'],
    ['    }', '#e2e8f0'],
    ['  }', '#e2e8f0'],
    ['}', '#e2e8f0'],
  ]
  code.forEach(([l, col], i) => {
    s += `<text x="${rx + 28}" y="${326 + i * 25}" font-family="Inter" font-size="15" fill="${col}" xml:space="preserve">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`
  })
  s += rect(rx + 28, 704, 130, 32, { fill: '#064e3b', r: 8 }) + text(rx + 93, 725, '3 created', { size: 14, weight: 700, fill: '#6ee7b7', anchor: 'middle' })
  s += text(rx + 174, 725, 'in 214 ms', { size: 14, fill: '#64748b' })
  // features
  const feats = [['MCP server', 'Works with Claude, Cursor and any MCP client'], ['REST API', 'Every table, record and report over HTTPS'], ['API tokens', 'Scoped per user and per workspace']]
  feats.forEach(([a, bb], i) => {
    const fx = rx + i * (rw / 3 + 0)
    s += rect(fx, 780, rw / 3 - 14, 140, { fill: '#ffffff', r: 16, opacity: 0.07 })
    s += text(fx + 20, 820, a, { size: 17, weight: 700, fill: '#fff' })
    wrap(bb, 14, rw / 3 - 14 - 40).forEach((l, k) => { s += text(fx + 20, 848 + k * 21, l, { size: 14, fill: '#94a3b8' }) })
  })
  s += logo(rx, 950, 30, { fill: '#fff', icon: '#4b95f0' })
  return svgDoc(W, H, s)
}

// ── Open Graph cards (1200x630) ───────────────────────────────────────────
export const OG = {
  home: ['No-code platform', 'No-code database for your business', 'Tables, relations, forms and reports. Built with AI, ready in minutes.', 'm1'],
  pricing: ['Pricing', 'Simple plans that grow with you', 'Start free. Pay only when your team and data grow.', 'm2'],
  'excel-to-app': ['Excel to app', 'Turn your spreadsheet into a working app', 'Upload an .xlsx file and get forms, relations, roles and an API.', 'm3'],
  ai: ['AI and API', 'Let your AI agents work with your data', 'MCP server and REST API for every table in your workspace.', 'm4'],
  'compare-airtable': ['Compare', 'Integram vs Airtable', 'Unlimited records, built-in AI access and predictable pricing.', 'm1'],
  'compare-smartsheet': ['Compare', 'Integram vs Smartsheet', 'Relational data instead of grids, at a fraction of the cost.', 'm1'],
  'compare-notion': ['Compare', 'Integram vs Notion', 'A real relational database when docs are not enough.', 'm1'],
  'use-cases': ['Use cases', 'Business apps you can build in an afternoon', 'CRM, inventory, orders, projects, HR, assets and more.', 'm2'],
  'uc-crm': ['Use case', 'CRM for small teams', 'Track contacts, deals and follow-ups in one place.', 'm1'],
  'uc-inventory': ['Use case', 'Inventory management', 'Stock levels, warehouses and reorder alerts.', 'm1'],
  'uc-orders': ['Use case', 'Order management', 'From new order to delivered, without spreadsheets.', 'm1'],
  'uc-project-tracking': ['Use case', 'Project tracking', 'Timelines, tasks and budgets for every project.', 'm1'],
  'uc-hr-onboarding': ['Use case', 'HR onboarding', 'Checklists that make every new hire productive faster.', 'm1'],
  'uc-asset-management': ['Use case', 'Asset management', 'Know who has what, where it is and when it expires.', 'm1'],
  'uc-ai-knowledge-base': ['Use case', 'AI knowledge base', 'Ask questions, get answers with sources.', 'm4'],
  'uc-client-portal': ['Use case', 'Client portal', 'Invoices, documents and updates in one secure place.', 'm1'],
  'uc-field-service': ['Use case', 'Field service management', 'Dispatch jobs, track technicians, invoice on site.', 'm1'],
  'uc-budgeting': ['Use case', 'Budgeting and expense tracking', 'Budget vs actual by department, always up to date.', 'm1'],
  'knowledge-base': ['Knowledge base', 'Guides, tutorials and best practices', 'Learn how to model data and automate your business.', 'm2'],
  contact: ['Contact', 'Talk to the Integram team', 'Book a demo or ask us anything.', 'm2'],
  legal: ['Legal', 'Terms, privacy and cookies', 'How we handle your data and your account.', 'm2'],
}

export function ogCard(key) {
  const [eyebrow, title, sub, motif] = OG[key]
  const W = 1200, H = 630
  let s = rect(0, 0, W, H, { fill: 'url(#gdark)' })
  s += circle(1080, 60, 300, '#307fe2', 'opacity="0.16"') + circle(80, 640, 260, '#7c3aed', 'opacity="0.12"')
  s += logo(64, 58, 36, { fill: '#fff', icon: '#4b95f0' })
  s += rect(64, 196, 56, 6, { fill: '#4b95f0', r: 3 })
  s += text(64, 244, eyebrow.toUpperCase(), { size: 20, weight: 700, fill: '#7dd3fc', spacing: 3 })
  const size = title.length > 34 ? 56 : 64
  const lines = wrap(title, size, 640, true).slice(0, 3)
  lines.forEach((l, i) => { s += text(64, 316 + i * (size * 1.14), l, { size, weight: 700, fill: '#fff' }) })
  const sy = 316 + lines.length * size * 1.14 + 8
  wrap(sub, 26, 620).slice(0, 3).forEach((l, i) => { s += text(64, sy + 20 + i * 36, l, { size: 26, fill: '#94a3b8' }) })
  s += text(64, 586, 'ideav.pro', { size: 22, weight: 700, fill: '#64748b' })
  // right decorative motif
  const mx = motif === 'm3' ? 740 : 770, my = 150
  const r = (x, y, w, h, o) => rect(mx + x, my + y, w, h, o)
  s += `<g>`
  if (motif === 'm4') {
    s += r(40, 40, 360, 330, { fill: '#fff', r: 18, extra: 'filter="url(#shl)"' })
    s += bubble(mx + 120, my + 64, 260, 'user', ['Add 3 projects for Acme'], { size: 15 }).svg
    s += toolCall(mx + 60, my + 140, 320, 'integram_create_records', 'Projects, 3 records').svg
    s += toolCall(mx + 60, my + 204, 320, 'integram_update_record', 'Acme Retail').svg
    s += bubble(mx + 60, my + 274, 260, 'ai', ['Done. 3 projects added.'], { size: 15 }).svg
  } else if (motif === 'm3') {
    s += r(0, 60, 150, 250, { fill: '#fff', r: 14, extra: 'filter="url(#shl)"' }) + r(0, 60, 150, 34, { fill: '#107c41', r: 14 }) + r(0, 80, 150, 14, { fill: '#107c41' })
    for (let i = 0; i < 5; i++) s += r(14, 112 + i * 38, 122, 14, { fill: '#e2e8f0', r: 4 })
    s += path(`M${mx + 165} ${my + 180} h40 m-14 -13 l14 13 l-14 13`, { stroke: '#4b95f0', sw: 5 })
    s += r(225, 20, 190, 330, { fill: '#fff', r: 16, extra: 'filter="url(#shl)"' })
    for (let i = 0; i < 4; i++) s += r(241, 70 + i * 62, 158, 44, { fill: '#f1f5f9', r: 10 }) + r(251, 84 + i * 62, 60, 12, { fill: '#cbd5e1', r: 4 }) + r(338, 84 + i * 62, 50, 16, { fill: ['#d1fae5', '#e8f1fc', '#fef3c7', '#d1fae5'][i], r: 8 })
    s += r(241, 36, 90, 20, { fill: '#307fe2', r: 6 })
  } else {
    s += r(30, 30, 380, 350, { fill: '#fff', r: 18, extra: 'filter="url(#shl)"' })
    s += r(30, 30, 380, 46, { fill: '#f8fafc', r: 18 }) + r(30, 60, 380, 16, { fill: '#f8fafc' })
    s += circle(mx + 56, my + 53, 6, '#f87171') + circle(mx + 76, my + 53, 6, '#fbbf24') + circle(mx + 96, my + 53, 6, '#34d399')
    for (let i = 0; i < 5; i++) {
      const ry = 100 + i * 54
      s += r(50, ry, 340, 1, { fill: '#e2e8f0' }) + r(56, ry + 16, 80, 14, { fill: '#cbd5e1', r: 4 })
      s += r(160, ry + 10, 100, 26, { fill: '#e8f1fc', r: 7 }) + r(170, ry + 18, 60, 10, { fill: '#307fe2', r: 3, opacity: 0.6 })
      s += r(300 + (i % 2) * 10, ry + 12, 80 - (i % 2) * 10, 22, { fill: ['#d1fae5', '#ede9fe', '#fef3c7', '#d1fae5', '#e8f1fc'][i], r: 11 })
    }
    s += r(230, 330, 180, 80, { fill: '#307fe2', r: 16, extra: 'filter="url(#shl)"' }) + text(mx + 250, my + 366, '$128,430', { size: 24, weight: 700, fill: '#fff' }) + text(mx + 250, my + 392, 'Revenue', { size: 14, fill: '#cfe3fb' })
  }
  s += '</g>'
  return svgDoc(W, H, s)
}
