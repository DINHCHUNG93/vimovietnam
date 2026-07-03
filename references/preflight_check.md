# Pre-flight Check — Kiểm tra tính toàn vẹn 5 nguồn

**Bước ĐẦU TIÊN và BẮT BUỘC** trước khi làm báo cáo. Nếu thiếu bất kỳ nguồn nào → DỪNG, không làm partial report.

## Mục lục

- [Workflow](#workflow)
- [Cách check từng nguồn](#cách-check-từng-nguồn)
- [Lịch release dự kiến](#lịch-release-dự-kiện)
- [Output sample](#output-sample)
- [All-or-nothing rule](#all-or-nothing-rule)

---

## Workflow

```
User kích hoạt: /vn-macro-monthly 2026-05
        ↓
[PRE-FLIGHT CHECK] — WebSearch check 5 nguồn
        ↓
   ┌────┴────┐
   ↓         ↓
 ĐỦ 5/5   THIẾU
   ↓         ↓
 TIẾP TỤC  DỪNG + báo thiếu + đề xuất ngày thử lại
 (Bước 2:  (KHÔNG tạo thư mục cache → máy sạch)
  Fetch)
```

---

## Cách check từng nguồn

### PMI (S&P Global)
```
WebSearch: "Vietnam Manufacturing PMI" [tháng tiếng Anh] [YYYY] site:pmi.spglobal.com
```
- ✅ Pass: có link `pmi.spglobal.com/Public/Home/PressRelease/[hash]`
- ❌ Fail: không có kết quả → PMI chưa release

### NSO
```
WebSearch: nso.gov.vn "báo cáo tình hình kinh tế xã hội" tháng [M] [Y]
```
- ✅ Pass: có link `nso.gov.vn/bai-top/{YYYY}/{MM}/...`
- ❌ Fail: link không tồn tại → NSO chưa publish (lịch: mùng 3 tháng M+1)

### Customs
```
WebSearch: customs.gov.vn tkId "tháng [M] [Y]" xuất nhập khẩu
```
- ✅ Pass: có `customs.gov.vn/index.jsp?pageId=4967&tkId=XXXX` hoặc bài secondary source (VnEconomy/Báo CP)
- ❌ Fail: không có tkId mới → Customs chưa release (lịch: ~10/M+1)

### VBMA
```
WebSearch: vbma.org.vn "BAO CAO TUAN TTP" [tuần cuối tháng M]
```
- ✅ Pass: có link PDF `vbma.org.vn/storage/reports/...`
- ❌ Fail: không có tuần cuối tháng → VBMA chưa publish tuần đó

### VNBA
```
WebSearch: vnba.org.vn "thông tin kinh tế tài chính" tháng [M] và tuần 1 tháng [M+1] [Y]
```
- ✅ Pass: có link trang tin `vnba.org.vn/vi/ban-tin-...-[id].htm`
- ❌ Fail: không có → VNBA chưa publish (lịch: ~11/M+1)

---

## Lịch release dự kiến

Bảng dùng để **đề xuất ngày thử lại** khi bị DỪNG:

| Nguồn | Ngày release cố định (tháng M+1) | Buffer an toàn |
|---|---|---|
| PMI | **mùng 1** (embargo 0730 ICT) | mùng 2 |
| NSO | **mùng 3** | mùng 4 |
| VBMA (tuần cuối M) | **mùng 3-5** | mùng 6 |
| Customs | **mùng 10-15** | mùng 15 |
| VNBA | **mùng 11-12** | mùng 13 |

→ **Ngày an toàn nhất để pre-flight pass 5/5**: sau **mùng 15 tháng M+1**.

**Logic đề xuất retry**:
- Nếu thiếu PMI → "Thử lại sau mùng 2/[M+1]"
- Nếu thiếu NSO → "Thử lại sau mùng 4/[M+1]"
- Nếu thiếu Customs → "Thử lại sau mùng 15/[M+1]"
- Nếu thiếu VNBA → "Thử lại sau mùng 13/[M+1]"

---

## Output sample

```json
{
  "preflight": {
    "requested_period": "2026-05",
    "triggered_at": "2026-06-21",
    "status": "READY",
    "sources": {
      "pmi":     {"available": true,  "url": "https://www.pmi.spglobal.com/Public/Home/PressRelease/d05d320a..."},
      "nso":     {"available": true,  "url": "https://www.nso.gov.vn/bai-top/2026/06/..."},
      "customs": {"available": true,  "url": "https://www.customs.gov.vn/index.jsp?pageId=4967&tkId=9788"},
      "vbma":    {"available": true,  "url": "https://vbma.org.vn/storage/reports/May2026/25052026-29052026%20..."},
      "vnba":    {"available": true,  "url": "https://vnba.org.vn/vi/ban-tin-...-22126.htm"}
    },
    "ready_to_proceed": true
  }
}
```

### Khi bị DỪNG (thiếu nguồn):

```json
{
  "preflight": {
    "requested_period": "2026-04",
    "triggered_at": "2026-05-08",
    "status": "BLOCKED",
    "sources": {
      "pmi":     {"available": true,  "url": "..."},
      "nso":     {"available": true,  "url": "..."},
      "customs": {"available": true,  "url": "..."},
      "vbma":    {"available": true,  "url": "..."},
      "vnba":    {"available": false, "url": null, "reason": "VNBA chưa publish bản tin tháng 4"}
    },
    "ready_to_proceed": false,
    "retry_hint": "Thử lại sau mùng 13/05/2026 (VNBA release ~mùng 11-12)"
  }
}
```

---

## All-or-nothing rule

### Tại sao không làm partial report

5 nguồn có **vai trò bổ sung lẫn nhau** (cross-check). Báo cáo thiếu nguồn = báo cáo không đáng tin:

| Cặp cross-check | Cần nguồn nào |
|---|---|
| PMI NewExportOrders ↔ Customs Exports | PMI + Customs |
| PMI InputCosts ↔ NSO CPI | PMI + NSO |
| VBMA LNH ↔ VNBA mặt bằng lãi suất | VBMA + VNBA |
| NSO vs Customs trade balance | NSO + Customs |
| ... | ... |

→ Thiếu 1 nguồn = mất khả năng cross-check = kết luận rủi ro sai.

### Hành vi khi BLOCKED

1. **KHÔNG** tạo thư mục `2026-05/` (tránh rác)
2. **KHÔNG** tải file nào về máy
3. **Output**: báo cáo status + nguồn thiếu + ngày thử lại
4. **User** quyết định khi nào retry

### User override (audit trail)

Khi user yêu cầu chạy partial ("dùng N nguồn đã có" / "bỏ qua pre-flight"), skill **phải ghi nhận override** để có audit trail:

**Trong output JSON (report.json)** — thêm field `_sources_coverage`:
```json
"_sources_coverage": {
  "available": ["PMI", "NSO", "VBMA"],
  "missing": ["Customs", "VNBA"],
  "user_override": true,
  "override_request": "dùng 3 nguồn đã có",
  "retry_hint": "Thử lại sau 15/07/2026 khi đủ 5 nguồn"
}
```

**Trong output text** (tin nhắn cho user) — kết thúc bằng:
```
⚠️ Báo cáo partial (3/5 nguồn theo user override).
Khuyến nghị: chạy lại sau [date] khi đủ 5 nguồn để có đầy đủ data + cross-check.
```

**Quy tắc**:
- `user_override: true` → chạy partial workflow (xem SKILL.md Bước 1.5)
- `user_override: false` (mặc định) → BLOCKED, không chạy
- KHÔNG override ngầm — phải có user request rõ ràng

### Format thông báo cho user

```
⛔ Báo cáo vĩ mô VN tháng 5/2026 KHÔNG thể tạo

Trạng thái nguồn:
  ✅ PMI — available
  ✅ NSO — available
  ❌ Customs — CHƯA release (lịch: ~10/06)
  ✅ VBMA — available
  ✅ VNBA — available

→ Thiếu 1/5 nguồn. Theo all-or-nothing rule, không tạo partial report.

Gợi ý: thử lại sau ngày 15/06/2026 (Customs thường release 10-15/06).
```
