# Data Cards — Schema + mapping 41 chỉ số vào 4 nhóm

Mỗi chỉ số = 1 Data Card theo schema thống nhất. Tổng 41 chỉ số chia 4 nhóm, priority giảm dần trong mỗi nhóm.

## Mục lục

- [Data Card schema](#data-card-schema)
- [Nguyên tắc KHÔNG placeholder (BẮT BUỘC)](#nguyên-tắc-không-placeholder-bắt-buộc)
- [Nhóm 1 — Kinh tế thực (14)](#nhóm-1--kinh-tế-thực-14-chỉ-số)
- [Nhóm 2 — Tiền tệ & Tài chính (12)](#nhóm-2--tiền-tệ--tài-chính-12-chỉ-số)
- [Nhóm 3 — Ngành & Cơ cấu (5)](#nhóm-3--ngành--cơ-cấu-5-chỉ-số)
- [Nhóm 4 — Bối cảnh toàn cầu (10)](#nhóm-4--bối-cảnh-toàn-cầu-10-chỉ-số)
- [Risks / Catalysts / Key-takeaways template](#risks--catalysts--key-takeaways-template)

---

## Data Card schema

**MỌI chỉ số chính tuân theo 15 trường** (để card HTML dày thông tin):

```json
{
  "{indicator_key}": {
    "name_vi": "Tên tiếng Việt",
    "definition": "Định nghĩa rõ ràng (nguyên tắc Kiểm chứng định nghĩa trước)",
    "value": 5.60,
    "unit": "%",
    "comparisons": {
      "mom_pct": 0.29,
      "yoy_pct": 5.60,
      "ytd_avg_pct": 4.31
    },
    "target": 4.5,
    "target_status": "VƯỢT +1.10đđ",
    "prev_month_yoy_pct": 5.46,
    "progress_to_target_pct": 124,
    "source_primary": "NSO",
    "source_secondary": ["VNBA"],
    "signal": "TÍCH CỰC|TRUNG TÍNH|TIÊU CỰC",
    "why_it_matters": "1-2 câu phân tích: vì sao chỉ số này quan trọng cho quyết định đầu tư",
    "drivers": ["yếu tố đẩy 1", "yếu tố đẩy 2"],
    "conflict_note": "(optional) khi 2 nguồn chênh >2%",
    "has_chart": true,
    "monthly_trend": [{"month":"T1","yoy_pct":21.5}, ...]
  }
}
```

### Trường bắt buộc vs tùy chọn

| Trường | Bắt buộc | Khi nào thêm |
|---|---|---|
| `name_vi`, `value`, `unit`, `signal`, `source_primary` | ✅ Luôn | — |
| `definition`, `comparisons`, `why_it_matters` | ✅ Luôn (cho card dày) | — |
| `target`, `target_status`, `progress_to_target_pct` | ⚠️ Có target | CPI 4.5%, PMI 50, lãi suất,... |
| `prev_month_yoy_pct` | ⚠️ Có data tháng trước | để hiển thị "so tháng trước" |
| `drivers` | ⚠️ Chỉ số composite | Xem bảng "drivers rule" bên dưới |

#### drivers rule (rõ ràng)

| Loại chỉ số | `drivers` | Lý do | Ví dụ |
|---|---|---|---|
| **Composite** (tổng của nhiều thành phần) | ✅ **BẮT BUỘC** | Cần giải thích vì sao tăng/giảm | CPI (10 nhóm hàng), IIP (4 ngành), XNK (FDI vs nội địa), FDI (ngành) |
| **Đơn lẻ** (1 con số, không phân rã hữu ích) | ⚠️ TÙY CHỌN | Ít insight từ drivers | Tỷ giá, LNH (1 kỳ hạn), PMI headline |
| **Panel/bảng** | ❌ KHÔNG | Đã có bảng rồi | yield_curve, pmi_sub_indices |

→ Composite = chỉ số mà NSO/Customs công bố kèm phân rã thành phần. Nếu không có phân rã → coi như đơn lẻ.
| `conflict_note` | ⚠️ Khi 2 nguồn chênh >2% | theo nguyên tắc 3.3 |
| `monthly_trend` | ⚠️ Khi có data 3+ tháng | vẽ sparkline nhỏ trong card |
| `news_enrichment` | ⚠️ Khi có tin chất lượng | 1-2 tin/card, xem `references/news_sources.md` |
| `has_chart` | ✅ Luôn | Cấp A → true |

### Narrative (kể chuyện số liệu) — quan trọng nhất cho chất lượng

`why_it_matters` chỉ 1 câu ngắn. `narrative` là **2-4 câu kể chuyện** — kết nối số liệu này với số liệu khác, cho thấy vì sao quan trọng.

**Quy tắc tone — "Người kể chuyện số liệu, không phải người cho ý kiến"**:

| ❌ Tránh (cho ý kiến) | ✅ Làm (kể chuyện số liệu) |
|---|---|
| "CPI vượt target → NHNN sẽ phải siết tiền tệ" | "CPI YoY 5.60% đã đứng trên mục tiêu 4.5% tháng thứ 2 liên tiếp, cùng lúc PMI Input Costs đạt đỉnh 15 năm — hai con số này cùng kể câu chuyện lạm phát chi phí." |
| "Cổ phiếu ngân hàng sẽ giảm" | "LNH ON tăng từ 4.2% lên 7.0% trong khi lãi suất cho vay bị kiểm soát — khoảng cách 2 đầu cho thấy NIM bị nén." |
| "Tôi dự báo Q3 sẽ khó khăn" | "FDI thực hiện +9.6% YoY nhưng nhập siêu 13.8 tỷ — một bên là vốn đến, một bên là nguyên liệu nhập, hai số này định hình cán cân vĩ mô H2." |

**Quy tắc 4 ĐỪNG**:
1. **ĐỪNG** dùng "tôi nghĩ", "có thể", "dự báo" → dùng "số liệu cho thấy", "cùng lúc"
2. **ĐỪNG** khuyên mua/bán/khuyến nghị → chỉ kể diễn biến số
3. **ĐỪNG** dùng tính từ cảm tính ("đáng lo", "tích cực") → dùng số so sánh ("+99.1%", "đỉnh 15 năm")
4. **ĐỪNG** kết luận định hướng → mở câu hỏi cho người đọc ("điều này có ý nghĩa gì cho...")

**Cấu trúc narrative 2-4 câu (template)**:
```
[1] Khai báo con số + bối cảnh: "X = Y, so với Z cùng kỳ..."
[2] Kết nối với 1-2 số khác: "Cùng lúc, W cũng... — hai con số này cùng chỉ ra..."
[3] Ý nghĩa kinh tế (không định hướng): "Điều này có nghĩa là... / phản ánh... / là tín hiệu của..."
[4] (optional) Mở câu hỏi hoặc forward: "Điều đáng theo dõi tiếp theo là... / tháng tới sẽ check..."
```

**Ví dụ narrative cho CPI**:
```json
"narrative": "CPI YoY 5.60% đã đứng trên mục tiêu Quốc hội 4.5% tháng thứ 2 liên tiếp (T4: 5.46%, T5: 5.60%). Cùng lúc PMI Input Costs đạt đỉnh 15 năm (từ 4/2011) — hai con số này cùng kể câu chuyện lạm phát chi phí đầu vào đang truyền vào giá tiêu dùng. Lạm phát cơ bản 4.67% (loại năng lượng + thực phẩm) cho thấy áp lực lan rộng, không chỉ từ giá dầu."
```

### News enrichment (tùy chọn, làm phong phú card)

Sau khi data chính xong, WebSearch tin báo chí trong tháng báo cáo để enrich. Mỗi tin theo schema:

```json
"news_enrichment": [
  {
    "headline": "CPI tháng 5 tăng 0,29%: Giá điện, nước và xăng dầu tác động lớn",
    "source": "VnEconomy",
    "source_url": "https://vneconomy.vn/...",
    "published_date": "2026-06-03",
    "expert_quote": {"author": "TS. Nguyễn Trí Hiếu", "role": "Chuyên gia", "text": "..."},
    "key_insight": "1 câu chắt nhất (KHÔNG copy tiêu đề)",
    "sentiment": "TIÊU CỰC",
    "relevance": "GIẢI THÍCH vì sao CPI tăng"
  }
]
```

**Quy tắc**:
- Chỉ dùng tin publish ≤ data_cutoff (Time Rule)
- Tối đa **2 tin / card** (không spam)
- Ưu tiên tin có **quote chuyên gia** hoặc **số liệu so sánh**
- **KHÔNG** dùng số liệu báo chí thay số liệu chính thức — enrich chỉ bổ sung context
- Nếu không có tin chất lượng → KHÔNG enrich (thà trống hơn tin rác)
- Chi tiết nguồn + filter: xem `references/news_sources.md`

## Panel schema (loại đặc biệt)

Ngoài Data Card, có **10 panel phân tích chuyên sâu**. Mỗi panel có `_type` để HTML biết render đúng format:

| `_type` | Mô tả | Dùng cho |
|---|---|---|
| `panel_breakdown` | Phân rã 1 chỉ số thành phần con | CPI theo 10 nhóm hàng |
| `panel_pmi_gauge` | PMI sub-indices dạng gauge/bullet | 8 sub-indices PMI |
| `panel_trade_markets` | Top thị trường XNK | TQ, US, EU, ASEAN |
| `panel_rate_by_bank` | Lãi suất từng ngân hàng | Big4 vs NHTM cổ phần |
| `panel_yield_curve` | Yield curve theo kỳ hạn | TPCP 1Y/5Y/10Y |
| `panel_commodities` | Bảng giá hàng hóa | vàng, dầu, thép, cà phê... |
| `panel_global_growth` | Dự báo tăng trưởng toàn cầu | OECD, UN, WEF |
| `panel_central_banks` | Bảng NHTW các nước | Fed, ECB, BOJ, PBOC |
| `panel_global_markets` | Bảng chỉ số CK toàn cầu | S&P, Nikkei, DAX... |

Mỗi panel có `_panel_note` mô tả + data riêng (VD `big4`, `joint_stock` cho panel_rate_by_bank).

### Quy tắc signal
- 🟢 **TÍCH CỰC** = tốt (trong mục tiêu / xu hướng tốt)
- 🟡 **TRUNG TÍNH** = cần theo dõi
- 🔴 **TIÊU CỰC** = xấu (vượt mục tiêu / xu hướng xấu)

> Giá trị JSON: `"TÍCH CỰC"` / `"TRUNG TÍNH"` / `"TIÊU CỰC"`. CSS class tương ứng giữ English (`signal-green/amber/red`) vì là internal name.

### Quy tắc has_chart
- `true` cho Cấp A (10 chỉ số có historical): CPI, IIP, PMI, XNK, tỷ giá, vàng, dầu, TPCP yield, VN-Index, FDI
- `false` cho Cấp B (ban đầu)
- **Quy tắc hiển thị**: nút `[📊]` **chỉ hiện** khi `history.json` có ≥6 điểm dữ liệu. Chưa đủ → **ẩn nút hoàn toàn** (không hiện, không báo lỗi)

### Phân biệt `has_chart` (intent) vs runtime visible

| Khái niệm | Ý nghĩa | Khi nào quyết định |
|---|---|---|
| **`has_chart`** (JSON field) | **Intent** — chỉ số này CÓ ý nghĩa theo thời gian, sẽ có chart khi đủ data | Khi thiết kế data card (1 lần) |
| **Nút visible** (runtime) | Nút `[📊]` thực sự hiển thị trên dashboard | `history.series[key].length >= 6` (tự động theo số kỳ đã chạy) |

→ `has_chart: true` **KHÔNG đảm bảo nút hiện**. Chỉ số có `has_chart: true` nhưng history <6 kỳ → nút vẫn ẩn (feature ngủ chờ data). Khi skill chạy đủ 6+ kỳ → nút tự xuất hiện ở kỳ tiếp theo, không cần sửa JSON.

### Tier values
- `group1_real_economy` — Nhóm 1
- `group2_financial` — Nhóm 2
- `group3_sector` — Nhóm 3
- `group4_global_context` — Nhóm 4

---

## Nguyên tắc KHÔNG placeholder (BẮT BUỘC)

**Chỉ tạo data card khi CÓ số liệu thật trace được tới file `sources_cache/`. Không tạo khung/card/section cho phần thiếu dữ liệu.**

### Quy tắc

| Tình huống | Hành động |
|---|---|
| Có số liệu (primary hoặc secondary source) | ✅ Tạo data card bình thường |
| Thiếu số liệu (nguồn chưa publish / không có trong cache) | ❌ **BỎ QUA** — không tạo card |
| Chỉ có định nghĩa/sơ bộ/không trace được | ❌ **BỎ QUA** — không tạo card |

### 4 ĐỪNG khi thiếu dữ liệu

1. **ĐỪNG** tạo `missing-card` / placeholder box trong HTML:
   ```html
   <!-- ❌ SAI -->
   <div class="missing-card">
     <div class="mc-icon">📋</div>
     <div class="mc-title">US 10Y yield · ECB · BOJ</div>
     <div class="mc-reason">THIẾU VNBA — sẽ có khi publish...</div>
   </div>

   <!-- ✅ ĐÚNG: không có gì cả — bỏ hẳn card này khỏi grid -->
   ```

2. **ĐỪNG** tạo entry `_status: "THIẾU"` trong `report.json`:
   ```json
   // ❌ SAI — JSON không cần khai báo cái không có
   "deposit_rate": {"_status": "THIẾU", "_note": "cần VNBA"},
   "lending_rate": {"_status": "THIẾU", "_note": "cần VNBA"}

   // ✅ ĐÚNG: không có field deposit_rate/lending_rate trong JSON kỳ này
   ```

3. **ĐỪNG** để slot trống trong grid (gây vỡ UI):
   - Grid `data-grid` phải đầy đủ card thực. Không có "ô trống" chờ dữ liệu.

4. **ĐỪNG** giải thích dài trong dashboard về việc thiếu:
   - Chỉ **1 dòng** `coverage-warn` ở hero nếu chạy partial (3/5 nguồn).
   - KHÔNG lặp warning trong từng group section.

### Ngoại lệ DUY NHẤT — coverage warning ở hero

Khi chạy partial (< 5 nguồn), tạo **1 dòng duy nhất** ở đầu báo cáo:

```html
<div class="coverage-warn">
  <div class="cw-icon">⚠️</div>
  <div class="cw-text">
    <strong>Báo cáo dùng 3/5 nguồn theo yêu cầu người dùng.</strong>
    Thiếu Customs (XNK cả tháng, dự kiến 06/07) + VNBA monthly (lịch ~11-12/07).
    Khuyến nghị: chạy lại sau 15/07/2026 khi đủ 5 nguồn.
  </div>
</div>
```

→ Chỉ 1 dòng này, KHÔNG lặp lại trong group sections.

### Checklist trước khi render

Trước khi fill data vào template, kiểm tra mỗi card dự kiến:

- [ ] Có số liệu trace được tới file cụ thể trong `sources_cache/` không?
- [ ] Nguồn đã publish trong khoảng time rule (≤ data_cutoff)?
- [ ] Số liệu có definition rõ ràng (không mơ hồ)?

→ Nếu bất kỳ câu nào = KHÔNG → **bỏ card**, không tạo placeholder.

### Tại sao

| Vấn đề placeholder | Hậu quả |
|---|---|
| Dashboard nặng | Người đọc mệt vì nhiều box "THIẾU" không có giá trị |
| Trông như báo cáo lỗi | User tưởng skill hỏng, không phải "chưa đủ data" |
| Vô nghĩa trong JSON | `_status: "THIẾU"` không add gì — chỉ là noise |
| Lặp code | Mỗi missing-card = code riêng, maintain tốn công |

→ **Người đọc không cần biết dashboard đáng lẽ có gì, chỉ cần biết dashboard CÓ gì.** Khi nguồn bổ sung publish → chạy lại skill → card tự xuất hiện tự nhiên.

---

## Nhóm 1 — Kinh tế thực (14 chỉ số)

*Động lực tăng trưởng, lạm phát, thương mại. **Mặc định hiển thị khi mở báo cáo**.*

| Priority | Indicator key | Primary | Lý do priority |
|---|---|---|---|
| 1 | `cpi` | NSO | #1 market mover, target 4.5% |
| 2 | `pmi_manufacturing` | S&P | Tín hiệu sớm nhất |
| 3 | `iip` | NSO | Sản xuất chính thức |
| 4 | `trade_balance` | Customs | Cán cân vĩ mô |
| 5 | `exports` | Customs | Động lực ngoại thương |
| 6 | `imports` | Customs | Cầu nội địa |
| 7 | `fdi_disbursed` | NSO | Vốn thực đến |
| 8 | `fdi_registered` | NSO | Độ hấp dẫn tương lai |
| 9 | `retail` | NSO | Tiêu dùng nội địa |
| 10 | `business_new` | NSO | Độ tin tưởng |
| 11 | `business_exited` | NSO | Áp lực kinh doanh |
| 12 | `international_visitors` | NSO | Dịch vụ/du lịch |
| 13 | `state_investment` | NSO | Tài khóa |
| 14 | `state_budget` | NSO | Health tài khóa |

**Highlight mẫu (tháng 5/2026)**:
- 🟢 Tích cực: IIP +8.8% YoY (cao nhất 4 năm) · FDI disbursed +9.6% (cao nhất 5 năm) · PMI 52.8
- 🔴 Tiêu cực: CPI 5.60% VƯỢT target 4.5% · Trade balance ĐẢO chiều -13.8 tỷ · DN giải thể +99.1%

---

## Nhóm 2 — Tiền tệ & Tài chính (12 chỉ số)

*Thanh khoản, lãi suất, tỷ giá, trái phiếu, CK.*

| Priority | Indicator key | Primary | Lý do priority |
|---|---|---|---|
| 1 | `interbank_rate` | VNBA | Thanh khoản hệ thống |
| 2 | `fx_central_rate` | VNBA | Chính sách NHNN |
| 3 | `stock_market` (VN-Index) | VNBA | Sentiment thị trường |
| 4 | `govt_bond_yield` | VNBA+VBMA | Benchmark vay |
| 5 | `gold_world` | VNBA | Safe haven + lạm phát |
| 6 | `credit` | VNBA | Hệ thống NH |
| 7 | `deposit_rate` | VNBA | Chi phí vốn |
| 8 | `lending_rate` | VNBA | Chi phí đi vay |
| 9 | `fx_free_rate` | VNBA | Thực tế thị trường |
| 10 | `dxy` | VNBA | Áp lực USD |
| 11 | `corporate_bond_issuance` | VNBA+VBMA | Thanh khoản DN |
| 12 | `govt_bond_issuance` | VBMA | Huy động NSNN |

**Highlight mẫu (tháng 5/2026)**:
- 🟢 Tích cực: VN-Index +25% YoY · TPCP khối ngoại mua ròng (đảo chiều)
- 🔴 Tiêu cực: LNH ON 7.0% (từ 4.2% đầu tháng, leo thang) · NIM bị ép 2 đầu · TPDN đáo hạn 141.9K tỷ (52% BĐS)

---

## Nhóm 3 — Ngành & Cơ cấu (5 chỉ số)

*Phân tích sâu cơ cấu thương mại + sản xuất.*

| Priority | Indicator key | Primary | Lý do priority |
|---|---|---|---|
| 1 | `pmi_sub_indices` | S&P | Chi tiết sức khỏe CN (Output, NewOrders, InputCosts, Employment, OutputPrices) |
| 2 | `trade_by_sector` | Customs | XNK FDI vs nội địa |
| 3 | `trade_by_market` | Customs | Top thị trường (TQ/US/EU) |
| 4 | `trade_by_commodity` | Customs | Số mặt hàng >1 tỷ USD |
| 5 | `fdi_by_sector` | NSO | Ngành thu hút FDI |

**Highlight mẫu (tháng 5/2026)**:
- 🟢 Tích cực: 24 mặt hàng XK >1 tỷ USD (đa dạng hóa) · PMI NewOrders rebound mạnh
- 🔴 Tiêu cực: PMI InputCosts đỉnh 15 NĂM (từ 4/2011) · Nhập từ TQ +33.6% (phụ thuộc nguyên liệu)

---

## Nhóm 4 — Bối cảnh toàn cầu (10 chỉ số)

*Bối cảnh để định vị VN trong thế giới.*

| Priority | Indicator key | Primary | Lý do priority |
|---|---|---|---|
| 1 | `fed_policy` | VNBA | Ảnh hưởng dòng vốn VN |
| 2 | `us_economy` | VNBA | Nền kinh tế #1 |
| 3 | `oil_prices` | VNBA | Cú sốc năng lượng |
| 4 | `geopolitical_risk` | VNBA | Cú sốc cung |
| 5 | `us_10y_yield` | VNBA | Benchmark toàn cầu |
| 6 | `ecb_eurozone` | VNBA | Đối tác thương mại |
| 7 | `boj_japan` | VNBA | Tín hiệu châu Á |
| 8 | `china_economy` | VNBA | Đối tác XNK lớn nhất |
| 9 | `policy_actions_vn` | VNBA | TT/CV NHNN tháng |
| 10 | `agriculture_snapshot` | NSO | Khu vực I context |

**Highlight mẫu (tháng 5/2026)**:
- 🟢 Tích cực: Fed giữ 3.50-3.75% (không tăng thêm) · TT 08/2026 nới LDR cho Big4
- 🔴 Tiêu cực: Stagflation toàn cầu (Hormuz phong tỏa) · Brent 92 USD · 10Y US yield 4.52%

---

## Risks / Catalysts / Key-takeaways template

## Risks / Catalysts / Key-takeaways template

### Risks (rủi ro)

```json
"risks": [
  {"level": "Rất cao", "risk": "Mô tả rủi ro + số liệu"},
  {"level": "Cao", "risk": "..."},
  {"level": "Trung bình", "risk": "..."}
]
```

Sắp 3-5 items, level cao nhất lên đầu.

### Catalysts (động lực tích cực)

```json
"catalysts": [
  {"level": "Cao", "catalyst": "Mô tả + số liệu"},
  {"level": "Trung bình", "catalyst": "..."}
]
```

### Key takeaways (3 bullets)

```json
"key_takeaways": [
  "⭐ Insight tổng hợp (1 câu chốt nhất)",
  "Rủi ro lớn nhất cho tháng tiếp theo",
  "Động lực tích cực lớn nhất"
]
```

→ Luôn bắt đầu bullet #1 bằng ⭐ để highlight insight chính.
