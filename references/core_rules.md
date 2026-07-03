# Core Rules — 4 nguyên tắc bắt buộc khi extract & aggregate data vĩ mô

Áp dụng cho MỌI chỉ số trong báo cáo. Vi phạm 1 rule → báo cáo mất độ tin cậy. Load file này mỗi khi extract data từ 5 nguồn.

## Mục lục

- [Rule 1: Time Consistency](#rule-1-time-consistency--nhìn-lùi-không-nhìn-tới)
- [Rule 2: Frequency (monthly-only)](#rule-2-frequency--chỉ-monthly-bỏ-quý)
- [Rule 3: Conflict Resolution](#rule-3-conflict-resolution)
- [Rule 4: Unit Convention](#rule-4-unit-convention)

---

## Rule 1: Time Consistency — "NHÌN LÙI, KHÔNG NHÌN TỚI"

**Nguyên lý cốt lõi**: Mọi số liệu trong báo cáo tháng M phải có timestamp ≤ cuối ngày cuối cùng của tháng M. Không có ngoại lệ look-ahead.

### Định nghĩa

- **Reference Month (RM)** = tháng kinh tế được báo cáo (VD: báo cáo "tháng 5/2026" → RM = 2026-05)
- **Data Cutoff** = cuối ngày cuối cùng của RM (VD: 2026-05-31 23:59)

### Lọc theo từng nguồn

| Nguồn | Cách lọc | Lý do |
|---|---|---|
| PMI / NSO / Customs | Dùng nguyên — đã chốt cuối tháng | Survey/báo cáo tính tới cuối RM |
| VBMA (tuần) | **Chỉ lấy tuần có ngày KẾT THÚC ≤ cutoff**. Tuần nào kết thúc sang tháng sau → đẩy sang báo cáo tháng sau | Snapshot "kết tuần" luôn = ngày cuối tuần |
| VNBA (tháng) | **Chỉ lấy phần "tháng X"**. BỎ phần "tuần 1 tháng X+1" | VNBA cố tình gộp tuần đầu tháng sau cho data tươi → phá cross-check |

### Vì sao chọn chặt (Option A) cho VBMA tuần tràn tháng

VBMA là báo cáo tuần, mọi snapshot là "kết tuần" (giá trị ngày cuối tuần). Nếu tuần kết thúc 1/6 (VD tuần 28/5-1/6):
- Snapshot "kết tuần" = giá trị 1/6, KHÔNG phải 31/5
- PDF không có giá trị từng ngày → không có gì để lấy nếu lọc ≤ 31/5
- → Bỏ cả tuần là cách duy nhất sạch sẽ

### Đánh dấu timestamp trong JSON

```json
{
  "interbank_rate": {
    "definition": "Lãi suất LNH (snapshot cuối tháng 5)",
    "as_of_date": "2026-05-29",
    "as_of_note": "Snapshot cuối tuần VBMA nằm trọn trong tháng 5. Chậm 2 ngày so với month-end 31/5 (cuối tuần không giao dịch → xấp xỉ)."
  }
}
```

→ Mọi snapshot phải có `as_of_date`. Nếu trễ 2-4 ngày do cuối tuần → ghi `as_of_note` giải thích.

---

## Rule 2: Frequency — CHỈ monthly, BỎ quý

### Nguyên tắc

Báo cáo vn-macro-monthly = **nhất quán tháng**. Không pha trộn data quý vào data tháng.

### Vì sao (case study)

| Chỉ số | Vấn đề | Quyết định |
|---|---|---|
| PBT ngân hàng | Chỉ có theo quý → tháng 2/5/8/11 sẽ lặp số Q trước | ❌ **BỎ** khỏi scope |
| NIM ngân hàng | Chỉ có theo quý → không có data tháng | ❌ **BỎ** khỏi scope |

→ Scope tự động loại bỏ chỉ số không nhất quán tháng. Đây là cơ chế kiểm soát chất lượng built-in.

### Ngoại lệ cho snapshot Q

Một số snapshot Q được dùng làm **context** (không phải số chính), VD: "tín dụng theo ngành tính tới cuối Q1/2026". Cho phép NẾU:
- Đánh dấu rõ `_note`: "Snapshot Q1/2026 — context ngành, không phải số tháng"
- Không tính vào cross-check tháng

---

## Rule 3: Conflict Resolution

**4 nguyên tắc, áp theo thứ tự:**

### Nguyên tắc 3.1 — Primary Source Hierarchy

Khi cùng 1 chỉ số có nhiều nguồn, dùng primary theo bảng:

| Loại chỉ số | Primary | Secondary (cross-check) |
|---|---|---|
| CPI / Lạm phát | **NSO** | VNBA (cùng số NSO) |
| IIP / Sản xuất CN | **NSO** | S&P PMI Output (signal sớm) |
| XNK (chính thức) | **Customs** | NSO (sơ bộ) |
| FDI | **NSO** | Customs |
| Lãi suất / Tỷ giá | **VNBA** | VBMA (snapshot tuần) |
| Trái phiếu / Tín dụng | **VNBA + VBMA** (bổ sung nhau) | — |
| Vàng / Dầu / Hàng hóa TG | **VNBA** (tổng hợp Tradingeconomics) | — |
| Kinh tế TG (Mỹ/EU/Nhật) | **VNBA** | — |
| PMI | **S&P Global** (duy nhất) | — |
| Đăng ký DN | **NSO** | — |
| Khách quốc tế | **NSO** | — |

### Nguyên tắc 3.2 — Definition First (KIỂM CHỨNG ĐỊNH NGHĨA TRƯỚC)

**80% "xung đột" thực ra là khác định nghĩa, không phải sai dữ liệu.** Trước khi ghi số, phải xác định rõ định nghĩa.

**Case study CPI tháng 5/2026 (đã xảy ra thật):**

| Số | Định nghĩa | Nguồn |
|---|---|---|
| 0.29% | CPI **MoM** (tháng 5 vs tháng 4) | NSO |
| 5.60% | CPI **YoY** (tháng 5/2026 vs tháng 5/2025) | NSO + VNBA |
| 4.31% | CPI **YTD avg** (bình quân 5 tháng) | NSO |
| 4.67% | **Lạm phát cơ bản** YoY | NSO |

→ Tưởng NSO (3.24%) khác VNBA (5.60%) = xung đột. Thực ra cả 2 cùng số NSO = 5.60% YoY. Số 3.24% là **sai hoàn toàn** do LLM không đọc context.

**Quy tắc**: mỗi chỉ số phải có field `definition` rõ ràng. % phải tách 3 trường: `mom_pct` / `yoy_pct` / `ytd_avg_pct`. Không bao giờ gộp chung 1 con số.

### Nguyên tắc 3.3 — Acceptable Variance (internal-only)

> ⚠️ Rule này áp dụng **internal** (khi extract data, để resolve conflict giữa nguồn). KHÔNG hiển thị trong dashboard — section cross-check đã bị xóa (xem Changelog SKILL.md). Chỉ dùng để ghi `conflict_note` trong data card khi cần.

| Chênh lệch giữa nguồn | Hành động |
|---|---|
| **< 2%** | ✅ Bình thường (sơ bộ vs chính thức) → dùng primary |
| **2% - 5%** | 🟡 Ghi `conflict_note`, dùng primary |
| **> 5%** | 🔴 Ghi `conflict_flag`, **ghi cả 2 số** + lý do |

**Ví dụ**: Bán lẻ YoY — NSO 11.8% vs VNBA 11.2% → chênh ~5% → ghi primary NSO + `conflict_note`.

### Nguyên tắc 3.4 — When to show both

Chỉ ghi cả 2 số khi ĐỀU đúng:
1. Chênh > 5%
2. Hai nguồn có **định nghĩa rõ ràng khác nhau**

**Ví dụ**: Dư nợ tín dụng YTD — SBV 4.42% (tính tới 8/5) vs SSI 5.71% (cuối tháng 5) → khác base date → ghi cả 2 + note.

---

## Rule 4: Unit Convention

### Đuôi trường chuẩn (8 loại)

| Đuôi | Đơn vị | Ví dụ |
|---|---|---|
| `_b_vnd` | tỷ VND | 19400.5 (= 19,400.5 tỷ đ) |
| `_b_usd` | tỷ USD | 215.6 |
| `_vnd` | đồng VND (số nguyên) | 25139 (tỷ giá) |
| `_pct` | phần trăm (2 chữ số thập phân) | 5.60 |
| `_k` | nghìn (đơn vị) | 94.8 (nghìn DN) |
| `_m` | triệu (lượt/người) | 10.6 (triệu khách) |
| `usd_oz` | USD/ounce (vàng TG) | 4331 |
| `usd_bbl` | USD/thùng (dầu) | 90.54 |

### Quy tắc đặt tên

**Mỗi trường JSON phải kết thúc bằng đơn vị** → đọc tên là biết đơn vị ngay:

```json
// ✅ ĐÚNG
"cpi_yoy_pct": 5.60,
"exports_b_usd": 215.66,
"fx_central_vnd": 25139,
"gold_usd_oz": 4331

// ❌ SAI (không biết đơn vị)
"cpi": 5.60,
"exports": 215.66
```

### Tách % thành 3 trường

```json
"cpi": {
  "mom_pct": 0.29,      // MoM: tháng này vs tháng trước
  "yoy_pct": 5.60,      // YoY: tháng này vs cùng tháng năm trước
  "ytd_avg_pct": 4.31   // YTD avg: bình quân YTD vs cùng kỳ
}
```

→ Không bao giờ gộp MoM/YoY/YTD thành 1 con số.

### Format hiển thị HTML

- Tiền lớn: `25.139` (VND tỷ, dấu chục phân `.`) hoặc `$4.31B` (USD)
- Số nguyên VND: `25.139` (nghìn đồng, luôn có dấu phẩy nghìn)
- %: `5.60%` (2 chữ số thập phân, có dấu %)
- Dùng class `.mono` (JetBrains Mono, tabular-nums) cho mọi số
