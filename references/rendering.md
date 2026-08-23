# Rendering — Design pattern editorial cho vn-macro-monthly

Bản tin phân tích vĩ mô (macro briefing) — layout "text + graph minh họa", KHÔNG phải dashboard card. Self-contained single-file (CSS + JS inline, SVG vẽ tĩnh ngay trong HTML — in/PDF/offline đều được).

## ⚠️ CÁCH RENDER (BẮT BUỘC): chạy máy render, KHÔNG viết HTML tay

```bash
node scripts/render.js --json=2026-07/report.json --history=history.json --out=2026-07/report.html
```

- `report.json` = NỘI DUNG (model viết theo `data_cards.md`) · `assets/skin.css` + `assets/skin.js` = GIAO DIỆN (chỉ sửa khi đổi thiết kế)
- Group không có card VÀ không có lead → tab tự ẩn; summary trống → tự ẩn (NỘI DUNG QUYẾT ĐỊNH KHUNG)
- Nhóm có `lead` → render editorial (lead + graph + data_items); nhóm chỉ có `cards` → render schema card cũ (legacy, tương thích ngược)

## Mục lục

- [Layout tổng thể](#layout-tổng-thể)
- [Editorial: lead + graph + data_items](#editorial-lead--graph--data_items)
- [SVG bar / line (vẽ tĩnh, in được)](#svg-bar--line-vẽ-tĩnh-in-được)
- [NAV + Summary + Verdict](#nav--summary--verdict)
- [Style guide đồng bộ](#style-guide-đồng-bộ)
- [Responsive](#responsive)
- [Checklist render](#checklist-render)

---

## Layout tổng thể

```
┌─────────────────────────────────────────────────────────┐
│ HERO                                                     │
│  📊 BÁO CÁO VĨ MÔ VN · Tháng 7/2026                      │
│  Verdict badge (TÍCH CỰC — gradient) + reason            │
│  4 KPI boxes (CPI, PMI, XNK, IIP)                        │
├─────────────────────────────────────────────────────────┤
│ NAV (sticky top) — 7 tab (do JSON quyết định)            │
│ [Tăng trưởng] [Giá cả] [Ngoại thương] ... [📊 Tổng hợp]  │
├─────────────────────────────────────────────────────────┤
│ GROUP SECTION (mỗi nhóm, nội dung trong .ed-section):    │
│  header (tag + title + source_note)                      │
│  ┌───────────────────────────────────────┐               │
│  │ 📝 LEAD — đoạn dẫn 2-3 câu kể chuyện   │               │
│  │    số liệu màu cyan, <strong> màu tím │               │
│  ├───────────────────────────────────────┤               │
│  │ 📈 GRAPH — 1 biểu đồ SVG/nhóm          │               │
│  ├───────────────────────────────────────┤               │
│  │ DATA ITEMS — 3-5 dòng:                │               │
│  │  Tên chỉ số | số lớn màu | ghi chú     │               │
│  │  Tên chỉ số | số lớn màu | ghi chú     │               │
│  └───────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────┤
│ SECTION TỔNG HỢP (tab riêng)                             │
│  RISKS | CATALYSTS · KEY TAKEAWAYS (3 bullets ⭐)        │
├─────────────────────────────────────────────────────────┤
│ FOOTER (nguồn + disclaimer) — LUÔN hiện                  │
└─────────────────────────────────────────────────────────┘
```

### ⚠️ QUAN TRỌNG: Placement của Rủi ro/Động lực/Key takeaways

**Rủi ro + Động lực + Key takeaways PHẢI nằm trong `<section class="group-section" id="summary">`** — KHÔNG đặt ngoài group-section (JS nav ẩn/hiện theo class `group-section`; đặt ngoài → nội dung rò rỉ giữa các tab). Chỉ HERO, NAV, FOOTER đặt ngoài (luôn hiện).

### Bề rộng đọc (editorial)

`.ed-section` giới hạn **max-width 1120px, căn giữa** — chuẩn báo chí: dòng chữ không trải cả màn hình 1480px. Đây là CHỦ Ý (tư duy dashboard = trải kín màn hình), không phải lỗi.

## Editorial: lead + graph + data_items

### `.ed-lead` — đoạn dẫn

```css
.ed-lead{font-size:15px;line-height:1.85;padding:18px 22px;
  background:linear-gradient(135deg,rgba(6,182,212,0.07),rgba(168,85,247,0.04));
  border-left:3px solid var(--cyan);border-radius:10px}
.ed-lead .num{color:var(--cyan);font-weight:600;font-family:'JetBrains Mono',monospace}
.ed-lead strong{color:var(--purple)}
```

- Model viết lead với `<span class="num">` cho MỌI con số, `<strong>` cho ý nhấn mạnh
- 70-120 từ, ≥2 con số — máy verify bắt (WORD/QUALITY)

### `.ed-graph` — khung biểu đồ

```css
.ed-graph{background:var(--card);border:1px solid var(--border);border-radius:16px;
  padding:16px 18px;backdrop-filter:blur(12px)}
.ed-graph svg{width:100%;height:auto;display:block}
```

- Render.js sinh `<div class="ed-graph"><div class="ed-graph-title">📈 …</div>{SVG}</div>` khi JSON có `graph`
- SVG **vẽ tĩnh ngay lúc render** — không cần JS, in/PDF/offline đều hiện
- Graph rỗng/không vẽ được (line <2 điểm) → cả khối `.ed-graph` TỰ ẨN (không để khung trống)

### `.ed-items` / `.ed-item` — dòng dữ liệu

```css
.ed-items{display:grid;grid-template-columns:1fr;gap:8px}   /* 1 cột — tránh lỗ hổng khi lẻ item */
.ed-item{display:grid;grid-template-columns:230px 150px 1fr;align-items:baseline;gap:14px;
  padding:11px 16px;background:var(--card);border:1px solid var(--border);border-radius:12px}
.ed-item .ed-name{font-size:13px;color:var(--text-dim);font-weight:600}
.ed-item .ed-value{font-size:21px;font-weight:800;font-family:'JetBrains Mono',monospace}
.ed-item .ed-note{font-size:12px;color:var(--text-faint);line-height:1.5}
```

- 3 vùng ngang: tên (230px) | số lớn (150px, màu theo `signal`: pos xanh / neg đỏ / neu vàng) | ghi chú (chiếm phần còn lại)
- **1 cột cố định** (không 2 cột) — nhóm 5 items lẻ sẽ có lỗ hổng ở cột 2, đúng tinh thần "không khoảng trống chết"
- Hover đổi viền (border-hot) — gợi ý tương tác nhẹ

## SVG bar / line (vẽ tĩnh, in được)

Máy render vẽ — model chỉ khai báo trong JSON. Spec đồng bộ `render.js`:

### Bar (`barGraphSVG`, viewBox 560×150)

- Đường 0 đứt nét ngang (rgba tím 0.25) — mọi cột neo theo đường 0
- Cột: bo góc rx=4, opacity 0.85; màu theo `color`: `pos` #10d98a · `neg` #ff4d6d · `target` #fbbf24 · thiếu = #a855f7
- Giá trị âm → cột vẽ XUỐNG dưới đường 0
- Nhãn dưới cột (xám) + giá trị trên cột (mono, có dấu +/-, màu theo cột)
- Scale tự động: max = giá trị lớn nhất ×1.12 (chừa chỗ nhãn)

### Line (`lineGraphSVG`, viewBox 560×150)

- **≥2 điểm mới vẽ** — 1 điểm (kỳ đầu) → trả về rỗng → cả graph ẩn (feature ngủ chờ data)
- Fill vùng dưới đường (xanh/đỏ 12% theo hướng) + polyline 2.4px + chấm tròn điểm cuối
- Nhãn tháng dưới trục (`month.slice(5)` → "07")
- Xanh nếu điểm cuối ≥ điểm đầu, đỏ nếu ngược

**Feature ngủ chờ data (KHÔNG phải bug)**: history mới 1 kỳ → line graph không hiện. Nhận biết: check `history.series[key]` có ≥2 entry không. Cách kích hoạt: chạy skill thêm kỳ. Kỳ đầu → dùng bar thay thế.

## NAV + Summary + Verdict

### NAV tab (sticky)

```css
.nav-tabs{position:sticky;top:0;z-index:50;display:flex;gap:8px;flex-wrap:wrap;
  background:rgba(10,10,20,0.85);backdrop-filter:blur(20px);
  padding:12px 32px;border-bottom:1px solid var(--border);margin:0 -32px 24px}
.nav-tab.active{background:var(--grad-main);color:#fff;box-shadow:0 4px 16px rgba(168,85,247,0.4)}
```

- Số tab = số nhóm có nội dung + "📊 Tổng hợp" (nếu có risks/catalysts/takeaways) — render.js tự đếm, model KHÔNG hardcode
- Click → show đúng section, chỉ 1 active tại 1 thời điểm
- Nhóm đầu có nội dung = active mặc định

### Summary (Risks/Catalysts/Takeaways)

- `rc-box.risks` / `rc-box.catalysts` 2 cột; `takeaways` 3 bullets, bullet #1 ⭐
- Level color-coded: Rất cao = red · Cao = amber · Trung bình = xanh/xám

### Verdict color mapping

| Verdict | Màu |
|---|---|
| `TÍCH CỰC` | `--green` |
| `TRUNG TÍNH — CẢNH GIÁC` | `--amber` |
| `TIÊU CỰC` | `--red` |

Verdict phải khớp màu với phần lớn số liệu. `verdict_reason` nêu rõ điểm mạnh + điểm trừ + ghi chú partial (nếu có).

### Hero `.report-sub` động theo số nguồn

Render.js tự đổ `X/5 nguồn: tên các nguồn` từ `_sources_coverage.available` — model KHÔNG hardcode "5 nguồn". Partial → render.js tự thêm coverage-warn 1 dòng (model không viết tay).

## Style guide đồng bộ

Copy CHÍNH XÁC CSS variables từ `assets/skin.css` (KHÔNG sáng tạo palette mới):

```css
:root{
  --bg-0:#0a0a14; --bg-1:#10101f; --bg-2:#16162a;
  --card:rgba(28,28,48,0.55); --card-solid:#1a1a2e;
  --border:rgba(139,92,246,0.18); --border-hot:rgba(236,72,153,0.35);
  --text:#f0f0ff; --text-dim:#8b8ba7; --text-faint:#5a5a72;
  --purple:#a855f7; --purple-2:#8b5cf6; --pink:#ec4899; --cyan:#06b6d4;
  --green:#10d98a; --green-soft:rgba(16,217,138,0.15);
  --red:#ff4d6d; --red-soft:rgba(255,77,109,0.15); --amber:#fbbf24;
}
```

- `Inter` cho text, `JetBrains Mono` (tabular-nums) cho MỌI số
- Class màu: `.pos` → green · `.neg` → red · `.neu` → amber
- Không dùng ảnh URL ngoài (Unsplash...) — gradient local, offline-first

**skin.js tự làm** (model không cần): số đếm tăng dần khi load · mũi tên ▲▼ màu vào số có dấu +/− · count-up KPI · tôn trọng `prefers-reduced-motion`. Offline: mọi thứ có sẵn trong file HTML (không gọi CDN bắt buộc).

## Responsive

```css
@media (max-width:900px){
  .ed-item{grid-template-columns:1fr 1fr}      /* name + value 1 hàng */
  .ed-item .ed-note{grid-column:1 / -1}        /* note xuống cả dòng */
}
@media (max-width:600px){
  .container{padding:16px}
  .nav-tabs{flex-wrap:wrap;padding:8px 16px}
  .ed-item{grid-template-columns:1fr}
}
```

## Checklist render

Sau khi chạy `render.js`, kiểm tra (hoặc chạy `qa_report.js` tự động):

- [ ] Hero: verdict badge đúng màu + 4 KPI + `.report-sub` hiện "X/5 nguồn" thật
- [ ] NAV: số tab khớp số nhóm CÓ nội dung (+ Tổng hợp); group1 active mặc định
- [ ] Mỗi nhóm editorial: lead + graph + 3-5 data_items; KHÔNG còn `.data-card` ở nhóm mới
- [ ] Graph: mỗi nhóm ≤1 SVG bar/line; SVG không tràn khung; line 1 điểm → tự ẩn (feature ngủ)
- [ ] `.ed-section` nằm trong bề rộng ~1120px (không trải 1480px)
- [ ] Data items: 3 vùng ngang (tên/số/ghi chú) không vỡ; số màu theo signal; note ≤1 dòng
- [ ] **Placement**: Rủi ro/Động lực/Key takeaways NẰM TRONG `<section id="summary">`
- [ ] Takeaways: 3 bullets, #1 có ⭐
- [ ] Footer: nguồn + disclaimer (partial → thêm dòng cảnh báo tự động)
- [ ] No JS console errors · responsive mobile không vỡ
