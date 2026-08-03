---
name: vn-macro-monthly
description: Báo cáo vĩ mô Việt Nam hàng tháng (toàn diện, 41 chỉ số) từ 5 nguồn chính thức miễn phí (NSO + Customs + S&P PMI + VBMA + VNBA). Use when người dùng yêu cầu "báo cáo vĩ mô", "monthly macro report", "CPI/PMI/XNK hàng tháng", "tình hình kinh tế VN tháng", hoặc khi cần dashboard vĩ mô bao phủ sản xuất + ngoại thương + tiền tệ + tài chính. Cốt lõi = theo yêu cầu skill với kiểm tra toàn vẹn (tất cả hoặc không gì cả) + 4 nguyên tắc (Thời gian/Tần suất/Xung đột/Đơn vị) + HTML dashboard 4 nhóm.
---

# VN Macro Monthly

Bản tin phân tích vĩ mô Việt Nam hàng tháng (macro briefing — ngôn ngữ text + graph minh họa). Theo yêu cầu (người dùng tự quyết định khi chạy), tất cả hoặc không gì cả (5/5 nguồn mới làm).

## Định vị sản phẩm (bài học 2026-08-03 — đọc TRƯỚC khi viết báo cáo)

**Đây là BẢN TIN PHÂN TÍCH (macro briefing) — KHÔNG phải dashboard.**

| | Dashboard (sai — triết lý cũ) | Bản tin (đúng — triết lý hiện tại) |
|---|---|---|
| Người dùng | Người GIÁM SÁT — quét nhanh, theo dõi thay đổi hằng ngày | Người MUỐN HIỂU bức tranh tháng — đọc tuần tự |
| Đơn vị trình bày | Ô/thẻ/card — mỗi ô 1 số | Đoạn văn + biểu đồ minh họa + dòng dữ liệu |
| Câu trả lời | "Con số là bao nhiêu?" | "Chuyện gì đang xảy ra, vì sao?" |

**Hệ quả thiết kế bắt buộc** (máy verify/QA có check tương ứng):
1. **Text là chủ đạo** — mỗi nhóm mở đầu bằng đoạn dẫn (lead) kể chuyện số liệu; KHÔNG mở đầu bằng hàng thẻ
2. **Đồ họa minh họa, không trang trí** — mỗi nhóm tối đa 1 biểu đồ SVG vẽ đúng phép so sánh chính (mốc mục tiêu, so cùng kỳ, đảo chiều)
3. **Số liệu là xương sống** — lead nối ≥2 con số, mỗi dòng dữ liệu kèm số so sánh, mọi số trace được tới cache
4. **Bề rộng đọc giới hạn** (~1120px) — chữ không trải cả màn hình (đó là tư duy dashboard)

**Triệu chứng tái phạm cần nhận ra**: "thẻ sắp xếp loạn kích thước", "thông tin ít mà thể (hộp) nhiều", "khoảng trống chết", "over text", "nhiều biểu đồ rải rác" → đang trượt về tư duy dashboard. Dừng và viết lại theo editorial.

## Kiến thức premortem v1.1 (hợp nhất từ commit 07/2026 — còn giá trị với kiến trúc mới)

Đợt premortem 9 bug (07/2026) đã được hợp nhất vào skill. Phần nào kiến trúc mới đã thay thế → ghi rõ bên dưới; phần nào còn giá trị → áp dụng:

### `--quick` flag (chế độ nhanh)

**Mặc định**: full pipeline (toàn bộ chỉ số có data, narrative đầy đủ). **`--quick`**: chỉ top chỉ số quan trọng nhất (CPI, PMI, IIP, XNK, FDI, bán lẻ) + verdict 1 câu, skip đoạn dẫn sâu + enrich.

```bash
/vn-macro-monthly 2026-05 --quick
# → Chỉ extract: CPI, PMI, IIP, XNK/cán cân, FDI, bán lẻ
# → Output: ít nhóm hơn, lead ngắn, verdict 1 câu
# → Thời gian: ~15 phút (vs 30-40 phút full)
```

**Khi nào dùng `--quick`**: trader cần update vĩ mô nhanh / first pass / AI feed JSON. **Khi nào dùng full**: analyst cần depth / publish / báo cáo chính thức.

### Direct URL fallback (WebSearch false negative)

Nếu WebSearch không thấy nguồn nhưng trang chính thức có thể có → check trực tiếp: NSO `nso.gov.vn` trang tin mới nhất, Customs `customs.gov.vn` trang tin tức. Nếu URL trực tiếp có dữ liệu → được phép override preflight (ghi chú trong coverage).

### Cờ chất lượng nguồn (source_quality flag)

- **Customs qua nguồn thứ cấp** (VnEconomy/Báo CP — khó fetch trực tiếp) → ghi rõ trong provenance: `"source_quality": "MEDQ"` + `source_note` "số từ nguồn thứ cấp, có thể sai ±0.5%". Verify được với Customs gốc → upgrade `HIGHQ`.
- **VBMA weekly = snapshot** (tuần cuối tháng proxy cho cả tháng) → flag: "VBMA = tuần cuối tháng (snapshot). KHÔNG đại diện cả tháng — LNH có thể spike cuối tháng."

### History audit trail (re-run tháng cũ)

Re-run tháng cũ → ghi đè (1 tháng = 1 giá trị) NHƯNG giữ vết: `value_previous` + `revised_at` + `revision_reason` trong entry history. Nếu `value != value_previous` → cờ "revised" (máy verify check HISTORY nhận diện được).

### Đã được kiến trúc mới thay thế (KHÔNG áp dụng bản cũ)

- **verify_data.py re-parse độc lập** → thay bằng `scripts/verify_data.js` (lớp kiểm tra mạnh hơn: provenance/bounds/history/coverage/word/structure). Tinh thần giữ nguyên: KHÔNG BAO GIỜ render khi verify fail.
- **Cross-card synthesis "Câu chuyện tháng" (~500 từ)** → thay bằng `lead` editorial (đoạn dẫn mỗi nhóm chính là synthesis kết nối chỉ số). Tinh thần giữ nguyên: kết nối ≥2 chỉ số trong cùng lead, không dự báo, mở câu hỏi.
- **News enrich filter (chỉ nhóm A cho macro)** → vẫn giữ trong Bước 3.5 (nguồn ưu tiên A/B/C).

## Điều kiện tiên quyết

Không phụ thuộc skill khác (data từ 5 nguồn web chính thức). Nhưng output bổ sung tốt cho:
- `vn-news-digest` — thời sự 30 ngày cho cổ phiếu cụ thể
- `vn-research-dashboard` — equity research (vĩ mô = context cho định giá cổ phiếu)

## Workflow 4 bước

### Bước 1: Kiểm tra toàn vẹn (pre-flight) — tất cả hoặc không gì cả (BẮT BUỘC)

**Kiểm tra 5 nguồn có tồn tại cho tháng M chưa**. Nếu thiếu bất kỳ nguồn → **DỪNG**, không làm partial.

```
User: /vn-macro-monthly 2026-05
  ↓
WebSearch check 5 nguồn:
  - PMI (S&P): "Vietnam Manufacturing PMI" [tháng] [năm] site:pmi.spglobal.com
  - NSO: nso.gov.vn "báo cáo kinh tế xã hội" tháng [M] [Y]
  - Customs: customs.gov.vn tkId "tháng [M] [Y]"
  - VBMA: vbma.org.vn "BAO CAO TUAN TTP" [tuần cuối tháng M]
  - VNBA: vnba.org.vn "thông tin kinh tế tài chính" tháng [M] [Y]
  ↓
5/5? → Bước 2  |  thiếu? → DỪNG + đề xuất ngày thử lại
```

→ **KHÔNG tạo thư mục** khi bị DỪNG (máy sạch). Xem `references/preflight_check.md` cho lịch release + gợi ý thử lại.

### Bước 1.5: Partial run workflow (khi user override all-or-nothing)

All-or-nothing rule (Bước 1) cấm partial. Nhưng **user có quyền override** khi cần gấp (VD: chạy 3/5 nguồn vì Customs + VNBA chưa publish). Khi user override, áp dụng quy tắc sau:

```
User: "dùng 3 nguồn đã có" / "bỏ qua pre-flight" / tương đương
  ↓
1. Tạo thư mục + cache NHƯNG chỉ với nguồn có sẵn
2. Áp dụng Nguyên tắc KHÔNG placeholder (Bước 3.6) — KHÔNG tạo card cho chỉ số thiếu nguồn
3. Thêm 1 dòng coverage-warn ở hero ghi rõ "X/5 nguồn"
4. Bỏ qua Bước 3.5 (news enrichment) nếu partial < 4/5 nguồn — focus data chính
5. Trong report.json, thêm field `_sources_coverage` ghi nhận override
6. Cuối output, đề xuất ngày retry khi đủ 5 nguồn
```

**`_sources_coverage` schema trong report.json**:
```json
"_sources_coverage": {
  "available": ["PMI", "NSO", "VBMA"],
  "missing": ["Customs", "VNBA"],
  "user_override": true,
  "retry_hint": "Thử lại sau 15/07/2026 khi đủ 5 nguồn"
}
```

**Khi nào KHÔNG override** (user yêu cầu rõ "đợi đủ 5 nguồn" hoặc không nói gì → mặc định all-or-nothing).

### Bước 2: Fetch + cache 5 nguồn (Option C: PDF + text + JSON)

Tạo thư mục `{project}/vn-macro-monthly/2026-05/` (chỉ khi pre-flight ĐẠT). Tải về `sources_cache/`:

```bash
# PMI + NSO: WebReader trực tiếp
# Customs: WebSearch tkId → nguồn thứ cấp (VnEconomy/Báo CP) → .txt
# VBMA: curl + pdftotext (URL có %20 → WebReader fail)
curl -sL "https://vbma.org.vn/storage/reports/May2026/25052026-29052026%20%20BAO%20CAO%20TUAN%20TTTP.pdf" \
  -o "sources_cache/vbma_weekly_25-29may_2026.pdf"
pdftotext -layout sources_cache/vbma_weekly_25-29may_2026.pdf sources_cache/vbma_weekly_25-29may_2026.txt

# VNBA: WebSearch trang tin → lấy CDN link → curl + pdftotext
```

→ Xem `references/sources_overview.md` cho URL pattern + cách fetch từng nguồn.

### Bước 3: Extract dữ liệu → viết report.json (NỘI DUNG QUYẾT ĐỊNH)

Parse text từ cache → extract theo **schema render.js** (xem `references/data_cards.md`). Áp 4 rules bắt buộc:

1. **Nhất quán thời gian** — mọi số ≤ data_cutoff (31/07/2026). VBMA chỉ lấy tuần kết thúc ≤ cutoff, VNBA bỏ "tuần 1 tháng 8".
2. **Frequency** — chỉ monthly, bỏ quý.
3. **Giải quyết xung đột** — Thứ tự ưu tiên nguồn chính + Kiểm chứng định nghĩa trước + Sai số chấp nhận được.
4. **Quy ước đơn vị** — tách mom/yoy/ytd rõ ràng trong `meta`.

**TRIẾT LÝ TRÌNH BÀY — EDITORIAL (text + graph, thay hẳn thẻ card)**:
- Mỗi nhóm = **`lead`** (đoạn dẫn 2-3 câu kể chuyện số liệu) + **`graph`** (1 biểu đồ SVG minh họa) + **`data_items`** (3-5 dòng dữ liệu text)
- `lead`: HTML — số liệu bọc `<span class="num">` (tự màu cyan), nhấn mạnh bọc `<strong>` (tự màu tím); **70-120 từ, ≥2 con số, KHÔNG từ dự báo** (máy verify bắt)
- `graph`: `{"type":"bar", "title": "...", "items":[{"label":"T7","value":52.9,"color":"pos"}]}` — `color` ∈ pos/neg/target (màu cột); **2-10 cột**, mốc so sánh dùng `"color":"target"`. Line chart: `{"type":"line","series_key":"pmi"}` — tự nạp từ history.json, tự ẩn khi <2 điểm
- `data_items`: `[{"name","value","signal":"pos|neg|neu","note"}]` — 3-5 dòng, `note` ≤22 từ và **phải kèm ≥1 số so sánh** (máy verify bắt)
- Nhóm có `lead` → render editorial; nhóm chỉ có `cards` → vẫn render schema card cũ (tương thích ngược)

**QUY TẮC SỐ LƯỢNG (thay cho "bắt buộc 41 chỉ số")**:
- **Bắt buộc tối thiểu các chỉ số quan trọng**: CPI, PMI, IIP, XNK/cán cân, FDI, bán lẻ (chỉ số nào có số liệu thật thì bắt buộc đưa vào `data_items`)
- **Thêm chỉ số nào có số liệu thật trace được tới cache** — KHÔNG bắt buộc đủ 41
- Thiếu nguồn → JSON vắng mục → HTML tự vắng mục (KHÔNG placeholder, KHÔNG vặn số liệu khác vào chỗ trống)
- Bề rộng đọc editorial tự giới hạn ~1120px (skin.css) — không cần chỉnh

**QUY TẮC NHÓM & ĐỘ SÂU (chống "1 nhóm phình to, nhóm nông" — máy verify check 6 bắt)**:
- Gom nhóm theo **CHỦ ĐỀ** (3-5 mục/nhóm, tối đa 6) — KHÔNG gom theo "trụ cột lý thuyết" (nhóm nào nhiều dữ liệu sẽ phình to, nhóm ít thì teo tóp)
- Mỗi nhóm editorial bắt buộc có `lead` (đoạn dẫn) — nhóm không lead không cards = TRỐNG → verify warn
- Mỗi `data_item` phải có **độ sâu tối thiểu: value + signal + note ≥1 số** (dòng chỉ 1 con số không note = quá nông)
- Trước khi chốt report.json: **quét lại nội dung cache** — dữ liệu có sẵn nhưng chưa dùng (lao động, vận tải, ngân sách tháng, cơ cấu...) thì ưu tiên đưa vào `data_items` (SỐ), không phải chữ

```json
{
  "id": "group1", "tab": "Giá cả", "title": "Giá cả — lạm phát & kim loại quý", "tag": "g2", "source_note": "Nguồn: TCTK",
  "lead": "CPI YoY tháng 7 đạt <span class=\"num\">4.45%</span>, tụt dưới mục tiêu 4.5% sau đỉnh <span class=\"num\">5.60%</span> hồi tháng 5 — chuỗi hạ nhiệt tháng thứ 2 liên tiếp.",
  "graph": {
    "type": "bar", "title": "CPI YoY: đỉnh T5 → hạ nhiệt T7 (mốc mục tiêu 4.5%)",
    "items": [
      {"label": "T5", "value": 5.60, "color": "neg"},
      {"label": "T7", "value": 4.45, "color": "pos"},
      {"label": "Mục tiêu", "value": 4.5, "color": "target"}
    ]
  },
  "data_items": [
    {"name": "CPI YoY", "value": "4.45%", "signal": "pos", "note": "MoM -0.12% ▼ · cơ bản 4.19%"},
    {"name": "Chỉ số giá vàng", "value": "+19.15%", "signal": "neg", "note": "MoM -3.02% ▼ · 7T bình quân +51.86%"}
  ]
}
```

→ Xem `references/core_rules.md` cho 4 rules + `references/data_cards.md` cho schema đầy đủ (card/panel/insight) + danh sách 41 chỉ số gợi ý theo 4 nhóm (KHÔNG còn là luật bắt buộc — chỉ là danh mục để chọn).

Tạo `report.json` (nguồn dữ liệu chuẩn — JSON QUYẾT ĐỊNH mọi thứ) + **append** vào `history.json` (cho chart sau này).

### Bước 3.1: Narrative — đóng vai "người kể chuyện số liệu" (BẮT BUỘC cho 10+ card quan trọng)

Sau khi data chính xong, mỗi card quan trọng (CPI, PMI, IIP, XNK, LNH, FDI, TPDN, tỷ giá, tín dụng, vàng) phải có field `narrative` — **2-4 câu kể chuyện số liệu**.

**Nguyên tắc tone — "Người kể chuyện số liệu, KHÔNG phải người cho ý kiến"**:

| ❌ Tránh | ✅ Làm |
|---|---|
| "CPI vượt target → NHNN sẽ phải siết tiền tệ" | "CPI YoY 5.60% đã đứng trên mục tiêu 4.5% tháng thứ 2 liên tiếp, cùng lúc PMI Chi phí đạt đỉnh 15 năm — hai con số này cùng kể câu chuyện lạm phát chi phí." |
| "Tôi dự báo Q3 khó khăn" | "FDI +9.6% nhưng nhập siêu 13.8 tỷ — một bên vốn đến, một bên nguyên liệu nhập, hai số này định hình cán cân H2." |

**4 ĐỪNG**:
1. ĐỪNG dùng "tôi nghĩ/có thể/dự báo" → dùng "số liệu cho thấy", "cùng lúc"
2. ĐỪNG khuyên mua/bán/khuyến nghị → chỉ kể diễn biến số
3. ĐỪNG dùng tính từ cảm tính ("đáng lo", "tốt") → dùng số so sánh ("+99.1%", "đỉnh 15 năm")
4. ĐỪNG kết luận định hướng → mở câu hỏi cho người đọc

→ Xem `references/data_cards.md` mục **Narrative** cho template 4 câu + bảng sai-đúng + 10 ví dụ.

### Bước 3.5: Làm phong phú báo chí (BẮT BUỘC cho Cấp A khi đủ 5 nguồn)

Sau khi data chính xong, WebSearch tin báo chí trong tháng báo cáo để **làm phong phú** mỗi data card. Lớp bổ sung, KHÔNG thay thế số liệu chính.

**Quy tắc enrich (rõ ràng)**:
| Điều kiện | Hành động |
|---|---|
| Đủ 5 nguồn (full run) | ✅ **BẮT BUỘC** enrich cho 10 card Cấp A (CPI, PMI, IIP, XNK, FDI, LNH, TPCP, TPDN, bán lẻ, tỷ giá) — 1-2 tin/card |
| Partial run (3-4/5 nguồn) | ⚠️ TÙY CHỌN — focus data chính trước, enrich nếu còn thời gian |
| Không có tin chất lượng | ❌ BỎ QUA — thà trống hơn tin rác |

→ Enrich KHÔNG tạo placeholder. Nếu không tìm được tin tốt cho 1 card → bỏ field `news_enrichment` của card đó (không tạo empty array).

```
Cho mỗi data card có giá trị kinh tế:
  ↓
WebSearch theo template: "[chỉ số] [tháng] [năm]" site:[nguồn ưu tiên]
  ↓
Filter: publish ≤ chốt dữ liệu + có quote chuyên gia hoặc insight
  ↓
Embed 1-2 tin tốt nhất vào field news_enrichment
```

**Nguồn ưu tiên** (xem `references/news_sources.md` cho chi tiết):
- **A. Báo kinh tế chính thống**: VnEconomy, Báo Điện tử Chính phủ, Đầu tư, Thời báo Tài chính
- **B. Báo tài chính/CK**: CafeF, Vietstock, VietnamFinance (trích báo cáo CTCK)
- **C. Báo ngành**: Công Thương, Hải quan, Nông nghiệp VN

**Quy tắc**:
- Chỉ tin publish ≤ chốt dữ liệu (quy tắc thời gian)
- Tối đa 2 tin / card
- Ưu tiên tin có quote chuyên gia (TS. Nguyễn Trí Hiếu, SSI Research...)
- KHÔNG dùng số liệu báo chí thay số liệu chính thức — enrich chỉ bổ sung context
- Nếu không có tin chất lượng → KHÔNG enrich (thà trống hơn tin rác)

### Bước 3.6: Nguyên tắc KHÔNG placeholder (BẮT BUỘC)

**Chỉ đưa vào báo cáo những gì CÓ DỮ LIỆU THẬT. Không tạo khung/card/section "THIẾU" cho phần chưa có data.**

```
Cho mỗi chỉ số dự kiến:
  ↓
Có số liệu trace được tới file cache?
  ↓
  ┌──── CÓ ────┐                ┌──── KHÔNG ────┐
  ↓            ↓                ↓               ↓
Tạo data card  (xử lý bình thường)  BỎ QUA — KHÔNG tạo card
                                   KHÔNG tạo missing-card
                                   KHÔNG tạo _status: THIẾU
                                   KHÔNG để slot trống
```

**4 ĐỪNG khi thiếu dữ liệu**:
1. **ĐỪNG** tạo `missing-card` / placeholder box trong HTML ("📋 THIẾU VNBA — sẽ có khi publish...")
2. **ĐỪNG** tạo entry `_status: "THIẾU"` trong `report.json` (vô nghĩa — JSON không cần khai báo cái không có)
3. **ĐỪNG** để slot trống trong grid layout (gây vỡ UI)
4. **ĐỪNG** giải thích dài dòng trong dashboard về việc thiếu (chỉ 1 dòng trong coverage-warn hero là đủ)

**Ngoại lệ DUY NHẤT** — coverage warning ở đầu báo cáo:
- Nếu chạy partial (3/5 nguồn) → **1 dòng** ở hero `coverage-warn` ghi "Báo cáo dùng 3/5 nguồn: thiếu Customs + VNBA"
- KHÔNG lặp lại warning này trong từng group section

**Tại sao**: Placeholder "THIẾU" làm dashboard nặng mà không thêm giá trị — người đọc không cần biết dashboard *đáng lẽ có gì*, chỉ cần biết dashboard *có gì*. Khi nguồn bổ sung publish → chạy lại skill, card tự xuất hiện tự nhiên.

**Ví dụ sai vs đúng** (tháng 6/2026, thiếu VNBA):
| ❌ SAI | ✅ ĐÚNG |
|---|---|
| Tạo card "US 10Y yield · ECB · BOJ · TT/CV NHNN" với nội dung "THIẾU VNBA — sẽ có khi publish" | Bỏ hẳn card này. Khi VNBA publish → chạy lại skill → card tự xuất hiện |
| Tạo `_status: "THIẾU"` cho deposit_rate, lending_rate trong JSON | Không có field deposit_rate/lending_rate trong JSON kỳ này |
| 9 missing-card + 6 `_status: THIẾU` rải rác | 0 placeholder. Chỉ 1 dòng coverage-warn ở hero |

→ Xem `references/data_cards.md` mục **"Nguyên tắc không placeholder"** cho chi tiết + checklist.

### Bước 3.7: Data Provenance (BẮT BUỘC)

**Mọi số trong `report.json` phải trace được tới 1 file cụ thể trong `sources_cache/`.** Thêm section `_data_provenance` ở cuối report.json:

```json
"_data_provenance": {
  "_rule": "Mọi số trong report.json phải trace được tới 1 file cụ thể trong sources_cache/",
  "sources_files": {
    "nso_jun_2026.txt": ["CPI", "IIP", "GDP", "XNK", "FDI", "bán lẻ", "DN"],
    "pmi_jun_2026_extracted.txt": ["PMI headline + 10 sub-indices"],
    "vbma_weekly_22-26jun_2026.txt": ["LNH", "tỷ giá", "DXY", "TPCP", "TPDN"]
  }
}
```

**Quy tắc**:
- ✅ CHỈ ghi `sources_files` (file CÓ + chỉ số lấy từ file đó)
- ❌ KHÔNG ghi `missing_files` (file thiếu) — vi phạm Nguyên tắc không placeholder. Khi nguồn bổ sung publish → chạy lại skill → tự thêm vào sources_files
- ❌ KHÔNG ghi file mà không có chỉ số nào trace được tới nó

### Bước 4: Render HTML dashboard — CHẠY MÁY RENDER (KHÔNG viết HTML thủ công)

**KHÔNG copy template rồi sửa tay.** Chạy `scripts/render.js` — máy đọc `report.json` + `history.json` và TỰ SINH toàn bộ `report.html`:

```bash
node scripts/render.js \
  --json=2026-07/report.json \
  --history=history.json \
  --out=2026-07/report.html
```

Máy render tự động làm (model KHÔNG cần đụng vào):
- **Hero**: verdict + 4 KPI (từ `hero_kpis` trong JSON)
- **Coverage-warn** (1 dòng) khi partial run — từ `_sources_coverage`
- **NAV**: chỉ hiện tab CÓ nội dung — group không có card VÀ không có lead → tab TỰ ẨN (nội dung quyết định)
- **Group sections**: nhóm editorial = lead + graph SVG + data_items — từ `groups[].lead/graph/data_items`; nhóm card cũ vẫn render
- **Section "Tổng hợp"**: Risks/Catalysts/Key Takeaways (tự ẩn nếu trống)
- **Gauge PMI** (card có `"gauge": "pmi"`), **sparkline** (khi history ≥2 kỳ), **mũi tên ▲▼**, **modal chart** (ẩn nút khi <6 kỳ)

Skin (giao diện) nằm ở `assets/skin.css` + `assets/skin.js` — CHỈ sửa khi muốn đổi thiết kế. (Template HTML cũ đã xoá — không còn nguồn render thủ công.)

→ Xem `references/rendering.md` cho chi tiết schema card + quy tắc thiết kế.

**Verify HTML (BẮT BUỘC)**:
```bash
# JS syntax check
node -e "
const fs=require('fs');
const html=fs.readFileSync('report.html','utf8');
const scripts=html.match(/<script>([\s\S]*?)<\/script>/g);
const last=scripts[scripts.length-1].replace(/<\/?script>/g,'');
fs.writeFileSync('/tmp/r.js',last);
" && node --check /tmp/r.js && echo '✅ Syntax OK'

# Automated QA (Playwright) — cài lần đầu (chỉ 1 lần):
cd scripts && npm install && npx playwright install chromium && cd ..
# Chạy QA:
NODE_PATH=scripts/node_modules node scripts/qa_report.js \
  --url=file:///path/to/2026-07/report.html --output=/tmp/qa-2026-07
```

Kết quả: `✅ PASS` → done | `⚠️ WARNINGS` → review | `❌ FAIL` → fix rerun.
- **Hero**: verdict badge + 4 KPI boxes (CPI/PMI/XNK/LNH)
- **NAV**: **5 tabs** (Kinh tế thực* / Tiền tệ & TC / Ngành & cơ cấu / Bối cảnh TG / **📊 Tổng hợp**)
- **4 group sections** (data card theo nhóm): mỗi nhóm có 🔴 tiêu cực + 🟢 tích cực highlight + thẻ dữ liệus grid
- **Click-to-chart**: nút `[📊]` mở modal với sparkline từ `history.json`
- **Section 5 "Tổng hợp"**: Risks / Catalysts / Key Takeaways — **PHẢI nằm trong `<section id="summary">` riêng** (tab thứ 5), KHÔNG đặt ngoài group-section (xem `references/rendering.md` rule placement)

→ Xem `references/rendering.md` cho design pattern + style guide đồng bộ `vn-research-dashboard`.

### Bước 3.8: Verify dữ liệu TRƯỚC khi render (BẮT BUỘC — lớp kiểm soát chất lượng)

Máy `scripts/verify_data.js` kiểm tra report.json + history.json (chạy SAU Bước 3, TRƯỚC Bước 4):

```bash
node scripts/verify_data.js --json=2026-07/report.json --history=history.json
```

Kiểm tra 6 nhóm — `❌ FAIL` = PHẢI sửa trước khi render:
1. **PROVENANCE** — mọi file cache khai báo trong `_data_provenance.sources_files` phải TỒN TẠI + không rỗng (chống khai báo nguồn bịa)
2. **BOUNDS** — giá trị data_item phải nằm trong khoảng hợp lý theo tên chỉ số (chặn "5.60"→"560", tỷ giá nhầm đơn vị...); note chỉ check cận trên ×3 (bắt sai bậc đơn vị, bỏ qua năm)
3. **HISTORY** — series tăng dần theo tháng, không trùng tháng; graph line có `series_key` phải có entry kỳ hiện tại
4. **COVERAGE** — available/missing không trùng nhau
5. **WORD LIMITS** — lead ≤130 từ + ≥2 con số + không từ dự báo; note ≤22 từ + ≥1 con số
6. **STRUCTURE** — mỗi nhóm ≤6 mục, nhóm không trống (lead hoặc cards), graph bar 2-10 cột

Kết quả: `✅ PASS` → render | `⚠️ WARNINGS` → xem lại từng cảnh báo | `❌ FAIL` → sửa JSON rồi chạy lại.

## Output

### File cuối cùng
```
{project}/vn-macro-monthly/
├── history.json              ← chuỗi thời gian (append mỗi tháng)
├── 2026-05/
│   ├── report.json           ← data structured (nguồn dữ liệu chuẩn)
│   ├── report.html           ← dashboard cuối cùng
│   └── sources_cache/
│       ├── pmi_may_2026.html
│       ├── nso_may_2026.html
│       ├── customs_may_2026.txt
│       ├── vbma_weekly_25-29may_2026.pdf   ← bằng chứng (Option C)
│       ├── vbma_weekly_25-29may_2026.txt
│       ├── vnba_monthly_may_2026.pdf       ← bằng chứng
│       └── vnba_monthly_may_2026.txt
└── 2026-04/ (kỳ trước)
```

### `report.json` schema (tóm tắt — NỘI DUNG QUYẾT ĐỊNH)

```json
{
  "report_id": "vn-macro-2026-07",
  "period": {"month": 7, "year": 2026, "data_cutoff": "2026-07-31"},
  "verdict": "TRUNG TÍNH — CẢNH GIÁC",
  "verdict_class": "amber",                /* amber|green|red — màu badge */
  "verdict_reason": "...",
  "hero_kpis": [                            /* 4 ô số lớn ở đầu trang */
    {"label": "CPI YoY", "value": "4.45", "unit": "%",
     "delta": "Trong mục tiêu 4.5%", "signal": "pos", "flag": "green"}
  ],
  "groups": [                               /* NHÓM DO NỘI DUNG QUYẾT ĐỊNH — không bắt buộc 4 nhóm */
    {
      "id": "group1", "tab": "Tăng trưởng & Sản xuất", "title": "...", "tag": "g1", "source_note": "...",
      "lead": "<span class=\"num\">…</span> … <strong>…</strong>", /* 2-3 câu dẫn editorial */
      "graph": {"type": "bar", "title": "...", "items": [{"label": "...", "value": 52.9, "color": "pos"}]},
      "data_items": [{"name": "...", "value": "...", "signal": "pos", "note": "..."}],
      "cards": [ /* schema cũ — tương thích ngược, render khi group không có lead */ ]
    }
  ],
  "risks": [ /* 3-5 items, level color-coded */ ],
  "catalysts": [ /* 3-5 items */ ],
  "key_takeaways": [ /* 3 bullets, #1 có ⭐ */ ],
  "_sources_coverage": { /* partial run: available + missing + retry_hint */ },
  "_data_provenance": { "sources_files": { /* file cache → chỉ số */ } }
}
```

→ Card/panel/insight schema đầy đủ: xem `references/data_cards.md` + header `scripts/render.js`.

### `history.json` schema

```json
{
  "series": {
    "cpi_yoy_pct": [{"month": "2026-05", "value": 5.60}],
    "pmi": [{"month": "2026-05", "value": 52.8}]
  }
}
```

**Rules history**:
- Mỗi lần skill chạy thành công → append entry
- **Re-run tháng cũ → ghi đè** (1 tháng = 1 giá trị)
- **Bắt đầu trống** (KHÔNG seed data cũ) — áp dụng cho `history.json` thật
- → Dashboard demo sẽ không có nút `[📊]` cho đến khi skill chạy thật 6+ kỳ (feature ngủ chờ data — KHÔNG phải bug, xem "Pitfalls" cuối file)
- Đủ 6+ tháng → chart Cấp A render sparkline đẹp

## 4 Rules — tóm tắt (xem `references/core_rules.md` cho chi tiết)

| Rule | Tóm tắt |
|---|---|
| **1. Nhất quán thời gian** | "Nhìn lùi, không nhìn tới". Data cutoff = cuối RM. VBMA tuần ≤ cutoff, VNBA bỏ "tuần 1 tháng M+1" |
| **2. Frequency** | Chỉ monthly, bỏ quý |
| **3. Giải quyết xung đột** | Thứ tự ưu tiên nguồn chính + Kiểm chứng định nghĩa trước + Sai số chấp nhận được (<2%/<5%/>5%) |
| **4. Quy ước đơn vị** | 8 đuôi trường, tách mom_pct/yoy_pct/ytd_avg_pct |

## Phối hợp hệ sinh thái skill VN

```
vn-financial-data-collector  (DN cấp)
        ↓
vn-fundamental-analysis / vn-valuation-engine / vn-technical-analysis
vn-news-digest              (thời sự 30 ngày cho cổ phiếu)
⭐ vn-macro-monthly ⭐       (VĨ MÔ monthly)  ← SKILL NÀY
        ↓
vn-research-dashboard       (render HTML equity research — share style)
```

→ vn-macro-monthly = mảnh ghép **ngữ cảnh vĩ mô** còn thiếu. CPI/FDI/XNK/PMI/LNH là input cho mọi quyết định đầu tư VN.

## Pitfalls thực tế (lessons learned)

Tổng kết 4 sai lầm thường gặp khi làm/vận hành skill. Đọc trước khi debug.

### Pitfall 1 — "Feature ngủ chờ data"

- ❌ User báo "feature chart `[📊]` bị mất" khi dashboard không có nút nào → tưởng là bug
- ✅ Thực ra nút đang ẩn do `history.series[key].length < 6` — đúng spec (rule ẩn nút khi <6 tháng)
- → **Cách check**: mở source HTML, tìm `const history={series:{...}}`. Đếm số entry mỗi series. Nếu tất cả <6 → feature đang ngủ, không phải bug
- → **Cách kích hoạt**: chạy skill thêm tháng. Lần thứ 6+ → 2 series đầu (CPI/PMI) đạt 6 điểm → nút tự xuất hiện
- **KHÔNG** sửa code ép nút hiện, **KHÔNG** seed data để ép ngưỡng

### Pitfall 2 — "Đừng fill data qua WebSearch"

- ❌ Khi user hỏi "fill thêm data cũ cho dashboard demo", temptation là WebSearch + điền thẳng vào `history.json`/`report.json`
- ✅ Vi phạm rule cốt lõi: **"Mọi số liệu trong `report.json` phải trace được tới 1 file cụ thể trong `sources_cache/`"** (xem DESIGN.md + `references/sources_overview.md`)
- → Chỉ dùng data có trong cache của các kỳ chạy trước. WebSearch = để FIND URL nguồn, không phải để FILL data
- → Ngoại lệ duy nhất: enrich báo chí (lớp bổ sung, không phải số chính, có `references/news_sources.md` riêng)

### Pitfall 3 — "QA PASS ≠ feature hoạt động"

- ❌ QA script ghi `✅ PASS` → tưởng mọi thứ OK
- ✅ QA check `display:none` đúng — nhưng nếu **toàn bộ nút ẩn** (history rỗng, feature ngủ) → QA vẫn PASS (check #7 line 219-221 handle visible=0)
- → Đọc kỹ output QA: dòng `"X visible, Y hidden"`. Nếu `visible=0` → feature đang ngủ (Pitfall 1), không phải fail
- → QA chỉ check **structure** (nút tồn tại, modal mở được khi click nút visible). KHÔNG check **business logic** (nút nên visible hay không)

### Pitfall 4 — "Sample data trap"

- ❌ Template demo có seed data (CPI/PMI 5 điểm) → tưởng đây là source-of-truth để copy sang `history.json` thật
- ✅ Template sample phải bắt đầu **TRỐNG** đúng spec (xem "History rules" phía trên). Seed data = vi phạm rule "không seed"
- → Nếu dashboard demo hiện nút chart → có thể là seed data sót lại (phải xóa)
- → Khi run thật: data append từ cache kỳ trước, **KHÔNG** copy số từ template sample vào `history.json` thật

## Tham khảo

- **`references/core_rules.md`** — ⭐ 4 rules bắt buộc (Time/Frequency/Conflict/Unit) + CPI case study
- **`references/sources_overview.md`** — ⭐ 5 nguồn: URL pattern + cách fetch + pitfalls từng nguồn
- **`references/preflight_check.md`** — Kiểm tra toàn vẹn (pre-flight) workflow + lịch release + gợi ý thử lại
- **`references/data_cards.md`** — ⭐ Hướng dẫn viết INPUT editorial: quy trình extract 5 bước (cache → chủ đề → lead → graph → data_items) + schema + danh mục chỉ số theo chủ đề + nguyên tắc KHÔNG placeholder
- **`references/rendering.md`** — ⭐ Design pattern hiển thị editorial: layout lead+graph+data_items, spec SVG bar/line, NAV/summary/verdict, responsive + checklist render
- **`references/news_sources.md`** — ⭐ Nguồn báo chí enrich (3 nhóm: kinh tế chính thống + tài chính/CK + ngành) + quy tắc lọc + schema news_enrichment
- **`assets/skin.css` + `assets/skin.js`** — ⭐ Giao diện (dark fintech, đồng style vn-research-dashboard)
- **`scripts/qa_report.js`** — ⭐ Automated QA (Playwright): nav/modal/sections/console errors/screenshots

## Changelog

### 2026-08-03 — Dọn sạch tầng INPUT theo editorial (data_cards.md + rendering.md)

**Vấn đề (user nhận định)**: "Nếu làm lại đúng ngôn ngữ thiết kế thì có đáng không — việc này còn ảnh hưởng đến việc xử lý input, cần refactor khá nhiều." Điều tra: code máy (render/skin/verify/QA) đã editorial xong, nhưng **2 reference hướng dẫn model viết input vẫn dạy tư duy dashboard** (41 chỉ số, 4 nhóm trụ cột, schema card) → kỳ sau model đọc tài liệu cũ sẽ lại viết report.json theo kiểu cũ. User chọn: **dọn sạch** (không vá, không chờ).

**Thay đổi**:
1. **`references/data_cards.md`** — viết lại hoàn toàn: "Input Editorial — hướng dẫn viết report.json". Thêm **quy trình extract 5 bước** (B1 đọc cache → liệt kê chủ đề; B2 chọn 5-6 nhóm; B3 viết lead; B4 chọn graph; B5 xây data_items) + nguyên tắc vàng "lead quyết định nhóm, số không vào được lead/item → không đưa vào". Schema editorial đầy đủ kèm quy tắc máy verify bắt. "41 chỉ số 4 nhóm" → "danh mục chỉ số gợi ý theo chủ đề" (vai trò chọn, không phải luật). Schema card cũ gom về mục "Phụ lục legacy" cuối file.
2. **`references/rendering.md`** — viết lại hoàn toàn: layout editorial (lead → graph → data_items), spec SVG bar/line đồng bộ render.js (màu cột, đường 0 đứt, scale ×1.12, line ≥2 điểm), bề rộng đọc 1120px, feature-ngủ-chờ-data cho line graph, checklist mới. Component card cũ (click-to-chart/gauge/highlight-box) bỏ — chỉ còn trong code legacy.

**Kết quả**: hết tư duy dashboard ở MỌI tầng (code + SKILL.md + 2 reference). Kỳ 15/08 full 5/5 nguồn sẽ viết input editorial ngay từ đầu.

### 2026-08-03 — ĐỔI TRIẾT LÝ THIẾT KẾ: EDITORIAL (text + graph) thay thẻ card

**Vấn đề (user nhận định)**: "Việc dùng các thẻ thông tin không ổn lắm — lượng thông tin thì ít mà lượng thể (hộp/vỏ) quá nhiều, lối thiết kế quá có vấn đề." User chốt: **"chuyển sang ngôn ngữ text + graph visual minh họa"**, chọn mô hình **Editorial: lead + graph + text**.

**Thay đổi**:
1. **`report.json` schema mới cho mỗi nhóm** (thay `cards[]`):
   - `lead` — đoạn dẫn 2-3 câu kể chuyện số liệu; số bọc `<span class="num">` (cyan), nhấn mạnh `<strong>` (tím)
   - `graph` — 1 biểu đồ SVG tĩnh/nhóm: `{"type":"bar", "items":[{label,value,color}]}` với màu pos/neg/target; `{"type":"line","series_key"}` tự nạp history (tự ẩn khi <2 điểm)
   - `data_items` — 3-5 dòng dữ liệu text: `{name, value, signal:pos|neg|neu, note}` — màu tín hiệu theo hướng
2. **`scripts/render.js`** — 4 hàm mới (barGraphSVG/lineGraphSVG/graphHTML/dataItemsHTML); `groupHTML` render editorial khi có `lead`, fallback card cũ khi không; NAV/BUILD nhận diện nhóm có `lead`
3. **`assets/skin.css`** — `.ed-section` (giới hạn bề rộng đọc 1120px — chuẩn báo chí), `.ed-lead` (gradient + viền trái cyan), `.ed-graph` (khung biểu đồ), `.ed-item` (grid name 230px / value 150px / note 1fr), responsive 900/600px
4. **`scripts/verify_data.js`** — nâng cấp cho schema editorial: BOUNDS theo tên chỉ số (map 22 chỉ số + parse số kiểu VN "4.555,8"), WORD (lead ≤130 từ ≥2 số, note ≤22 từ ≥1 số), STRUCTURE (nhóm ≤6 mục, không nhóm trống, graph 2-10 cột); giữ fallback card cũ
5. **`scripts/qa_report.js`** — data-driven editorial: đếm `.ed-item`/`.ed-lead` thay `.data-card`, bỏ đòi hỏi gauge/chart-buttons khi JSON không khai báo
6. **SKILL.md** — thêm mục "Định vị sản phẩm": bản tin phân tích (macro briefing), KHÔNG phải dashboard. Đúc kết bài học user: **"code cũ định vị sai loại sản phẩm báo cáo — mọi rắc rối (thẻ loạn kích thước, thông tin ít thể nhiều, khoảng trống chết, over-text) đều từ đây mà ra"** — vì cố bóp một bản tin vào khuôn dashboard (ô/card) thì dữ liệu tháng chỉ có ít, vỏ hộp lại nhiều

**Kết quả đo** (Playwright, viewport 1480px): 6 nhóm editorial · 6 lead (73-90 từ, 4-5 số/lead) · 6 graph SVG (không tràn) · 24 data_items (16 pos/3 neg/5 neu) · 0 data-card cũ · verify ✅ PASS · QA ✅ PASS 24/24 (0 warning).

**Lưu ý cho người sửa skill sau**: NHÓM MỚI = lead + graph + data_items (xem Bước 3). Card cũ chỉ để tương thích báo cáo cũ. Đừng tạo nhóm không có lead. Graph bar mặc định (vẽ được ngay từ số tháng); line chỉ khi series history ≥2 điểm.

### 2026-08-03 — Hiệu ứng thị giác chức năng (số đếm · kim quay · thanh chạy)

**Vấn đề (user nhận định)**: "Thiếu hiệu ứng thị giác?" — phân tích: thiếu ĐÚNG LOẠI (dashboard tài chính chỉ nên có hiệu ứng chức năng, không phải trang trí — trang trí làm giảm độ tin cậy, chậm đọc, không in được).

**Thay đổi** (`assets/skin.js`):
1. **Số đếm tăng dần** khi load (0.5s, ease-out) — `.dc-value` + `.kpi-value`, giữ nguyên định dạng (dấu phẩy nghìn, đơn vị, dấu +/-)
2. **Kim gauge PMI quay từ từ** (0.6s) — refactor `arc()` → `arcPath()` + rAF ease-out
3. **Thanh tiến độ chạy ngang** (0.6s) — `.dc-progress-fill` từ 0% → target
4. Cả 3 tôn trọng `prefers-reduced-motion: reduce` (tắt animation cho người cài giảm chuyển động)

**Verify bằng Playwright đo nhiều mốc thời gian**: số CPI -0.34%→4.45% · thanh 0%→99% · kim 20.14→149.9 (kết thúc đúng 52.9). QA ✅ PASS.

**Lưu ý**: animation MỘT LẦN khi load (không lặp vô hạn) — không nhiễu, không ảnh hưởng bản in.

### 2026-08-03 — Dọn nhà + 3 hướng nâng cấp (trải nghiệm đọc · chất lượng nội dung · tự động hoá)

Theo lựa chọn user: "dọn cái cũ + làm cả 3 hướng đề xuất".

**A. Dọn nhà**:
- Xoá `assets/report_template.html` (1.500 dòng di tích — không còn nguồn render)
- Xoá 20 block CSS chết trong skin.css (xcheck-table, pmi-grid, panel-tag, yield-curve-wrap...)
- Viết lại README.md theo kiến trúc data-driven (hết "41 chỉ số" cũ)

**B. Trải nghiệm đọc**:
- **So sánh tháng trước tự động**: render.js đọc history.json — khi series đủ 2 kỳ, card tự hiện "▲ +X so với T6" (màu theo hướng). Feature ngủ chờ data (kỳ 1 không hiện — đúng spec)
- **Nút 🖨️ In / PDF** trong hero + CSS `@media print` (ẩn nav/nút/modal, mở sẵn "Đọc thêm", giữ màu khi in PDF)

**C. Chất lượng nội dung — máy bắt (verify_data.js QUALITY check)**:
- Narrative phải nối **≥2 con số** (kể chuyện số liệu, không phải văn xuôi) → warn nếu thiếu
- Cấm từ dự báo trong narrative: "tôi nghĩ / dự báo / sẽ tăng / sẽ giảm..." → warn

**D. Tự động hoá**:
- `scripts/run_monthly.js` — pipeline 1 lệnh: verify (dừng nếu FAIL) → render → QA (tùy chọn --qa)
- Cron 09:00 ngày 15/08/2026 — tự nhắc chạy lại báo cáo tháng 7 FULL 5/5 nguồn

**Kết quả**: QA ✅ PASS 26/26 · verify PASS (1 warning vô hại) · pipeline 1 lệnh chạy ngon.

### 2026-08-03 — Phân cấp không gian card (hết "gạch đều" của triết lý cũ)

**Vấn đề (user nhận định)**: "Layout có phải là vấn đề còn tồn tại của triết lý cũ không?" — Đo thật: mọi card đều 463px (1/3 dòng), card chủ chốt (PMI, Cán cân) bị bóp ngang hàng với card phụ, chênh lệch chiều cao hàng 241px — di sản của thiết kế "41 card đều như gạch".

**Thay đổi**:
1. `skin.css` — `.data-card.span2{grid-column:span 2}` (card 2/3 dòng) + responsive
2. `scripts/render.js` — card JSON hỗ trợ `span: 2` (giữ `wide` = 3 cột, tương thích cũ)
3. `report.json` tháng 7 — PMI + Cán cân TM: `"span": 2`

**Kết quả đo**: CPI 1.416px (cả dòng) · PMI 939px (2/3) cạnh IIP 463px (1/3) · card phụ 463px — tỉ lệ 2:1 giữa card chính/phụ. QA ✅ PASS.

**Lưu ý cho người sửa skill sau**: card quan trọng (primary + có gauge/narrative dài) → đặt `"span": 2`; card phụ để mặc định 1/3. KHÔNG trải đều mọi card như nhau.

### 2026-08-03 — Phân tầng chữ (chống over text): narrative gấp vào "📖 Đọc thêm"

**Vấn đề (user nhận định)**: "Report hơi over text" — đo thật: ~2.300 từ hiển thị, narrative 75-113 từ/card tràn ngang hàng với con số → dashboard biến thành bài đọc.

**Triết lý**: đúng không phải "cắt chữ" mà là **phân tầng hiển thị** — 3 tầng đọc (quét nhanh 30s / hiểu vì sao 2-3 phút / đào sâu 5+ phút) không được trộn lẫn:
- TẦNG 1 (hiện ngay): số + tín hiệu màu + `why` ≤22 từ + meta ≤3 ô
- TẦNG 2 (gấp lại): narrative bọc trong `<details class="dc-readmore">📖 Đọc thêm` — ẩn mặc định, bấm mới xổ; nội dung vẫn còn nguyên (không xoá)
- TẦNG 3 (giữ nguyên): insight — người đọc chủ động vào

**Thay đổi**:
1. `assets/skin.css` — style `.dc-readmore` (nút cyan "📖 Đọc thêm", mũi tên xoay khi mở)
2. `scripts/render.js` — narrative của card luôn bọc trong `<details class="dc-readmore">`
3. `scripts/verify_data.js` — **Check 5 WORD LIMITS** (máy bắt over text): why >22 từ → warn; meta >3 ô → warn; narrative >120 từ → warn; insight tổng >240 từ → warn
4. `report.json` tháng 7 — cắt why còn ≤22 từ, meta ≤3 ô (máy verify bắt 2 card vượt → đã sửa)

**Kết quả đo**: chữ hiển thị mặc định giảm 3.322 → 1.931 từ (17%); narrative không còn tràn; QA ✅ PASS.

**Lưu ý cho người sửa skill sau**: viết `why` ngắn (1 câu, ≤22 từ) — chữ sâu để vào `narrative` (sẽ bị gấp). Máy verify sẽ nhắc nếu viết dài.

### 2026-08-03 — Dứt điểm triết lý cũ: NHÓM DO NỘI DUNG QUYẾT ĐỊNH (bỏ giả định 4 nhóm cố định)

**Vấn đề (user nhận định)**: "Skill vẫn mắc kẹt trong triết lý thiết kế cũ và nhiều lỗi". Bằng chứng: báo cáo tháng 7 không có dữ liệu tiền tệ nhưng vẫn có nhóm "Tiền tệ & Tài chính" (nhét card chỉ số giá vàng/USD — vốn là dòng phụ của CPI), nhóm "Bối cảnh toàn cầu" có card nông nghiệp, 4 KPI xanh nhưng verdict vàng "CẢNH GIÁC", card PMI có ô dữ liệu rỗng.

**Thay đổi**:
1. **render.js**: bỏ mảng tên tab cố định `['Kinh tế thực','Tiền tệ & Tài chính',...]` theo index → tên tab lấy từ `group.tab` trong JSON (fallback = `title` cắt trước " — "). Số nhóm/loại nhóm hoàn toàn do JSON quyết định.
2. **report.json tháng 7 viết lại theo bản chất**: chỉ 2 nhóm thật (Kinh tế thực + Ngành & Cơ cấu — gộp nông nghiệp vào ngành), nhóm tiền tệ/bối cảnh TG KHÔNG TỒN TẠI (không phải ẩn), verdict đổi thành "TÍCH CỰC" (khớp toàn bộ số liệu xanh) kèm lý do nêu rõ 2 điểm trừ + ghi chú partial, dọn ô meta rỗng.
3. **qa_report.js**: Check 2/3 đếm tab/section ĐỘNG theo JSON (số nhóm có card + summary) — bỏ giả định "5 tab".

**Quy tắc mới cho người viết report.json**: nhóm nào không có dữ liệu thật → KHÔNG khai báo nhóm đó. `tab` = tên ngắn trên thanh điều hướng. Verdict phải khớp màu với phần lớn số liệu (không "CẢNH GIÁC" khi toàn bộ KPI xanh).

**Kết quả verify**: render 2 groups/19 cards/3 tabs · verify PASS · QA ✅ PASS 26/26 (0 warning) · offline OK.

### 2026-08-03 — Đợt vá từ review 2-model độc lập (verify_data + offline + QA data-driven)

**Bối cảnh**: Review toàn diện bằng 2 model độc lập (black-box bịa dữ liệu + white-box đọc code). Kết quả: 15 kịch bản sai dữ liệu chỉ 1 bị máy bắt; phát hiện lỗi crash offline + feature chết âm thầm. Cả 2 model cùng chỉ ra: **không có lớp máy nào đối chiếu số liệu với file gốc**.

**Thay đổi**:
1. **`scripts/verify_data.js` (MỚI — Bước 3.8, chạy BẮT BUỘC trước render)**: kiểm tra (a) file cache trong `_data_provenance` tồn tại + không rỗng, (b) bounds hợp lý theo từng chỉ số (chặn "5.60"→"560"), (c) history tăng dần/không trùng tháng/đã append, (d) coverage không trùng. Test: bắt được 3/3 lỗi giả (sai đơn vị, file bịa).
2. **skin.js offline guard**: `Chart.defaults.*` gây crash toàn bộ JS khi mất mạng → bọc trong `if (typeof Chart !== 'undefined')`. Đã test bằng Playwright chặn CDN: nav/sparkline/gauge vẫn chạy.
3. **skin.js mốc 50 PMI**: điều kiện `typeof Chart.annotation==='object'` luôn false (plugin v3 không set field này) → đổi sang check `Chart.registry.plugins.items.annotation`.
4. **QA data-driven**: đọc report.json cùng thư mục → so kỳ vọng thực tế (cards/insights/highlights theo JSON), bỏ ngưỡng cứng "≥30 cards" (vốn ép AI bịa thêm card — xung đột no-placeholder); partial run được phép không có news; click tab thứ 2 bất kỳ (tab có thể bị ẩn).
5. **Đồng bộ tài liệu**: data_cards.md schema `news[]`/panel/insight theo render.js (bỏ schema cũ `news_enrichment`), rendering.md key chỉ số khớp `INDICATOR_LABELS`, SKILL.md bỏ block Verify trùng, xóa `references/images.md` (toàn Unsplash — trái rule offline-first), thêm `scripts/package.json` (QA tự cài Playwright, hết phụ thuộc /tmp).

**Kết quả verify cuối**: render OK · verify PASS (1 warning vô hại: PMI MoM là điểm không phải %) · QA ✅ PASS 26/26 · offline OK.

**Lưu ý cho người sửa skill sau**: QUY TRÌNH CHUẨN = viết report.json → `verify_data.js` (phải PASS/FAIL mới render) → `render.js` → `qa_report.js`. KHÔNG bỏ qua verify.

### 2026-08-03 — Máy render render.js: NỘI DUNG QUYẾT ĐỊNH KHUNG (data-driven)

**Vấn đề**: Template HTML 1300 dòng viết tay mỗi tháng khiến model tốn token, dễ lỗi, và phải "vặn" nội dung cho vừa khuôn (tháng thiếu nguồn → nhét số liệu lạc chỗ, tab trống vẫn hiện). User nhận định: "quá cầu toàn tạo hệ thống template khiến model không thích nghi được sự thay đổi nội dung".

**Thay đổi**: Xây `scripts/render.js` — máy sinh HTML từ JSON:
- Model CHỈ viết `report.json` (dữ liệu + narrative) → `node scripts/render.js` tự sinh toàn bộ `report.html`
- **Nội dung quyết định**: group không có card → tab TỰ ẨN; tháng thiếu nguồn → card vắng tự nhiên; summary tự ẩn khi trống
- Template HTML 1300 dòng thu gọn thành `assets/skin.css` + `assets/skin.js` (giao diện) + `assets/report_template.html` (chỉ còn là tài liệu tham chiếu)
- Schema report.json đổi: `groups[]` (thay `group1_real_economy`...) + `hero_kpis` + card có `meta[[label,value,class]]` + `target{}` + `gauge`
- Bỏ quy tắc "bắt buộc 41 chỉ số" → "tối thiểu 6-8 card quan trọng + card nào có số liệu thật thì làm"

**Files đã sửa**:
- `scripts/render.js` — MỚI: máy render (hero/coverage/nav/groups/cards/panels/insights/summary/footer + inject history + skin)
- `assets/skin.css` + `assets/skin.js` — MỚI: tách từ template (CSS + JS, bỏ yieldCurve cố định, placeholder `/*__HISTORY__*/`)
- `SKILL.md` — Bước 3 (quy tắc số lượng card), Bước 4 (chạy render.js), schema report.json
- `references/data_cards.md` — (xem bên dưới nếu có cập nhật schema card)

**Lưu ý cho người sửa skill sau**: ĐỪNG quay lại viết HTML thủ công. Đổi giao diện → sửa skin.css/skin.js (không sửa từng báo cáo). Muốn thêm loại card mới → thêm hàm render trong render.js.

### 2026-08-03 — Visual V2: sparkline · gauge · phân cấp card · offline-first

**Thay đổi**: Nâng cấp toàn diện giao diện dashboard (theo review visual — user chưa hài lòng bản cũ):

1. **Sparkline trong card** — JS `injectSparklines()` tự chèn đường xu hướng SVG vào mọi card Cấp A khi `history` ≥2 điểm (trước đây phải chờ 6 tháng mới thấy biểu đồ). Xanh/đỏ theo chiều xu hướng. SVG thuần — không phụ thuộc CDN.
2. **Gauge PMI** — nửa vòng tròn mốc 50 trong card PMI (`#pmiGaugeWrap` + `drawGauge()`). Ẩn khi chưa có data (giữ nguyên tắc feature ngủ).
3. **Phân cấp card** — 3 card chủ chốt (CPI, PMI, Cán cân TM) thêm class `primary` (value 32px, viền hồng, shadow). Card phụ giữ mặc định.
4. **Offline-first** — BỎ toàn bộ ảnh Unsplash (hero + si-banner) → gradient + pattern CSS thuần. Thêm guard Chart.js trong modal (nếu CDN không load → thông báo thay vì crash).
5. **Mũi tên ▲▼ màu** — `decorateArrows()` tự chèn mũi tên xanh/đỏ vào số có dấu +/-
6. **Readability** — cỡ chữ tối thiểu 11px → 12px; KPI hero 26→30px; narrative 12.5px.
7. **Modal chart PMI** — thêm đường mốc 50 (annotation).

**Files đã sửa**:
- `assets/report_template.html` — CSS block `VISUAL V2` + 3 card `.primary` + gauge wrap + 4 hàm JS mới (decorateArrows/injectSparklines/drawGauge/guard Chart) + hero/banner gradient local
- `references/rendering.md` — thêm section "Visual V2" (6 quy tắc) + checklist mới
- `scripts/qa_report.js` — đồng bộ spec: 5 tabs/5 groups, takeaways ≥3, hero check bỏ Unsplash, thêm Check 5d (sparkline + gauge)

**Lưu ý cho người sửa skill sau**: KHÔNG khôi phục ảnh Unsplash vào hero/banner. KHÔNG xóa class `primary` khỏi 3 card chính. Sparkline hiện sớm (≥2 kỳ) KHÁC ngưỡng nút modal (≥6 kỳ) — đây là chủ ý, không phải bug.

### 2026-07-03 — Bỏ section Cross-check khỏi dashboard

**Thay đổi**: Xóa hoàn toàn section "🔗 Đối chiếu chéo (Cross-checks)" (6 cặp thẻ đối chiều) khỏi output báo cáo.

**Lý do**: Phần kỹ thuật so sánh nguồn A vs nguồn B không phải insight người dùng cần. Khi thiếu nguồn (3/5 như tháng 6/2026), cross-check trở nên vô nghĩa (4/6 cặp phải "BỎ QUA"), làm dashboard nặng mà không thêm giá trị.

**Files đã sửa**:
- `SKILL.md` — bỏ mention cross-check trong Bước 3.1, Bước 4, schema report.json, Tham khảo
- `references/data_cards.md` — xóa section "## 6 Cross-check pairs" + key_takeaways giảm 5→3 bullets
- `references/rendering.md` — xóa section "## Cross-check: cặp thẻ đối chiều" + CSS `.xc-*` + checklist
- `assets/report_template.html` — bỏ key takeaway #5 + "đã đối chiếu chéo" trong footer
- `scripts/qa_report.js` — bỏ Check 5b + Check 8 (cross-check)

**GIỮ method luận (KHÔNG xóa)**: "cross-check" trong `references/core_rules.md` (Rule 3 Conflict Resolution), `references/preflight_check.md` (lý do all-or-nothing), `references/news_sources.md` — đây là cách **kiểm chứng chéo dữ liệu** để resolve conflict, KHÔNG phải phần hiển thị. Method luận này vẫn cần thiết cho chất lượng data.

**Lưu ý cho người sửa skill sau**: KHÔNG khôi phục section cross-check vào dashboard trừ khi user yêu cầu rõ.

### 2026-07-03 — Thêm nguyên tắc KHÔNG placeholder

**Thay đổi**: Thêm rule "Bước 3.6: Nguyên tắc KHÔNG placeholder" — bỏ hẳn card/section cho phần thiếu dữ liệu, không tạo `missing-card` / `_status: THIẾU`.

**Lý do**: Placeholder "THIẾU" làm dashboard nặng mà không thêm giá trị. Người đọc không cần biết dashboard *đáng lẽ có gì*, chỉ cần biết *có gì*. Khi nguồn publish → chạy lại skill → card tự xuất hiện.

**Files đã sửa**:
- `SKILL.md` — thêm "Bước 3.6: Nguyên tắc KHÔNG placeholder"
- `references/data_cards.md` — thêm section "## Nguyên tắc KHÔNG placeholder" + checklist + ví dụ sai-đúng

**Lưu ý cho người sửa skill sau**: KHÔNG tạo placeholder/missing-card cho phần thiếu data. Chỉ tạo card khi có số liệu thật trace được tới cache.

### 2026-07-03 — Thêm tab "Tổng hợp" + rule placement rc-grid/kt-section

**Thay đổi**: Dashboard có **5 tab** (thêm tab "📊 Tổng hợp"). Rủi ro (`rc-grid`) + Động lực + Key takeaways (`kt-section`) PHẢI nằm trong `<section class="group-section" id="summary">` (tab thứ 5), KHÔNG đặt ngoài group-section.

**Lý do**: Trước đây rc-grid/kt-section đặt ngoài 4 group-section → JS nav chỉ ẩn/hiện group-section → Rủi ro/Động lực luôn hiện bất kể tab nào → sai UX (xem tab Kinh tế thực vẫn thấy Rủi ro). User báo "phần rủi ro và động lực đang là như nhau" khi chuyển tab.

**Files đã sửa**:
- `SKILL.md` — Bước 4 liệt kê template: NAV 5 tab + Section 5 placement rule
- `references/rendering.md` — cập nhật layout diagram (5 tab) + thêm rule "Placement của Rủi ro/Động lực/Key takeaways" + checklist
- `assets/report_template.html` — (sẽ cập nhật ở lần render sau)

**Lưu ý cho người sửa skill sau**: Mọi component muốn ẩn/hiện theo tab → PHẢI nằm trong `<section class="group-section">`. Chỉ HERO, NAV, FOOTER đặt ngoài (luôn hiện).

