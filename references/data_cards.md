# Input Editorial — Hướng dẫn viết report.json (triết lý: bản tin, không dashboard)

> ⚠️ **SCHEMA CHUẨN (source of truth) = header `scripts/render.js`** — máy render chỉ đọc đúng schema đó.
> File này dạy **cách xử lý INPUT**: đọc cache → chọn chủ đề → viết lead → chọn biểu đồ → xây data_items.
> Đọc cùng `SKILL.md` mục "Định vị sản phẩm" (bản tin phân tích, KHÔNG phải dashboard).

## Mục lục

- [Quy trình extract 5 bước (BẮT BUỘC)](#quy-trình-extract-5-bước-bắt-buộc)
- [Schema nhóm editorial](#schema-nhóm-editorial)
- [Lead — đoạn dẫn (quan trọng nhất)](#lead--đoạn-dẫn-quan-trọng-nhất)
- [Graph — biểu đồ minh họa](#graph--biểu-đồ-minh-họa)
- [Data items — dòng dữ liệu](#data-items--dòng-dữ-liệu)
- [Danh mục chỉ số gợi ý theo chủ đề](#danh-mục-chỉ-số-gợi-ý-theo-chủ-đề)
- [Risks / Catalysts / Key takeaways](#risks--catalysts--key-takeaways)
- [Nguyên tắc KHÔNG placeholder (BẮT BUỘC)](#nguyên-tắc-không-placeholder-bắt-buộc)
- [Phụ lục: schema card cũ (legacy)](#phụ-lục-schema-card-cũ-legacy)

---

## Quy trình extract 5 bước (BẮT BUỘC)

Viết report.json theo trình tự này — mỗi bước có mục đích riêng, đừng nhảy cóc:

```
B1. ĐỌC toàn bộ sources_cache/ → liệt kê CHỦ ĐỀ có dữ liệu thật
    (không bắt đầu từ danh sách chỉ số — bắt đầu từ dữ liệu có)
B2. CHỌN 5-6 nhóm chủ đề (3-5 mục/nhóm, tối đa 6) — chủ đề nổi bật tháng đó
B3. Với mỗi nhóm: viết LEAD (2-3 câu kể chuyện, ≥2 con số) — câu chuyện chính của nhóm
B4. Chọn GRAPH (1 biểu đồ/nhóm) — phép so sánh quan trọng nhất của nhóm
B5. Xây DATA_ITEMS (3-5 dòng) — chi tiết còn lại, mỗi dòng 1 chỉ số
```

**Nguyên tắc vàng**: LEAD quyết định nhóm, DATA_ITEMS bổ sung chi tiết, GRAPH minh họa 1 phép so sánh. Nếu 1 con số không vào được lead/item nào → nó không đáng đưa vào báo cáo.

## Schema nhóm editorial

```json
{
  "id": "group2",
  "tab": "Giá cả",                              /* tên ngắn trên thanh tab */
  "title": "Giá cả — lạm phát & kim loại quý",  /* tiêu đề đầy đủ */
  "tag": "g2",                                  /* màu tag (g1-g6) */
  "source_note": "Nguồn: TCTK",                 /* nguồn của nhóm */
  "lead": "CPI YoY tháng 7 đạt <span class=\"num\">4.45%</span>, tụt dưới mục tiêu 4.5% sau đỉnh <span class=\"num\">5.60%</span> hồi tháng 5 — chuỗi hạ nhiệt tháng thứ 2 liên tiếp.",
  "graph": {
    "type": "bar",
    "title": "CPI YoY: đỉnh T5 → hạ nhiệt T7 (mốc mục tiêu 4.5%)",
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

| Field | Bắt buộc | Quy tắc (máy verify bắt) |
|---|---|---|
| `tab` | ✅ | Tên ngắn ≤ 6 từ, hiện trên thanh tab |
| `title` | ✅ | 5-9 từ, có " — " tách phần bổ nghĩa |
| `lead` | ✅ | 70-120 từ, **≥2 con số**, ≤130 từ, KHÔNG từ dự báo |
| `graph` | ⚠️ nên có | 2-10 cột bar; line tự ẩn khi history <2 điểm |
| `data_items` | ✅ | 3-5 dòng (tối đa 6), mỗi dòng đủ name+value+signal+note |

## Lead — đoạn dẫn (quan trọng nhất)

**Lead = 2-3 câu kể chuyện số liệu của nhóm** — người đọc chỉ đọc lead + graph là hiểu nhóm nói gì.

**HTML cho phép** (render.js đã có CSS sẵn):
- `<span class="num">4.45%</span>` — số liệu (tự màu cyan, mono font)
- `<strong>xuất siêu 10.35 tỷ USD</strong>` — nhấn mạnh ý (tự màu tím)

**Cấu trúc 3 nhịp (template)**:
```
[1] Con số chính + bối cảnh:    "PMI tăng từ 51.8 lên 52.9 — cải thiện mạnh nhất kể từ 2/2026..."
[2] Kết nối 1-2 số khác:        "Cùng lúc IIP tháng 7 tăng +14.5% YoY, 7T +11.4%..."
[3] Diễn giải bằng số:          "Hai số liệu khác phương pháp cùng xác nhận sản xuất mở rộng đồng bộ..."
```

**Quy tắc tone — "Người kể chuyện số liệu, KHÔNG phải người cho ý kiến"**:

| ❌ Tránh | ✅ Làm |
|---|---|
| "CPI vượt target → NHNN sẽ phải siết tiền tệ" | "CPI 4.45% tụt dưới mục tiêu 4.5% tháng thứ 2 liên tiếp, cùng lúc chi phí đầu vào PMI chậm nhất từ 9/2025 — hai số này cùng kể câu chuyện lạm phát hạ nhiệt." |
| "Tôi dự báo Q3 khó khăn" | "FDI đăng ký +58% nhưng vốn ra nước ngoài gấp 4.5 lần — hai luồng vốn cùng tăng định hình vị thế trung chuyển." |
| "Bán lẻ tăng đáng lo vì chủ yếu do giá" | "Bán lẻ +13.1% danh nghĩa, loại giá còn +7.5% — khoảng cách 5.6 điểm phần trăm cho thấy gần nửa mức tăng đến từ giá." |

**4 ĐỪNG**:
1. ĐỪNG dùng "tôi nghĩ/có thể/dự báo/sẽ tăng" → dùng "số liệu cho thấy", "cùng lúc" (máy verify bắt)
2. ĐỪNG khuyên mua/bán → chỉ kể diễn biến số
3. ĐỪNG tính từ cảm tính ("đáng lo", "tốt") → dùng số so sánh ("+269.9%", "đỉnh 5 tháng")
4. ĐỪNG kết luận định hướng → để số tự nói

## Graph — biểu đồ minh họa

**Mỗi nhóm TỐI ĐA 1 biểu đồ** — vẽ phép so sánh quan trọng nhất (minh họa, không phải trang trí).

### Bar (mặc định — vẽ được ngay từ số của tháng)

```json
{"type": "bar", "title": "Cán cân thương mại 7T: xuất siêu → nhập siêu (tỷ USD)",
 "items": [
   {"label": "7T 2025", "value": 10.35, "color": "pos"},
   {"label": "7T 2026", "value": -20.52, "color": "neg"}
 ]}
```

**Khi nào dùng bar**: so sánh 2-6 đối tượng (tháng này vs tháng trước, danh nghĩa vs loại giá, thu vs chi, theo ngành...).
**Màu cột** (tự động): `pos` = xanh · `neg` = đỏ · `target` = vàng (mốc mục tiêu/ngưỡng — KHÔNG có màu = tím mặc định).
**Mốc tham chiếu** (mục tiêu 4.5%, ngưỡng 50) → thêm 1 cột `{"label":"Mục tiêu","value":4.5,"color":"target"}`.
**Giá trị âm** → cột vẽ xuống dưới đường 0 (đứt nét) — dùng cho đảo chiều cán cân.
**2-10 cột** — quá 10 → chọn cột đại diện (máy verify bắt).

### Line (chỉ khi history đủ 2+ điểm)

```json
{"type": "line", "series_key": "cpi_yoy_pct", "title": "CPI YoY — xu hướng 2+ tháng"}
```

- `series_key` phải khớp key trong `history.json` (render.js tự nạp + tự vẽ)
- History <2 điểm → graph TỰ ẨN (feature ngủ chờ data — KHÔNG phải bug, xem rendering.md)
- Kỳ đầu tiên (1 điểm) → dùng bar thay vì line

### Line chart SVG spec (render.js vẽ tự động — model chỉ khai báo)
- ≥2 điểm mới vẽ · fill vùng dưới đường · chấm tròn điểm cuối · nhãn tháng dưới trục · xanh nếu điểm cuối ≥ điểm đầu, đỏ nếu ngược

## Data items — dòng dữ liệu

**Mỗi dòng = 1 chỉ số**: tên + số lớn (màu tín hiệu) + ghi chú kèm số so sánh.

```json
{"name": "Xuất khẩu T7", "value": "53.08 tỷ", "signal": "pos", "note": "+25.0% YoY ▲ · MoM +4.5% · 7T 319.5 tỷ (+21.7%)"}
```

**Quy tắc** (máy verify bắt):
- `value` — số + đơn vị, **1 định dạng nhất quán** ("53.08 tỷ", "+14.5%", "1,138.5 nghìn ha")
- `signal` — `pos` (xanh) / `neg` (đỏ) / `neu` (vàng) — theo hướng tốt/xấu/trung tính của CHỈ SỐ đó
- `note` — ≤22 từ, **≥1 con số so sánh** (MoM/YoY/so cùng kỳ/so mốc) — dòng không có số so sánh = quá nông
- Dấu ▲/▼ tự chèn màu (skin.js decorateArrows) — không cần viết trong note
- `name` — tên ngắn gọn; máy verify kiểm tra bounds theo tên (CPI/PMI/IIP/Xuất khẩu/Nhập khẩu/FDI/Bán lẻ/Khách quốc tế/Ngân sách/Lúa...)

## Danh mục chỉ số gợi ý theo chủ đề

> KHÔNG phải luật "phải đủ" — danh mục để CHỌN theo dữ liệu thật trong cache. Nhóm nào có số liệu thật thì bắt buộc đưa vào.

| Chủ đề (nhóm đề xuất) | Chỉ số thường có (NSO/Customs/PMI/VBMA/VNBA) |
|---|---|
| **Tăng trưởng & Sản xuất** | PMI, IIP, lao động công nghiệp, tiêu thụ điện |
| **Giá cả** | CPI (cơ bản), giá vàng, giá USD, giá dầu (context) |
| **Ngoại thương** | cán cân TM, XK, NK, XK theo thị trường (Mỹ/TQ/EU), NK tư liệu sản xuất, khu vực FDI vs nội địa |
| **Vốn & Đầu tư** | FDI đăng ký/thực hiện/vốn ra, đầu tư NSNN, thu-chi ngân sách |
| **Doanh nghiệp & Tiêu dùng** | bán lẻ (danh nghĩa/loại giá), khách quốc tế, DN mới/rút lui, vận tải |
| **Ngành & Khu vực I** | PMI sub-indices, XNK theo khu vực, nông-lâm-thủy sản, lúa/chăn nuôi |
| **Tiền tệ & Tài chính** (khi đủ VBMA/VNBA) | LNH, tỷ giá trung tâm, TPCP yield, tín dụng, huy động |

**Cách nhóm tháng đó**: 2 nguồn → 4-5 nhóm; 3 nguồn → 5-6 nhóm; 5 nguồn → 6-7 nhóm. Nhóm thiếu dữ liệu → không khai báo.

## Risks / Catalysts / Key takeaways

### Risks (rủi ro)

```json
"risks": [
  {"level": "Rất cao", "risk": "Mô tả rủi ro + số liệu"},
  {"level": "Cao", "risk": "..."},
  {"level": "Trung bình", "risk": "..."}
]
```

3-5 items, level cao nhất lên đầu. Mỗi item PHẢI kèm số liệu thật.

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

Bullet #1 luôn bắt đầu bằng ⭐.

---

## Nguyên tắc KHÔNG placeholder (BẮT BUỘC)

**Chỉ đưa vào báo cáo những gì CÓ DỮ LIỆU THẬT trace được tới `sources_cache/`.**

| Tình huống | Hành động |
|---|---|
| Có số liệu (primary hoặc secondary source) | ✅ Thêm vào lead/data_items/graph |
| Thiếu số liệu (nguồn chưa publish) | ❌ BỎ QUA — không tạo mục |
| Chỉ có định nghĩa/sơ bộ/không trace được | ❌ BỎ QUA |

**4 ĐỪNG**:
1. ĐỪNG tạo mục "THIẾU VNBA — sẽ có khi publish" trong lead/data_items
2. ĐỪNG tạo entry `_status: "THIẾU"` trong report.json
3. ĐỪNG để nhóm rỗng / graph rỗng
4. ĐỪNG giải thích dài về việc thiếu — **chỉ 1 dòng** coverage-warn ở hero (tự render khi `_sources_coverage.user_override=true`)

**Ngoại lệ DUY NHẤT**: coverage warning hero khi partial run — do render.js tự sinh từ `_sources_coverage`, model KHÔNG viết tay.

**Checklist trước khi chốt report.json**:
- [ ] Mọi con số trace được tới file cụ thể trong `sources_cache/`?
- [ ] Nguồn publish ≤ data_cutoff (rule thời gian)?
- [ ] Mỗi nhóm: lead ≥2 số + 3-5 data_items + (nên có) 1 graph?
- [ ] Mọi signal pos/neg/neu đúng hướng tốt/xấu của chỉ số?
- [ ] Verdict khớp màu với phần lớn số liệu (không "TÍCH CỰC" khi toàn đỏ)?
- [ ] Lead/note không từ dự báo, không khuyến nghị?

---

## Phụ lục: schema card cũ (legacy)

> **CHỈ báo cáo cũ dùng** — nhóm mới PHẢI viết theo editorial. Schema này render.js vẫn đọc (tương thích ngược), máy verify vẫn check, nhưng ĐỪNG dùng cho kỳ mới.

```json
{
  "type": "card", "key": "cpi", "name": "CPI YoY", "flag": "🟢",
  "signal": "green", "primary": true, "wide": true,
  "value": "4.45", "unit": "%", "value_class": "pos",
  "target": {"badge": "TRONG MỤC TIÊU -0.05đđ", "text": "mục tiêu 4.5%", "progress": 99, "progress_class": "met"},
  "meta": [["MoM", "-0.12%", "neg"], ["7T bình quân", "4.39%", ""]],
  "why": "1-2 câu vì sao quan trọng",
  "narrative": "2-4 câu kể chuyện số liệu",
  "has_chart": true, "indicator": "cpi_yoy_pct",
  "news": [{"title": "...", "url": "...", "source": "...", "date": "...", "insight": "...", "sentiment": "TIÊU CỰC"}]
}
```

- `panel` (bảng) và `insight` (phân tích sâu) vẫn hỗ trợ trong nhóm card cũ
- News enrichment (tối đa 2 tin/card, publish ≤ cutoff, ưu tiên có quote chuyên gia) — chỉ áp dụng cho card legacy; báo cáo editorial thường không cần
