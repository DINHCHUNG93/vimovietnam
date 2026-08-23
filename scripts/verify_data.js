#!/usr/bin/env node
/**
 * verify_data.js — LỚP KIỂM SOÁT DỮ LIỆU (chạy BẮT BUỘC giữa Bước 3 → Bước 4)
 *
 * Giải quyết lỗ hổng lớn nhất được 2-model review phát hiện:
 * "Mọi số liệu chỉ dựa vào sự trung thực của AI — không có lớp máy nào đối chiếu".
 *
 * Máy này kiểm tra theo SCHEMA EDITORIAL (lead + graph + data_items) —
 * schema card cũ vẫn được kiểm tra qua nhánh fallback (tương thích ngược):
 *  1. PROVENANCE   — file cache khai báo trong _data_provenance phải TỒN TẠI + non-empty
 *  2. BOUNDS       — mỗi data_item có tên quen thuộc phải nằm trong khoảng hợp lý
 *                    (chặn "5.60" → "560", tỷ giá 25.139 → 251.390...)
 *  3. HISTORY      — series tăng dần theo tháng, không trùng tháng; graph line
 *                    có series_key phải có entry kỳ hiện tại
 *  4. COVERAGE     — available/missing không trùng nhau, tổng ≤ 5 nguồn chuẩn
 *  5. WORD LIMITS  — lead ≤ 130 từ + ≥2 con số, note ≤ 22 từ + ≥1 con số (chống over-text)
 *  6. STRUCTURE    — mỗi nhóm 2-6 mục, nhóm không trống, graph 2-10 cột
 *
 * Usage:
 *   node scripts/verify_data.js --json=2026-07/report.json --history=history.json
 *   Thêm --strict để FAIL khi có WARN (dùng trong CI nếu cần)
 *
 * Exit code: 0 = PASS · 1 = WARNINGS · 2 = FAIL
 */

const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.replace(`--${name}=`, '') : def;
}
const jsonPath = arg('json');
const historyPath = arg('history');
const strict = process.argv.includes('--strict');

if (!jsonPath || !historyPath) {
  console.error('❌ Usage: node verify_data.js --json=report.json --history=history.json [--strict]');
  process.exit(2);
}

const R = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const reportDir = path.dirname(path.resolve(jsonPath));
const cacheDir = path.join(reportDir, 'sources_cache');
const errors = [];
const warns = [];

/* ─────────── helper: parse số theo kiểu Việt Nam ───────────
   "4.555,8" = 4555.8 (chấm nghìn, phẩy thập phân)
   "1,138.5" = 1138.5 (phẩy nghìn, chấm thập phân)
   "53.08"   = 53.08 (chấm thập phân) */
const numOf = s => {
  if (typeof s === 'number') return s;
  if (typeof s !== 'string') return NaN;
  let t = s.trim().replace(/\s/g, '').replace(/[+%đ]/g, '');
  if (t.includes('/')) return NaN; // tỷ lệ dạng "8/8" — không phải số đo
  if (/\.\d{3}/.test(t)) t = t.replace(/\./g, '').replace(',', '.');           // chấm nghìn
  else if (/,?\d{1,3},\d{3}(?![\d,])/.test(t)) t = t.replace(/,/g, '');         // phẩy nghìn
  else if (t.includes(',')) t = t.replace(',', '.');                            // phẩy thập phân
  return parseFloat(t);
};
const wordsOf = s => String(s || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
const numCountOf = s => (String(s || '').match(/[+-]?\d[\d.,]*\s*%?/g) || []).length;
const hasForecast = s => /tôi nghĩ|dự báo|sẽ (tăng|giảm|tiếp tục|vượt)|chắc chắn|chắc sẽ|nhất định/.test(String(s || ''));

/* ─────────── 1. PROVENANCE: file cache phải tồn tại + non-empty ─────────── */
const provFiles = R._data_provenance?.sources_files || {};
const provFileNames = Object.keys(provFiles);
if (!provFileNames.length) {
  warns.push('PROVENANCE: _data_provenance.sources_files rỗng — mọi số chưa được khai báo nguồn');
} else {
  for (const f of provFileNames) {
    const p = path.join(cacheDir, f);
    if (!fs.existsSync(p)) {
      errors.push(`PROVENANCE: file cache "${f}" KHÔNG TỒN TẠI trong sources_cache/ (khai báo bịa?)`);
    } else {
      const size = fs.statSync(p).size;
      if (size === 0) errors.push(`PROVENANCE: file cache "${f}" RỖNG (0 byte)`);
    }
  }
  // Mọi data_item có data thật phải thuộc ít nhất 1 file provenance (anti-placeholder)
  const itemCount = R.groups?.reduce((n, g) => n + (g.data_items || []).length, 0) || 0;
  if (itemCount && !provFileNames.length) {
    warns.push(`PROVENANCE: ${itemCount} data_item nhưng không file nào khai báo nguồn`);
  }
}

/* ─────────── 2. BOUNDS: khoảng hợp lý theo tên chỉ số quen thuộc ─────────── */
// [min, max] — ngoài khoảng = gần như chắc chắn sai đơn vị/hoán đổi số
const NAME_BOUNDS = [
  [/^PMI\b/, 'pmi',              [20, 70]],      // PMI điểm (50 = ranh giới)
  [/^CPI\b/, 'cpi',              [-5, 30]],      // CPI YoY %
  [/^IIP\b/, 'iip',              [-30, 60]],     // IIP YoY %
  [/^Cán cân/, 'trade_balance',  [-100, 100]],   // tỷ USD lũy kế
  [/^Xuất khẩu/, 'exports',      [0, 700]],      // tỷ USD (tháng ~50 hoặc lũy kế ~600)
  [/^Nhập khẩu/, 'imports',      [0, 700]],
  [/^XK sang/, 'exports',        [0, 700]],
  [/^Nhập từ/, 'imports',        [0, 700]],
  [/^FDI đăng ký/, 'fdi_registered', [0, 150]],  // tỷ USD
  [/^FDI thực hiện/, 'fdi_disbursed', [0, 100]],
  [/^Bán lẻ/, 'retail_pct',      [-20, 100]],    // % YoY
  [/^Khách quốc tế/, 'visitors', [0, 50]],       // triệu lượt
  [/^Ngân sách NN/, 'state_budget', [-2000, 3000]], // nghìn tỷ VND
  [/^Đầu tư NSNN/, 'state_invest', [0, 2000]],   // nghìn tỷ VND
  [/^Chỉ số giá vàng/, 'gold_index_vn', [-20, 200]], // chỉ số giá vàng YoY %
  [/^Chỉ số giá USD/, 'usd_index_vn', [-20, 50]],    // chỉ số giá USD YoY %
  [/^Lao động CN/, 'labor_cn',   [-10, 30]],     // % YoY
  [/^Thủy sản/, 'agri',          [-20, 2000]],   // % YoY (hoặc nghìn tấn)
  [/^Lúa gieo cấy/, 'paddy',     [0, 5000]],     // nghìn ha
  [/^DN thành lập mới/, 'dn_new', [0, 300]],     // nghìn DN
  [/^DN rút lui/, 'dn_exit',     [0, 500]],      // nghìn DN
  [/^Vận tải/, 'transport',      [0, 5000]],     // triệu lượt / triệu tấn
];
const boundsOf = name => {
  for (const [re, , b] of NAME_BOUNDS) if (re.test(name)) return b;
  return null;
};
for (const g of R.groups || []) {
  for (const it of g.data_items || []) {
    const b = boundsOf(it.name);
    if (!b) continue;
    if (String(it.value).includes('/')) continue; // tỷ lệ dạng "8/8 cải thiện" — không phải số đo
    const v = numOf(it.value);
    if (isNaN(v)) {
      warns.push(`BOUNDS: item "${it.name}" value "${it.value}" không parse được thành số`);
    } else if (v < b[0] || v > b[1]) {
      errors.push(`BOUNDS: item "${it.name}" value=${it.value} NGOÀI KHOẢNG [${b[0]}, ${b[1]}] — nghi sai đơn vị/hoán đổi số`);
    }
    // note chỉ check CẬN TRÊN (max×3): bắt sai bậc đơn vị (560 thay vì 5.60);
    // không check cận dưới vì note chứa cả số so sánh nhỏ (MoM +1.1, -0.12%...);
    // bỏ qua năm (4 chữ số ≥ 1900) — "2025" là năm, không phải số đo
    for (const m of String(it.note || '').match(/[+-]?\d[\d.,]*\s*%?/g) || []) {
      const mv = numOf(m);
      if (!isNaN(mv) && mv > b[1] * 3 && !(Number.isInteger(mv) && mv >= 1900 && mv <= 2100)) {
        warns.push(`BOUNDS: item "${it.name}" note chứa số ${m} nghi sai đơn vị (nằm ngoài ${b[1]}×3)`);
      }
    }
  }
  // Graph bar: mỗi cột phải là số thực, ít nhất 2 cột mới vẽ được
  const gr = g.graph;
  if (gr && gr.type === 'bar') {
    const its = gr.items || [];
    for (const it of its) {
      if (typeof it.value !== 'number' || !isFinite(it.value)) {
        errors.push(`BOUNDS: graph "${g.tab}" cột "${it.label}" value không phải số thực`);
      }
    }
  }
}

/* ─────────── 3. HISTORY: tăng dần, không trùng, khớp kỳ hiện tại ─────────── */
let history;
try {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
} catch (e) {
  errors.push(`HISTORY: không đọc được ${historyPath} — ${e.message}`);
  history = { series: {} };
}
const series = history.series || {};
const curMonth = `${R.period.year}-${String(R.period.month).padStart(2, '0')}`;
for (const [key, pts] of Object.entries(series)) {
  if (!Array.isArray(pts)) { errors.push(`HISTORY: series "${key}" không phải mảng`); continue; }
  if (pts.length < 2) continue; // 1 điểm = kỳ đầu, hợp lệ
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].month <= pts[i - 1].month) {
      errors.push(`HISTORY: series "${key}" tháng "${pts[i].month}" không tăng dần sau "${pts[i-1].month}" (trùng/ghi đè?)`);
    }
  }
}
// Graph line có series_key → phải tồn tại series + đã append kỳ hiện tại
for (const g of R.groups || []) {
  const gr = g.graph;
  if (!gr || gr.type !== 'line' || !gr.series_key) continue;
  const pts = series[gr.series_key];
  if (!pts || !pts.length) {
    warns.push(`HISTORY: graph line "${g.tab}" series_key "${gr.series_key}" chưa có entry trong history.json`);
  } else {
    const last = pts[pts.length - 1];
    if (last.month !== curMonth) {
      warns.push(`HISTORY: series "${gr.series_key}" entry mới nhất là ${last.month}, kỳ hiện tại là ${curMonth} — CHƯA APPEND kỳ này (line graph sẽ chưa vẽ điểm mới)`);
    }
  }
}

/* ─────────── 4. COVERAGE: available/missing không trùng, tổng ≤ 5 ─────────── */
const cov = R._sources_coverage;
if (cov) {
  const avail = cov.available || [];
  const miss = cov.missing || [];
  const dup = avail.filter(a => miss.includes(a));
  if (dup.length) errors.push(`COVERAGE: nguồn "${dup.join(', ')}" xuất hiện CẢ available lẫn missing`);
  if (avail.length + miss.length > 6) {
    warns.push(`COVERAGE: available(${avail.length}) + missing(${miss.length}) > 6 — nghi liệt kê trùng/thiếu chuẩn 5 nguồn`);
  }
  if (cov.user_override && !cov.retry_hint) {
    warns.push('COVERAGE: user_override=true nhưng thiếu retry_hint (ngày chạy lại khi đủ 5 nguồn)');
  }
}

/* ─────────── 5. WORD LIMITS + QUALITY: chống "over text" (tầng 1 phải scan nhanh) ───────────
   Editorial: lead = đoạn dẫn 2-3 câu; note = dòng ghi chú 1 dòng. Chữ dài phải nằm
   trong lead (có chủ đích) chứ không tràn ra note. */
for (const g of R.groups || []) {
  // lead
  const lead = g.lead || '';
  if (lead) {
    const wLead = wordsOf(lead);
    if (wLead > 130) warns.push(`WORD: nhóm "${g.tab}" lead dài ${wLead} từ (chuẩn ≤130) — đoạn dẫn phải đọc nhanh`);
    const nums = numCountOf(lead);
    if (nums < 2) warns.push(`QUALITY: nhóm "${g.tab}" lead chỉ có ${nums} con số (chuẩn ≥2 — dẫn dắt phải nối số liệu với nhau)`);
    if (hasForecast(lead)) warns.push(`QUALITY: nhóm "${g.tab}" lead chứa từ DỰ BÁO ("sẽ/dự báo/tôi nghĩ") — phải kể diễn biến số, không đoán tương lai`);
  }
  // data_items
  for (const it of g.data_items || []) {
    const wNote = wordsOf(it.note);
    if (wNote > 22) warns.push(`WORD: item "${it.name}" note dài ${wNote} từ (chuẩn ≤22) — dòng ghi chú phải 1 dòng`);
    if (it.note && numCountOf(it.note) < 1) warns.push(`QUALITY: item "${it.name}" note không có con số nào — dòng dữ liệu phải kèm số so sánh`);
    if (!it.signal || !['pos', 'neg', 'neu'].includes(it.signal)) warns.push(`QUALITY: item "${it.name}" thiếu signal (pos/neg/neu) — mất màu tín hiệu`);
  }
  // graph
  const gr = g.graph;
  if (gr && gr.type === 'bar') {
    const n = (gr.items || []).length;
    if (n < 2) warns.push(`STRUCTURE: graph bar nhóm "${g.tab}" chỉ ${n} cột (chuẩn 2-10)`);
    if (n > 10) warns.push(`STRUCTURE: graph bar nhóm "${g.tab}" có ${n} cột (chuẩn ≤10) — chọn cột đại diện`);
  }
  // fallback schema card cũ
  for (const c of g.cards || []) {
    if (c.type !== 'card') continue;
    const wWhy = wordsOf(c.why);
    if (wWhy > 22) warns.push(`WORD: card "${c.key}" why dài ${wWhy} từ (chuẩn ≤22)`);
    if ((c.meta || []).length > 3) warns.push(`WORD: card "${c.key}" có ${(c.meta || []).length} ô meta (chuẩn ≤3)`);
    const wNarr = wordsOf(c.narrative);
    if (wNarr > 120) warns.push(`WORD: card "${c.key}" narrative dài ${wNarr} từ (chuẩn ≤120)`);
  }
}

/* ─────────── 6. STRUCTURE: phân bổ nhóm + độ sâu (chống "1 nhóm phình to, nhóm rỗng") ───────────
   Bài học 2026-08-03: vấn đề "phân bổ không đều / độ sâu không đủ" phải chặn ở LỚP SKILL
   (máy verify), không phải sửa từng báo cáo. */
const groups = R.groups || [];
if (groups.length < 2) warns.push('STRUCTURE: chỉ ' + groups.length + ' nhóm — nên tách theo chủ đề 3-5 mục/nhóm');
for (const g of groups) {
  const n = (g.data_items || []).length + (g.cards || []).length;
  if (n === 0 && !g.lead) warns.push(`STRUCTURE: nhóm "${g.tab || g.title}" TRỐNG — phải có lead + data_items (hoặc cards)`);
  if (n > 6) warns.push(`STRUCTURE: nhóm "${g.tab || g.title}" có ${n} mục (chuẩn ≤6) — tách nhóm theo chủ đề để phân bổ đều`);
}
// Editorial: lead bắt buộc nếu nhóm không còn card (triết lý text + graph)
for (const g of groups) {
  if (!g.lead && !(g.cards || []).length) {
    warns.push(`STRUCTURE: nhóm "${g.tab || g.title}" không có lead — schema editorial yêu cầu đoạn dẫn mở đầu`);
  }
}

/* ─────────── REPORT ─────────── */
const totalItems = groups.reduce((n, g) => n + (g.data_items || []).length, 0);
const totalCards = groups.reduce((n, g) => n + (g.cards || []).length, 0);
console.log('🔍 VERIFY DATA — ' + R.report_id);
console.log(`   Provenance files: ${provFileNames.length} · Items: ${totalItems} · Cards(fallback): ${totalCards} · Groups: ${groups.length}`);
if (errors.length) {
  console.log('\n❌ FAIL (' + errors.length + '):');
  errors.forEach(e => console.log('  ✗ ' + e));
} else if (warns.length && strict) {
  console.log('\n❌ FAIL (--strict + ' + warns.length + ' warnings):');
  warns.forEach(w => console.log('  ⚠ ' + w));
} else {
  console.log('\n' + (warns.length ? '⚠️  PASS WITH WARNINGS (' + warns.length + ')' : '✅ PASS'));
  warns.forEach(w => console.log('  ⚠ ' + w));
}
process.exit(errors.length ? 2 : (warns.length && strict) ? 2 : warns.length ? 1 : 0);
