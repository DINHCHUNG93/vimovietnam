# Rendering — HTML design pattern cho vn-macro-monthly

Dashboard HTML đồng style với `vn-research-dashboard` + `vn-news-digest`. Self-contained single-file (CSS + JS + Chart.js embed inline).

## Mục lục

- [Layout tổng thể](#layout-tổng-thể)
- [Style guide đồng bộ](#style-guide-đồng-bộ-vn-research-dashboard)
- [3 Component mới](#3-component-mới)
- [Click-to-chart pattern](#click-to-chart-pattern)
- [Chart.js setup](#chartjs-setup)
- [Verdict color mapping](#verdict-color-mapping)

---

## Layout tổng thể

```
┌─────────────────────────────────────────────────────────┐
│ HERO                                                     │
│  📊 BÁO CÁO VĨ MÔ VN · Tháng 5/2026                      │
│  Verdict badge (TRUNG TÍNH — CẢNH GIÁC — gradient)       │
│  4 metric boxes (CPI 🔴, PMI 🟢, XNK 🟢, LNH 🔴)         │
├─────────────────────────────────────────────────────────┤
│ NAV (sticky top) — 5 tab                                 │
│ [Kinh tế thực*] [Tiền tệ & TC] [Ngành] [Bối cảnh] [Tổng hợp]│
├─────────────────────────────────────────────────────────┤
│ SECTION 1 — KINH TẾ THỰC (mặc định active)              │
│  🔴 TIÊU CỰC (highlight box, 2-3 items)                 │
│  🟢 TÍCH CỰC (highlight box, 2-3 items)                 │
│  📋 CHI TIẾT (data cards grid, priority giảm dần)       │
│    ┌─────────────────────────────┐                      │
│    │ CPI YoY                      │                      │
│    │ 5.60% 🔴                      │                      │
│    │ MoM +0.29 | YTD avg 4.31%   │                      │
│    │ [📊 Chart] ← click to expand │                      │
│    └─────────────────────────────┘                      │
├─────────────────────────────────────────────────────────┤
│ SECTION 2/3/4 — (tương tự, click nav để chuyển)         │
├─────────────────────────────────────────────────────────┤
│ SECTION 5 — TỔNG HỢP (tab riêng, KHÔNG hiện ở tab 1-4)  │
│  RISKS (cột trái) | CATALYSTS (cột phải)                │
│  KEY TAKEAWAYS (3 bullets ⭐)                            │
├─────────────────────────────────────────────────────────┤
│ FOOTER (nguồn + disclaimer) — LUÔN hiện (không thuộc tab)│
└─────────────────────────────────────────────────────────┘
```

### ⚠️ QUAN TRỌNG: Placement của Rủi ro/Động lực/Key takeaways

**Rủi ro (`rc-grid`) + Động lực + Key takeaways (`kt-section`) PHẢI nằm trong section tổng hợp riêng** — KHÔNG đặt ngoài group-section.

```html
<!-- ❌ SAI: đặt ngoài group-section → luôn hiện bất kể tab nào -->
<section class="group-section" id="group1">...</section>
<section class="group-section" id="group4">...</section>
<div class="rc-grid">⚠️ Rủi ro...</div>      <!-- luôn hiện, sai UX -->
<div class="kt-section">🎯 Key takeaways...</div>

<!-- ✅ ĐÚNG: bọc trong section tổng hợp (tab thứ 5) -->
<nav class="nav-tabs">
  <button data-target="group1">Kinh tế thực</button>
  ...
  <button data-target="summary">📊 Tổng hợp</button>   <!-- tab thứ 5 -->
</nav>
<section class="group-section" id="summary">
  <div class="rc-grid">⚠️ Rủi ro | 🚀 Động lực</div>
  <div class="kt-section">🎯 Key takeaways</div>
</section>
```

**Lý do**: JS nav ẩn/hiện dựa trên class `group-section`. Component nào không có class này → luôn hiện → gây "rò rỉ" nội dung giữa các tab (xem tab Kinh tế thực vẫn thấy Rủi ro).

**Quy tắc**: mọi component muốn ẩn/hiện theo tab → PHẢI nằm trong `<section class="group-section">`. Chỉ HERO, NAV, FOOTER đặt ngoài (luôn hiện).

---

## Style guide đồng bộ vn-research-dashboard

Copy CHÍNH XÁC các CSS variables (không sáng tạo palette mới):

```css
:root{
  --bg-0:#0a0a14; --bg-1:#10101f; --bg-2:#16162a;
  --card:rgba(28,28,48,0.55); --card-solid:#1a1a2e;
  --border:rgba(139,92,246,0.18); --border-hot:rgba(236,72,153,0.35);
  --text:#f0f0ff; --text-dim:#8b8ba7; --text-faint:#5a5a72;
  --purple:#a855f7; --purple-2:#8b5cf6; --pink:#ec4899; --cyan:#06b6d4;
  --green:#10d98a; --green-soft:rgba(16,217,138,0.15);
  --red:#ff4d6d; --red-soft:rgba(255,77,109,0.15); --amber:#fbbf24;
  --grad-main:linear-gradient(135deg,#a855f7 0%,#ec4899 100%);
  --grad-cool:linear-gradient(135deg,#06b6d4 0%,#8b5cf6 100%);
  --grad-bg:radial-gradient(ellipse at 20% 0%,rgba(139,92,246,0.15) 0%,transparent 50%),
            radial-gradient(ellipse at 80% 100%,rgba(236,72,153,0.12) 0%,transparent 50%);
}
```

### Typography
- `Inter` (sans) cho text
- `JetBrains Mono` (mono, `font-variant-numeric:tabular-nums`) cho mọi số
- Class `.mono` apply mono font

### Components tái sử dụng (từ dashboard_template.html)
- `.ticker-badge` — pill gradient (cho hero badge)
- `.hero` — radius 32px, blur 20px, có `::before` glow
- `.kpi` — 6-col grid strip (dùng cho 4 metric boxes hero)
- `.section-title` + `.tag` (purple/pink/cyan/green) + `.divider-line`
- `.card` — glassmorphism radius 24px, blur 14px
- `.fin-table` — bảng dữ liệu với hover, `.row-strong`, `.col-latest`
- `.exec-hl` — 4-col metric boxes pos/neg/neu (base cho highlight boxes)
- `.gauge-num` — gradient text (cho verdict số lớn)

### Class màu (dùng everywhere)
- `.pos` → `--green`
- `.neg` → `--red`
- `.neu` → `--amber`

---

## 3 Component mới + 10 panel chuyên sâu

Skill này có card dày hơn dashboard_template cũ + 3 component mới + 10 panel phân tích chuyên sâu:

### Data Card dày (15 trường hiển thị)
Mỗi card có: giá trị lớn + target badge (VƯỢT/MỞ RỘNG) + progress bar + MoM/YoY/YTD meta + `💡 Vì sao quan trọng` (1-2 câu) + drivers tags + `[📊]` button.

### 3 Component mới (layout)

### 1. NAV tab bar (sticky)

```html
<nav class="nav-tabs sticky">
  <button class="nav-tab active" data-target="group1">Kinh tế thực</button>
  <button class="nav-tab" data-target="group2">Tiền tệ & TC</button>
  <button class="nav-tab" data-target="group3">Ngành & cơ cấu</button>
  <button class="nav-tab" data-target="group4">Bối cảnh TG</button>
  <button class="nav-tab" data-target="summary">📊 Tổng hợp</button>
</nav>
```

```css
.nav-tabs{position:sticky;top:0;z-index:50;display:flex;gap:8px;
  background:rgba(10,10,20,0.85);backdrop-filter:blur(20px);
  padding:12px 32px;border-bottom:1px solid var(--border);margin:0 -32px 24px}
.nav-tab{background:transparent;border:1px solid transparent;color:var(--text-dim);
  padding:8px 16px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;
  transition:all .2s}
.nav-tab:hover{color:var(--text);background:rgba(168,85,247,0.08)}
.nav-tab.active{background:var(--grad-main);color:#fff;
  box-shadow:0 4px 16px rgba(168,85,247,0.4)}
```

```js
// Click → show section + scroll
document.querySelectorAll('.nav-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.group-section').forEach(s=>s.style.display='none');
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).style.display='block';
  });
});
```

### 2. Highlight boxes (🔴 tiêu cực + 🟢 tích cực)

Mỗi nhóm có 2 box nổi bật ở đầu. Variant của `.exec-hl`:

```html
<div class="highlights">
  <div class="highlight-box neg">
    <div class="hl-label">🔴 TIÊU CỰC</div>
    <ul class="hl-items">
      <li>CPI 5.60% <span class="hl-val neg">VƯỢT target 4.5%</span></li>
      <li>Trade balance <span class="hl-val neg">-13.8 tỷ USD</span> (đảo chiều)</li>
    </ul>
  </div>
  <div class="highlight-box pos">
    <div class="hl-label">🟢 TÍCH CỰC</div>
    <ul class="hl-items">
      <li>IIP <span class="hl-val pos">+8.8% YoY</span> (cao nhất 4 năm)</li>
      <li>FDI disbursed <span class="hl-val pos">+9.6%</span> (cao nhất 5 năm)</li>
    </ul>
  </div>
</div>
```

```css
.highlights{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.highlight-box{border-radius:18px;padding:18px 20px;backdrop-filter:blur(12px)}
.highlight-box.neg{background:var(--red-soft);border:1px solid rgba(255,77,109,0.3)}
.highlight-box.pos{background:var(--green-soft);border:1px solid rgba(16,217,138,0.3)}
.hl-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
  margin-bottom:10px}
.highlight-box.neg .hl-label{color:var(--red)}
.highlight-box.pos .hl-label{color:var(--green)}
.hl-items{list-style:none;padding:0;margin:0}
.hl-items li{font-size:13px;color:var(--text-dim);padding:4px 0;line-height:1.5}
.hl-val{font-weight:700;font-family:'JetBrains Mono',monospace}
```

### 3. Data card (click-to-chart)

```html
<div class="data-card" data-indicator="cpi">
  <div class="dc-head">
    <span class="dc-name">CPI YoY</span>
    <span class="dc-flag red">🔴</span>
  </div>
  <div class="dc-value mono">5.60<span class="dc-unit">%</span></div>
  <div class="dc-meta">
    <span>MoM <strong class="mono">+0.29%</strong></span>
    <span>YTD avg <strong class="mono">4.31%</strong></span>
  </div>
  <button class="dc-chart-btn" data-indicator="cpi">📊 Chart</button>
</div>
```

```css
.data-card{background:var(--card);border:1px solid var(--border);
  border-radius:16px;padding:16px;backdrop-filter:blur(12px);
  transition:transform .2s,border-color .2s}
.data-card:hover{transform:translateY(-2px);border-color:var(--border-hot)}
.dc-head{display:flex;justify-content:space-between;align-items:center}
.dc-name{font-size:13px;color:var(--text-dim);font-weight:600}
.dc-value{font-size:28px;font-weight:800;margin:6px 0}
.dc-unit{font-size:14px;color:var(--text-dim);font-weight:500;margin-left:2px}
.dc-meta{display:flex;gap:14px;font-size:11px;color:var(--text-faint)}
.dc-chart-btn{margin-top:10px;background:rgba(168,85,247,0.15);color:var(--purple);
  border:1px solid rgba(168,85,247,0.3);padding:5px 12px;border-radius:8px;
  font-size:11px;font-weight:600;cursor:pointer;transition:all .2s}
.dc-chart-btn:hover{background:rgba(168,85,247,0.3)}
```

---

## Click-to-chart pattern

**KHÔNG nhồi chart trực diện** — click `[📊]` mở modal với sparkline từ `history.json`:

```html
<div id="chartModal" class="modal">
  <div class="modal-content">
    <div class="modal-head">
      <h3 id="modalTitle">CPI YoY — Dữ liệu lịch sử</h3>
      <button class="modal-close">×</button>
    </div>
    <canvas id="modalChart" height="200"></canvas>
    <div class="modal-note" id="modalNote"></div>
  </div>
</div>
```

```js
let modalChart=null;
const MIN_POINTS_FOR_CHART=6;

// ẨN nút [📊] nếu history < 6 điểm — KHÔNG hiện nút khi thiếu data
document.querySelectorAll('.dc-chart-btn').forEach(btn=>{
  const key=btn.dataset.indicator;
  const series=history.series[key]||[];
  if(series.length<MIN_POINTS_FOR_CHART){
    btn.style.display='none';  // ẩn hoàn toàn
  }else{
    btn.addEventListener('click',()=>openModal(key));
  }
});

function openModal(key){
  // Modal chỉ mở khi đủ data — vẽ sparkline luôn, không cần check lại
  // ... (Chart.js render)
}
```

### Khi Cấp B chưa có data (history < 6 tháng)
- **ẨN hoàn toàn nút `[📊]`** — không show, không báo lỗi
- Lý do: tránh confusing UI (click rồi mới báo "chưa đủ")

### ⚠️ QUAN TRỌNG: Button phải tồn tại trong HTML, không phải "không tạo"

```html
<!-- ❌ SAI: không tạo button khi history <6 → khi đủ data sẽ KHÔNG có gì để unhide -->
<div class="data-card">...</div>

<!-- ✅ ĐÚNG: luôn tạo button cho card Cấp A, JS ẩn bằng display:none khi <6 -->
<div class="data-card">
  ...
  <button class="dc-chart-btn" data-indicator="cpi_yoy_pct">📊 Biểu đồ</button>
</div>
```

**Quy tắc**:
- **Lúc render** (Bước 4): luôn tạo `<button class="dc-chart-btn">` cho mọi card Cấp A (has_chart=true), bất kể history hiện có bao nhiêu điểm
- **Lúc runtime** (JS): check `history.series[key].length`, ẩn bằng `display:none` khi <6
- **Lý do**: khi skill chạy đủ 6+ kỳ, JS sẽ tự unhide (vì series.length >=6). Nếu không tạo button trước → sẽ phải sửa HTML thủ công mỗi lần → sai nguyên tắc "tự động"

**Cấp A indicators (BẮT BUỘC có button)**: cpi_yoy_pct, pmi, iip_yoy_pct, trade_balance_b_usd, exports_b_usd, interbank_on_pct, fx_central_vnd, govt_bond_10y_yield_pct, retail_yoy_pct, international_visitors_m (10 chỉ số)
- Khi history đủ 6+ tháng → nút tự xuất hiện ở kỳ báo cáo tiếp theo

### ⚠️ "Feature ngủ chờ data" — KHÔNG phải bug

Khi dashboard demo (history rỗng) hoặc skill mới chạy 1-5 kỳ → **toàn bộ nút `[📊]` bị ẩn**. Đây là hành vi ĐÚNG spec, không phải bug:

- **Nhận biết**: mở dashboard không thấy nút chart nào → kiểm tra `history.series[key].length` trong source HTML. Nếu tất cả <6 → feature đang ngủ
- **QA output**: script ghi `"X visible, Y hidden"`. Nếu visible=0 → feature ngủ, **KHÔNG** phải fail
- **Cách kích hoạt tự nhiên**: cứ chạy skill mỗi tháng, history tự append. Tháng thứ 6 trở đi → CPI/PMI (2 series đầu có 5 điểm + kỳ 6 = 6 điểm) → nút tự xuất hiện
- **KHÔNG seed data cũ** để ép nút hiện → vi phạm rule "không seed" (xem SKILL.md "History rules")

→ Nếu user báo "feature chart bị mất", đầu tiên check `history.series[key].length` trước khi fix gì.

---

## Chart.js setup

Copy pattern từ dashboard_template.html:

```js
Chart.defaults.color='#8b8ba7';
Chart.defaults.font.family="'Inter',sans-serif";
Chart.defaults.borderColor='rgba(139,92,246,0.08)';
const grad=(ctx,c1,c2)=>{
  const g=ctx.chart.ctx.createLinearGradient(0,0,0,280);
  g.addColorStop(0,c1);g.addColorStop(1,c2);return g;
};
```

### Gauge PMI (dùng cho PMI card nổi bật)

PMI có threshold 50 → dùng gauge hoặc line với annotation:

```js
new Chart(ctx,{
  type:'line',
  data:{labels:months,datasets:[{data:pmiValues,...}]},
  options:{
    plugins:{annotation:{annotations:{
      threshold:{type:'line',yMin:50,yMax:50,
        borderColor:'#fbbf24',borderWidth:2,borderDash:[6,4],
        label:{content:'50 = no change',display:true}}
    }}}
  }
});
```

---

## Verdict color mapping

| Verdict | Color | Use cho |
|---|---|---|
| `TRUNG TÍNH — CẢNH GIÁC` | `--amber` gradient | Verdict tổng báo cáo |
| `TÍCH CỰC` | `--green` gradient | Verdict tổng tích cực |
| `TIÊU CỰC` | `--red` gradient | Verdict tổng tiêu cực |

### Verdict badge (hero)

```html
<div class="verdict-badge" style="background:var(--amber);color:#000">
  ⚖️ TRUNG TÍNH — CẢNH GIÁC
</div>
<div class="verdict-reason">Phục hồi mạnh về LƯỢNG nhưng áp lực về GIÁ...</div>
```

### ⚠️ Hero `.report-sub` phải động theo số nguồn (KHÔNG hardcode "5 nguồn")

```html
<!-- ❌ SAI: hardcode "5 nguồn" dù partial -->
<div class="report-sub">... 5 nguồn: TCTK · Hải quan · S&P PMI · HTT Trái phiếu · HN Ngân hàng</div>

<!-- ✅ ĐÚNG: đổ theo số nguồn thực tế -->
<!-- Full run -->
<div class="report-sub">... 5/5 nguồn: TCTK · Hải quan · S&P PMI · HTT Trái phiếu · HN Ngân hàng</div>
<!-- Partial 3/5 -->
<div class="report-sub">... 3/5 nguồn: TCTK · S&P PMI · HTT Trái phiếu (tuần 22-26/6)</div>
```

**Quy tắc**: số nguồn + tên nguồn phải khớp với `_sources_coverage.available` trong report.json. Khi partial → thêm coverage-warn box ngay sau hero (1 dòng, không lặp trong từng group).

```css
.verdict-badge{display:inline-block;padding:8px 20px;border-radius:999px;
  font-weight:800;font-size:14px;letter-spacing:0.5px;margin-top:12px}
.verdict-reason{color:var(--text-dim);font-size:13px;margin-top:8px;line-height:1.6}
```

---

## Responsive

```css
@media (max-width:1100px){
  .highlights{grid-template-columns:1fr}
  .data-grid{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:600px){
  .container{padding:16px}
  .nav-tabs{flex-wrap:wrap;padding:8px 16px}
  .data-grid{grid-template-columns:1fr}
}
```

---

## Checklist render (verify sau khi fill data)

- [ ] Hero: 4 metric boxes hiển thị số đúng + flag đúng màu
- [ ] Verdict badge: đúng level + reason 1 dòng
- [ ] NAV: click **5 tab** chuyển section được, default = group1. Tab thứ 5 "Tổng hợp" chứa Rủi ro/Động lực/Key takeaways
- [ ] **Placement check**: Rủi ro/Động lực/Key takeaways NẰM TRONG `<section id="summary">` (KHÔNG đặt ngoài group-section — sẽ gây rò rỉ giữa các tab)
- [ ] Highlight boxes: mỗi nhóm có 🔴 + 🟢, 2-3 items mỗi bên
- [ ] Data cards: số đúng, MoM/YoY/YTD đầy đủ, flag đúng màu
- [ ] Click `[📊]`: modal mở, chart render (nếu đủ data). Nếu toàn bộ nút ẩn → check `history.series[key].length` (feature ngủ khi <6, không phải bug)
- [ ] Risks/Catalysts: level color-coded, sort theo level
- [ ] Key takeaways: 3 bullets, bullet #1 có ⭐
- [ ] Footer: nguồn link + disclaimer
- [ ] No JS console errors
- [ ] Responsive: mobile không vỡ layout
