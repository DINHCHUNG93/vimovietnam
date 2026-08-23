#!/usr/bin/env node
/**
 * render.js — Máy sinh dashboard HTML cho vn-macro-monthly
 *
 * Nguyên tắc: NỘI DUNG QUYẾT ĐỊNH KHUNG (data-driven).
 * - Model chỉ viết report.json (dữ liệu + câu chuyện số liệu) — KHÔNG viết HTML thủ công
 * - Tháng thiếu nguồn → JSON vắng card → HTML tự vắng card, tab trống tự ẩn
 * - Template HTML 1300 dòng trước đây thu gọn thành: skin.css + skin.js + render.js
 *
 * Usage:
 *   node scripts/render.js --json=2026-07/report.json --history=history.json \
 *        --out=2026-07/report.html [--skin-dir=assets]
 *
 * Schema report.json (xem SKILL.md Bước 3 — "schema cho render.js"):
 *   report_id, period{month,year,data_cutoff}, verdict, verdict_class, verdict_reason,
 *   hero_kpis[{label,value,unit,delta,signal(pos|neg|neu),flag(green|red|amber)}],
 *   groups[{id,tab(ten tab, NGAN),title,tag(g1-g4),source_note,highlights{neg[],pos[]},
 *           cards[Card|Panel|Insight]}],
 *   risks[{level,risk}], catalysts[{level,catalyst}], key_takeaways[],
 *   _sources_coverage{available[],missing[],user_override,retry_hint},
 *   _data_provenance{sources_files{}}
 *
 * ⚠️ TRIẾT LÝ: NHÓM DO NỘI DUNG QUYẾT ĐỊNH — không bắt buộc 4 nhóm cố định.
 * Tháng thiếu mảng tiền tệ → KHÔNG khai báo nhóm tiền tệ (tab tự không tồn tại).
 * `tab` = tên hiển thị trên thanh điều hướng (ngắn gọn); `title` = tiêu đề dài trong section.
 *
 * Card: {type:"card",key,name,flag,signal(green|red|amber),primary?,wide?,
 *        value,unit,value_class(pos|neg|neu|""),target{badge,text,progress,progress_class},
 *        meta[[label,value,class]],why,narrative,has_chart,indicator,gauge?,news[{title,url,source,date,insight,sentiment}]}
 * Panel: {type:"panel",title,note,headers[],rows[[]],trend}
 * Insight: {type:"insight",title,summary,numbers,story}
 */

const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.replace(`--${name}=`, '') : def;
}

const jsonPath = arg('json');
const historyPath = arg('history');
const outPath = arg('out');
const skinDir = path.resolve(arg('skin-dir', path.join(__dirname, '..', 'assets')));

if (!jsonPath || !historyPath || !outPath) {
  console.error('❌ Usage: node render.js --json=report.json --history=history.json --out=report.html');
  process.exit(1);
}

const R = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
const CSS = fs.readFileSync(path.join(skinDir, 'skin.css'), 'utf8');
let JS = fs.readFileSync(path.join(skinDir, 'skin.js'), 'utf8');

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const periodLabel = `Tháng ${R.period.month}/${R.period.year}`;
const verdictClass = R.verdict_class || 'amber';

/* ─────────────── HERO ─────────────── */
function heroHTML() {
  const kpis = (R.hero_kpis || []).map(k => `
      <div class="kpi">
        <div class="kpi-label"><span class="flag-dot flag-${k.flag || 'green'}"></span>${esc(k.label)}</div>
        <div class="kpi-value mono ${k.signal === 'neg' ? 'neg' : k.signal === 'neu' ? 'neu' : 'pos'}">${esc(k.value)}<span style="font-size:14px;color:var(--text-dim)">${esc(k.unit || '')}</span></div>
        <div class="kpi-delta ${k.signal === 'neg' ? 'neg' : k.signal === 'neu' ? 'neu' : 'pos'}">${esc(k.delta || '')}</div>
      </div>`).join('');
  const verdictColor = verdictClass === 'red' ? 'var(--red)' : verdictClass === 'green' ? 'var(--green)' : 'var(--amber)';
  const verdictText = verdictClass === 'red' ? '#000' : verdictClass === 'green' ? '#000' : '#000';
  return `<div class="hero">
    <div class="hero-top">
      <div>
        <div>
          <span class="ticker-badge">📊 BÁO CÁO VĨ MÔ VIỆT NAM</span>
          <span class="update-badge">✦ ${esc(periodLabel)}</span>
        </div>
        <div class="report-title">Tình hình Kinh tế · Tiền tệ · Tài chính</div>
        <div class="report-sub">Kỳ báo cáo: ${R.period.year}-${String(R.period.month).padStart(2, '0')} · Chốt dữ liệu: ${esc(R.period.data_cutoff)} · ${esc((R._sources_coverage?.available || []).length)}/${esc(5)} nguồn: ${esc((R._sources_coverage?.available || []).join(' · '))}</div>
      </div>
      <div class="verdict-block">
        <div class="verdict-badge" style="background:${verdictColor};color:${verdictText}">⚖️ ${esc(R.verdict)}</div>
        <div class="verdict-reason">${esc(R.verdict_reason)}</div>
        <button class="btn-print" onclick="window.print()">🖨️ In / PDF</button>
      </div>
    </div>
    <div class="kpi-strip">${kpis}</div>
  </div>`;
}

/* ─────────────── COVERAGE WARN (partial run) ─────────────── */
function coverageHTML() {
  const c = R._sources_coverage;
  if (!c || !c.user_override || !c.missing || !c.missing.length) return '';
  const missing = c.missing.join(' + ');
  const hint = c.retry_hint ? ` Khuyến nghị: chạy lại sau ${esc(c.retry_hint)} để có bức tranh đầy đủ.` : '';
  return `<div class="coverage-warn">
    <div class="cw-icon">⚠️</div>
    <div class="cw-text">
      <strong>Báo cáo dùng ${c.available.length}/5 nguồn theo yêu cầu người dùng.</strong>
      Thiếu ${esc(missing)}.${hint}
    </div>
  </div>`;
}

/* ─────────────── CARD ─────────────── */
function cardHTML(card) {
  const cls = ['data-card', `signal-${card.signal || 'amber'}`];
  if (card.primary || card.wide) cls.push('wide'); // QUY LUẬT 2 TẦNG: primary luôn cả dòng
  const target = card.target ? `
        <div class="dc-target-row">
          <span class="dc-target-badge ${card.target.progress_class || 'over'}">${esc(card.target.badge || '')}</span>
          <span>${esc(card.target.text || '')}</span>
        </div>
        ${card.target.progress != null ? `<div class="dc-progress"><div class="dc-progress-fill ${card.target.progress_class || 'over'}" style="width:${Math.min(100, card.target.progress)}%"></div></div>` : ''}` : '';
  const meta = (card.meta || []).map(([l, v, c2]) =>
    `<span>${esc(l)} <strong class="mono ${c2 || ''}">${esc(v)}</strong></span>`).join('');
  // B1: So sánh tháng trước TỰ ĐỘNG — từ history.json khi đủ 2 kỳ (feature ngủ chờ data)
  const prevDelta = (() => {
    if (!card.has_chart || !card.indicator) return '';
    const pts = (history.series || {})[card.indicator] || [];
    if (pts.length < 2) return ''; // chưa đủ 2 kỳ → ẩn (kỳ đầu tiên)
    const cur = pts[pts.length - 1].value, prev = pts[pts.length - 2].value;
    if (typeof cur !== 'number' || typeof prev !== 'number' || !isFinite(cur - prev)) return '';
    const d = cur - prev;
    const pm = String(pts[pts.length - 2].month).slice(5).replace('-', '/');
    const sign = d >= 0 ? '+' : '';
    return `<div class="dc-prev-delta ${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '▲' : '▼'} ${sign}${d.toLocaleString('en-US', { maximumFractionDigits: 2 })} so với T${pm}</div>`;
  })();
  const gauge = card.gauge ? `<div class="gauge-wrap" id="pmiGaugeWrap">
    <svg id="pmiGauge" role="img" aria-label="Đồng hồ PMI: ${esc(card.value)} trên thang 35-65, mốc 50"></svg>
    <div class="gauge-value ${card.value_class || ''}">${esc(card.value)}</div>
  </div>` : '';
  const news = (card.news || []).map(n => `
          <div class="dc-news-item">
            <div class="dc-news-head">
              <div class="dc-news-title"><a href="${esc(n.url)}" target="_blank">${esc(n.title)}</a><span class="dc-news-sentiment ${esc(n.sentiment || 'TRUNG')}">${esc(n.sentiment || 'TRUNG')}</span></div>
              <div class="dc-news-meta">${esc(n.source)} · ${esc(n.date || '')}</div>
            </div>
            <div class="dc-news-insight">${esc(n.insight || '')}</div>
          </div>`).join('');
  // TẦNG 2: narrative gấp trong "📖 Đọc thêm" — ẩn mặc định, bấm mới xổ (phân tầng chữ)
  const narrative = card.narrative ? `<details class="dc-readmore"><summary>📖 Đọc thêm</summary>
        <div class="dc-narrative">${card.narrative}</div></details>` : '';
  return `<div class="${cls.join(' ')}">
        <div class="dc-head"><span class="dc-name">${esc(card.name)}</span><span class="dc-flag">${card.flag || ''}</span></div>
        <div class="dc-value mono ${card.value_class || ''}">${esc(card.value)}<span class="dc-unit">${esc(card.unit || '')}</span></div>
        ${target}
        <div class="dc-meta">${meta}</div>
        ${prevDelta}
        ${gauge}
        <div class="dc-why">${esc(card.why || '')}</div>
        ${narrative}
        ${card.has_chart ? `<button class="dc-chart-btn" data-indicator="${esc(card.indicator)}">📊 Biểu đồ</button>` : ''}
        ${news ? `<div class="dc-news">${news}</div>` : ''}
      </div>`;
}

/* ─────────────── PANEL ─────────────── */
function panelHTML(p) {
  const head = (p.headers || []).map(h => `<th>${esc(h)}</th>`).join('');
  const rows = (p.rows || []).map(r =>
    `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div class="panel">
        <div class="panel-head">
          <span class="panel-title">${esc(p.title)}</span>
          <span class="panel-note">${esc(p.note || '')}</span>
        </div>
        <table class="panel-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${p.trend ? `<div class="panel-trend">${p.trend}</div>` : ''}
      </div>`;
}

/* ─────────────── SPECIAL INSIGHT ─────────────── */
// KHÔNG có banner ảnh/gradient trống — tránh "khoảng trống chết" 140px vô nghĩa.
// Insight bắt đầu thẳng bằng nhãn + tiêu đề.
function insightHTML(s) {
  return `<div class="special-insight">
        <span class="si-label">🔬 phân tích chuyên sâu</span>
        <div class="si-title">${s.title}</div>
        <div class="si-summary">${s.summary}</div>
        <div class="si-section-label">📊 Con số kể</div>
        <div class="si-numbers">${s.numbers}</div>
        <div class="si-section-label">🔗 Góc nhìn rộng hơn</div>
        <div class="si-cross-story">${s.story}</div>
      </div>`;
}

/* ─────────────── EDITORIAL: text + graph (triết lý mới — thay thẻ card) ─────────────── */
// Mỗi nhóm = đoạn văn dẫn (lead) + biểu đồ SVG minh họa + các dòng dữ liệu text.
// Graph SVG vẽ TĨNH tại render (in/PDF được, offline tốt).

// Bar chart SVG thuần (so sánh các kỳ/mốc) — items: [{label, value, color?}]
function barGraphSVG(items, w = 560, h = 150) {
  const padL = 46, padB = 26, padT = 12, padR = 8;
  const iw = w - padL - padR, ih = h - padT - padB;
  const vals = items.map(i => i.value);
  const max = Math.max(...vals, 0) * 1.12 || 1;
  const min = Math.min(0, ...vals);
  const span = (max - min) || 1;
  const bw = iw / items.length * 0.55;
  const px = i => padL + iw / items.length * (i + 0.5);
  const py = v => padT + ih - (v - min) / span * ih;
  const colorOf = c => c === 'pos' ? '#10d98a' : c === 'neg' ? '#ff4d6d' : c === 'target' ? '#fbbf24' : '#a855f7';
  const parts = [];
  parts.push(`<line x1="${padL}" y1="${py(0)}" x2="${padL + iw}" y2="${py(0)}" stroke="rgba(139,92,246,0.25)" stroke-width="1" stroke-dasharray="4 4"/>`);
  items.forEach((it, i) => {
    const x = px(i) - bw / 2, y = py(it.value), bh = Math.max(2, Math.abs(py(0) - y));
    const yy = it.value >= 0 ? y : py(0);
    parts.push(`<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${colorOf(it.color)}" opacity="0.85"/>`);
    parts.push(`<text x="${px(i).toFixed(1)}" y="${(h - 8).toFixed(1)}" fill="#8b8ba7" font-size="10" text-anchor="middle">${esc(it.label)}</text>`);
    const vv = (it.value >= 0 ? '+' : '') + it.value;
    parts.push(`<text x="${px(i).toFixed(1)}" y="${(y - 6).toFixed(1)}" fill="${colorOf(it.color)}" font-size="11" font-weight="700" text-anchor="middle" font-family="JetBrains Mono, monospace">${vv}</text>`);
  });
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Biểu đồ so sánh">${parts.join('')}</svg>`;
}

// Line chart SVG từ history (≥2 điểm mới vẽ — feature ngủ chờ data)
function lineGraphSVG(series, w = 560, h = 150) {
  if (!series || series.length < 2) return '';
  const padL = 46, padB = 26, padT = 12, padR = 10;
  const iw = w - padL - padR, ih = h - padT - padB;
  const vals = series.map(s => s.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = (max - min) || 1;
  const px = i => padL + iw / (vals.length - 1) * i;
  const py = v => padT + ih - (v - min) / span * ih;
  const pts = vals.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  const col = up ? '#10d98a' : '#ff4d6d';
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Biểu đồ xu hướng">
    <polygon points="${padL},${padT + ih} ${pts} ${padL + iw},${padT + ih}" fill="${up ? 'rgba(16,217,138,0.12)' : 'rgba(255,77,109,0.12)'}"/>
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${px(vals.length - 1).toFixed(1)}" cy="${py(vals[vals.length - 1]).toFixed(1)}" r="3.6" fill="${col}"/>
    ${series.map((s, i) => `<text x="${px(i).toFixed(1)}" y="${(h - 8).toFixed(1)}" fill="#8b8ba7" font-size="10" text-anchor="middle">${esc(String(s.month).slice(5))}</text>`).join('')}
  </svg>`;
}

function graphHTML(graph) {
  if (!graph) return '';
  // Line: nhận mảng sẵn (graph.series) hoặc tự nạp từ history theo series_key
  let series = graph.series;
  if (graph.type === 'line' && !series && graph.series_key) {
    series = (history.series || {})[graph.series_key] || [];
  }
  const body = graph.type === 'line'
    ? lineGraphSVG(series, graph.w, graph.h)
    : barGraphSVG(graph.items || [], graph.w, graph.h);
  if (!body) return '';
  return `<div class="ed-graph"><div class="ed-graph-title">📈 ${esc(graph.title || '')}</div>${body}</div>`;
}

function dataItemsHTML(items) {
  if (!items || !items.length) return '';
  return `<div class="ed-items">${items.map(it => `
      <div class="ed-item">
        <div class="ed-name">${esc(it.name)}</div>
        <div class="ed-value ${it.signal === 'neg' ? 'neg' : it.signal === 'neu' ? 'neu' : 'pos'}">${esc(it.value)}</div>
        <div class="ed-note">${it.note || ''}</div>
      </div>`).join('')}</div>`;
}

/* ─────────────── GROUP SECTION ───────────────
   QUY LUẬT 2 TẦNG (hết "thẻ kích thước lung tung"):
   - card `primary`  → LUÔN cả dòng (wide) — câu chuyện chính của nhóm
   - card thường     → LUÔN 1/3 đồng đều — kích thước không bao giờ đổi
   - panel/insight   → cả dòng
   KHÔNG còn span 2, KHÔNG tự nới card cuối (auto-balance đã bỏ — nới = kích thước vô quy luật).
   Hàng cuối thiếu card → để trống có chủ đích (đồng đều hơn nới vẹo). */
function groupHTML(g, idx, isActive) {
  // EDITORIAL (triết lý mới): lead + graph + data_items
  const body = g.lead
    ? `<div class="ed-section">
        <div class="ed-lead">${g.lead}</div>
        ${graphHTML(g.graph)}
        ${dataItemsHTML(g.data_items)}
      </div>`
    // CARD (tương thích ngược — báo cáo cũ vẫn render)
    : `<div class="data-grid">${(g.cards || []).map(c =>
        c.type === 'panel' ? panelHTML(c) : c.type === 'insight' ? insightHTML(c) : cardHTML(c)).join('')}</div>`;
  const hl = g.highlights || {};
  const hlBox = (label, cls, items) => items && items.length ? `<div class="highlight-box ${cls}">
        <div class="hl-label">${label}</div>
        <ul class="hl-items">${items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>` : '';
  const highlights = (hl.neg?.length || hl.pos?.length) ? `<div class="highlights">
      ${hlBox('🔴 TIÊU CỰC', 'neg', hl.neg)}
      ${hlBox('🟢 TÍCH CỰC', 'pos', hl.pos)}
    </div>` : '';
  return `<section class="group-section${isActive ? ' active' : ''}" id="group${idx}">
    <div class="group-header">
      <span class="tag ${g.tag || 'g1'}">${esc(g.number || String(idx).padStart(2, '0'))}</span>
      <h2>${esc(g.title)}</h2>
      <div class="divider-line"></div>
      <span style="font-size:12px;color:var(--text-faint)">${esc(g.source_note || '')}</span>
    </div>
    ${highlights}
    ${body}
  </section>`;
}

/* ─────────────── SUMMARY ─────────────── */
function summaryHTML() {
  if (!(R.risks?.length || R.catalysts?.length || R.key_takeaways?.length)) return '';
  const risks = (R.risks || []).map(r => {
    const cls = r.level === 'Rất cao' ? 'critical' : r.level === 'Cao' ? 'high' : 'medium';
    return `<div class="rc-item"><span class="rc-level ${cls}">${esc(r.level)}</span>${esc(r.risk)}</div>`;
  }).join('');
  const cats = (R.catalysts || []).map(c => {
    const cls = c.level === 'Cao' ? 'high' : 'medium';
    return `<div class="rc-item"><span class="rc-level ${cls}">${esc(c.level)}</span>${esc(c.catalyst)}</div>`;
  }).join('');
  const takes = (R.key_takeaways || []).map(t => `<li>${t}</li>`).join('');
  return `<section class="group-section" id="summary">
    <div class="group-header">
      <span class="tag g1">05</span>
      <h2>Tổng hợp — Rủi ro · Động lực · Điểm chính</h2>
      <div class="divider-line"></div>
    </div>
    <div class="rc-grid">
      ${risks ? `<div class="rc-box risks"><div class="rc-title">⚠️ RỦI RO</div>${risks}</div>` : ''}
      ${cats ? `<div class="rc-box catalysts"><div class="rc-title">🚀 ĐỘNG LỰC</div>${cats}</div>` : ''}
    </div>
    ${takes ? `<div class="section-title" style="margin-top:36px"><h2>⭐ Điểm chính</h2><div class="divider-line"></div></div>
    <div class="takeaways"><ol>${takes}</ol></div>` : ''}
  </section>`;
}

/* ─────────────── NAV (chỉ hiện tab có nội dung; tên nhóm do JSON quyết định) ─────────────── */
function navHTML() {
  const tabs = [];
  R.groups.forEach((g, i) => {
    if ((g.cards || []).length || g.lead) tabs.push({ id: `group${i + 1}`, name: g.tab || g.title.split(' — ')[0] || 'Nhóm' });
  });
  if (R.risks?.length || R.catalysts?.length || R.key_takeaways?.length) {
    tabs.push({ id: 'summary', name: '📊 Tổng hợp' });
  }
  return tabs.map((t, i) =>
    `<button class="nav-tab${i === 0 ? ' active' : ''}" data-target="${t.id}">${t.name}</button>`).join('');
}

/* ─────────────── BUILD ─────────────── */
// Nhóm đầu tiên CÓ NỘI DUNG (card hoặc lead) là nhóm hiển thị mặc định (active)
let firstActiveAssigned = false;
const groupSections = R.groups.map((g, i) => {
  const hasCards = (g.cards || []).length > 0 || !!g.lead;
  const isActive = hasCards && !firstActiveAssigned;
  if (isActive) firstActiveAssigned = true;
  return groupHTML(g, i + 1, isActive);
}).join('');
const summarySection = summaryHTML();

// Inject history thật vào skin.js (giữ nguyên wrapper {series:{...}})
const historyData = history.series !== undefined ? history.series : history;
JS = JS.replace('/*__HISTORY__*/{series:{}}', JSON.stringify({ series: historyData }));

const footerSources = (R._sources_coverage?.available || []).map(s => esc(s)).join(' · ');
const disclaimer = R._sources_coverage?.user_override
  ? `⚠️ <strong>Miễn trừ trách nhiệm:</strong> Báo cáo vĩ mô tham khảo cá nhân. Kỳ này dùng ${R._sources_coverage.available.length}/5 nguồn theo yêu cầu người dùng (${esc(R._sources_coverage.available.join(', '))}); thiếu ${esc(R._sources_coverage.missing.join(' + '))} — các mảng dữ liệu tương ứng sẽ được bổ sung khi chạy lại. Áp nguyên tắc Nhất quán thời gian (chốt dữ liệu ${esc(R.period.data_cutoff)}). <strong>Không phải lời khuyên đầu tư</strong>.`
  : `⚠️ <strong>Miễn trừ trách nhiệm:</strong> Báo cáo vĩ mô tham khảo cá nhân. Số liệu từ 5 nguồn chính thức. Áp nguyên tắc Nhất quán thời gian (chốt dữ liệu ${esc(R.period.data_cutoff)}). <strong>Không phải lời khuyên đầu tư</strong>.`;

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Báo cáo vĩ mô VN · ${esc(periodLabel)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="container">
  ${heroHTML()}
  ${coverageHTML()}
  <nav class="nav-tabs">${navHTML()}</nav>
  ${groupSections}
  ${summarySection}
  <div class="disclaimer">${disclaimer}</div>
  <footer>
    <div>📊 Báo cáo vĩ mô VN · ${esc(periodLabel)} · ${esc(R.period.data_cutoff)}</div>
    <div style="margin-top:6px">Nguồn: ${footerSources}</div>
  </footer>
</div>
<div class="modal" id="chartModal">
  <div class="modal-content">
    <div class="modal-head">
      <h3 id="modalTitle">Dữ liệu lịch sử</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-chart-wrap"><canvas id="modalChart"></canvas></div>
  </div>
</div>
<script>${JS}</script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅ Render xong: ${outPath}`);
console.log(`   Groups: ${R.groups.length} · Cards: ${R.groups.reduce((n, g) => n + (g.cards || []).length, 0)} · Tabs: ${navHTML().split('</button>').length - 1}`);
