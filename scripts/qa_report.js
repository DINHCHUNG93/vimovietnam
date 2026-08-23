#!/usr/bin/env node
/**
 * QA Report — Automated visual QA cho vn-macro-monthly dashboard
 * Pattern học từ vn-research-dashboard/scripts/qa_dashboard.js
 *
 * Usage:
 *   node qa_report.js --url=file:///path/to/report.html
 *   node qa_report.js --url=file:///path/to/report.html --output=./qa-shots
 *
 * Checks:
 *   1. Hero section + verdict badge + 4 KPI boxes
 *   2. NAV tab bar (5 tabs) — click chuyển section được (tab thứ 2 bất kỳ tồn tại)
 *   3. Group sections (5 nhóm, group đầu có card active mặc định)
 *   4. Highlight boxes (so với report.json — không ép ngưỡng cứng)
 *   5. Mật độ cards/panels/insights (so với report.json — KHÔNG ép ≥30)
 *   6. Click-to-chart: nút [📊] mở modal
 *   7. Risks/Catalysts + Key Takeaways (≥3)
 *   8. Footer + disclaimer
 *   9. No JS console errors
 *  10. Screenshots: full-page + hero + 1 group
 *  ⭐ DATA-DRIVEN: đọc report.json cùng thư mục để đối chiếu kỳ vọng thực tế;
 *     partial run (user_override) được phép thiếu news/insight — không đánh warning
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runQA() {
  const args = process.argv.slice(2);
  const urlArg = args.find(a => a.startsWith('--url='));
  const outputArg = args.find(a => a.startsWith('--output='));

  if (!urlArg) {
    console.error('❌ Usage: node qa_report.js --url=file:///path/to/report.html [--output=./qa-shots]');
    process.exit(1);
  }

  const url = urlArg.replace('--url=', '');
  const outputDir = outputArg ? outputArg.replace('--output=', '') : './qa-shots';

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // ═══ DATA-DRIVEN: đọc report.json cùng thư mục để biết kỳ vọng THỰC TẾ ═══
  // (thay các ngưỡng cố định "≥30 cards", "≥5 insights" — vốn ép AI bịa thêm nội dung)
  let R = null;
  try {
    const jsonPath = url.replace(/report\.html$/, 'report.json').replace('file://', '');
    R = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) { /* không có JSON → fallback ngưỡng mềm */ }
  const expectedItems = R ? R.groups.reduce((n, g) => n + (g.cards || []).length + (g.data_items || []).length, 0) : null;
  const expectedLeads = R ? R.groups.filter(g => !!g.lead).length : null;
  const expectedInsights = R ? R.groups.reduce((n, g) => n + (g.cards || []).filter(c => c.type === 'insight').length, 0) : null;
  const expectedHighlights = R ? R.groups.reduce((n, g) => {
    const h = g.highlights || {};
    return n + ((h.neg && h.neg.length ? 1 : 0) + (h.pos && h.pos.length ? 1 : 0)); // đếm KHUNG hiển thị
  }, 0) : null;
  const partialRun = !!(R && R._sources_coverage && R._sources_coverage.user_override);
  // Editorial: news chỉ tồn tại trong schema card cũ — JSON không khai báo card nào thì bỏ qua check
  const hasLegacyCards = !!(R && R.groups.some(g => (g.cards || []).length > 0));

  console.log(`🔍 QA Macro Monthly — Testing: ${url}`);
  console.log(`📁 Output: ${outputDir}`);
  if (R) console.log(`📋 Data-driven: ${expectedItems} items · ${expectedLeads} leads · ${expectedInsights} insights · ${expectedHighlights} highlights · partial=${partialRun}\n`);
  else console.log('⚠️ Không đọc được report.json — dùng ngưỡng mềm\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1480, height: 900 } });

  const errors = [];
  const warnings = [];
  const passes = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`Page error: ${err.message}`));

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
  } catch (e) {
    errors.push(`Navigation: ${e.message}`);
  }

  // === CHECK 1: Hero + verdict + KPI ===
  console.log('📊 Check 1: Hero & KPI...');
  const heroCount = await page.$$eval('.hero', els => els.length);
  if (heroCount > 0) passes.push('Hero section present ✓');
  else errors.push('Hero section NOT found');

  const verdictCount = await page.$$eval('.verdict-badge', els => els.length);
  if (verdictCount > 0) passes.push('Verdict badge present ✓');
  else warnings.push('Verdict badge NOT found');

  const kpiCount = await page.$$eval('.kpi', els => els.length);
  if (kpiCount >= 4) passes.push(`KPI boxes: ${kpiCount} (≥4) ✓`);
  else warnings.push(`KPI boxes: only ${kpiCount} (expected ≥4)`);

  // === CHECK 2: NAV tabs (động — số tab = số nhóm CÓ nội dung + summary nếu có) ===
  console.log('🧭 Check 2: NAV tabs...');
  const expectedGroups = R ? R.groups.filter(g => (g.cards || []).length > 0 || !!g.lead).length : null;
  const hasSummary = !!(R && (R.risks?.length || R.catalysts?.length || R.key_takeaways?.length));
  const expectedTabs = expectedGroups != null ? expectedGroups + (hasSummary ? 1 : 0) : null;
  const navTabs = await page.$$eval('.nav-tab', els =>
    els.map(t => ({ target: t.dataset.target, text: t.textContent.trim(), isActive: t.classList.contains('active') }))
  );
  if (expectedTabs != null) {
    if (navTabs.length === expectedTabs) passes.push(`NAV: ${navTabs.length} tabs (khớp JSON: ${expectedTabs}) ✓`);
    else warnings.push(`NAV: ${navTabs.length} tabs (JSON kỳ vọng ${expectedTabs} — dư/thiếu tab?)`);
  } else if (navTabs.length >= 2) passes.push(`NAV: ${navTabs.length} tabs ✓`);
  else warnings.push(`NAV: ${navTabs.length} tabs (không có JSON để đối chiếu)`);

  const activeDefault = navTabs.filter(t => t.isActive);
  if (activeDefault.length === 1 && activeDefault[0].target === 'group1') {
    passes.push('NAV: group1 active by default ✓');
  } else {
    warnings.push('NAV: group1 not active by default');
  }

  // === CHECK 3: Group sections (động — khớp số nhóm có nội dung + summary) ===
  console.log('📋 Check 3: Group sections...');
  const groups = await page.$$eval('.group-section', els =>
    els.map(g => ({ id: g.id, isActive: g.classList.contains('active') }))
  );
  if (expectedTabs != null) {
    if (groups.length === expectedTabs && groups.some(g => g.id === 'summary')) {
      passes.push(`Group sections: ${groups.length} (khớp JSON — gồm #summary) ✓`);
    } else {
      warnings.push(`Group sections: ${groups.length} (JSON kỳ vọng ${expectedTabs} — gồm #summary)`);
    }
  } else if (groups.length >= 2) passes.push(`Group sections: ${groups.length} ✓`);
  else warnings.push(`Group sections: ${groups.length} (không có JSON để đối chiếu)`);

  // === CHECK 4: Highlight boxes (so với JSON — không ép ≥4/bên) ===
  console.log('🎯 Check 4: Highlight boxes...');
  const negBoxes = await page.$$eval('.highlight-box.neg', els => els.length);
  const posBoxes = await page.$$eval('.highlight-box.pos', els => els.length);
  const hlTotal = negBoxes + posBoxes;
  if (expectedHighlights != null) {
    if (hlTotal >= expectedHighlights) passes.push(`Highlights: ${hlTotal} (khớp JSON: ${expectedHighlights}) ✓`);
    else warnings.push(`Highlights: ${hlTotal} (JSON khai báo ${expectedHighlights} — thiếu?)`);
  } else if (negBoxes >= 4 && posBoxes >= 4) {
    passes.push(`Highlight boxes: ${negBoxes} neg + ${posBoxes} pos ✓`);
  } else {
    warnings.push(`Highlight boxes: ${negBoxes} neg + ${posBoxes} pos (không có JSON để đối chiếu)`);
  }

  // === CHECK 5: Data items/cards + panels + insights (so với JSON — KHÔNG ép mật độ) ===
  console.log('📇 Check 5: Mật độ thông tin...');
  const dataCards = await page.$$eval('.data-card', els => els.length);
  const edItems = await page.$$eval('.ed-item', els => els.length);
  const panels = await page.$$eval('.panel', els => els.length);
  const specialInsights = await page.$$eval('.special-insight', els => els.length);
  const narratives = await page.$$eval('.dc-narrative', els => els.length);
  const newsItems = await page.$$eval('.dc-news-item', els => els.length);
  const totalDense = dataCards + edItems + panels + specialInsights;
  if (expectedItems != null) {
    if (totalDense >= expectedItems) passes.push(`Mật độ: ${dataCards} cards + ${edItems} ed-items + ${panels} panels + ${specialInsights} insights = ${totalDense} (khớp JSON: ${expectedItems}) ✓`);
    else warnings.push(`Thiếu nội dung: HTML ${totalDense} < JSON ${expectedItems} — render thiếu item/card`);
  } else if (totalDense >= 10) passes.push(`Mật độ: ${totalDense} (≥10) ✓`);
  else warnings.push(`Mật độ thấp: ${totalDense} (không có JSON để đối chiếu)`);
  // Editorial: đoạn dẫn (lead) thay vai trò "kể chuyện" của narrative card cũ
  const leads = await page.$$eval('.ed-lead', els => els.length);
  if (expectedLeads != null && expectedLeads > 0) {
    if (leads >= expectedLeads) passes.push(`Lead editorial: ${leads} đoạn dẫn (khớp JSON: ${expectedLeads}) ✓`);
    else warnings.push(`Lead editorial: ${leads} (JSON khai báo ${expectedLeads} — thiếu?)`);
  } else if (narratives > 0) passes.push(`Narrative (kể chuyện số liệu): ${narratives} card ✓`);
  else if (leads > 0) passes.push(`Lead editorial: ${leads} đoạn dẫn ✓`);
  else warnings.push('Không có lead editorial cũng không có narrative (thiếu phần kể chuyện)');
  if (newsItems > 0) passes.push(`News enrichment: ${newsItems} tin embed ✓`);
  else if (partialRun) passes.push('News: 0 tin (partial run — bỏ qua enrich đúng spec) ✓');
  else if (!hasLegacyCards) passes.push('News: 0 tin (editorial — news thuộc schema card cũ, không áp dụng) ✓');
  else warnings.push('News enrichment: 0 tin (full run — nên có)');

  // === CHECK 5b: Special insights (so với JSON — không ép ≥5) ===
  console.log('🔬 Check 5b: Special insights...');
  if (expectedInsights != null) {
    if (specialInsights >= expectedInsights) passes.push(`Special insights: ${specialInsights} (khớp JSON: ${expectedInsights}) ✓`);
    else warnings.push(`Special insights: ${specialInsights} (JSON khai báo ${expectedInsights})`);
  } else if (specialInsights >= 1) passes.push(`Special insights: ${specialInsights} ✓`);
  else passes.push('Special insights: 0 (không có JSON — chấp nhận)');

  // Images — Hero dùng gradient local (KHÔNG phụ thuộc Unsplash — ổn định offline)
  console.log('📷 Check 5c: Images...');
  const heroHasBg = await page.$eval('.hero', el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none';
  }).catch(() => false);
  if (heroHasBg) passes.push('Hero có background (gradient local) ✓');
  else warnings.push('Hero thiếu background');

  // Banner insight đã BỎ theo thiết kế mới (trước đây là ảnh/gradient trống 140px — "khoảng trống chết")
  const insightBanners = await page.$$eval('.si-banner', els => els.length);
  if (insightBanners === 0) passes.push('Insight không có banner trống (thiết kế mới) ✓');
  else warnings.push(`Insight còn ${insightBanners} banner — nên bỏ (khoảng trống chết)`);

  // === CHECK 5d: Visual V2 — sparkline + gauge PMI (gauge chỉ bắt buộc khi JSON khai báo) ===
  console.log('📈 Check 5d: Sparkline + Gauge (Visual V2)...');
  const sparkInfo = await page.$$eval('.dc-spark', els => ({
    total: els.length,
    visible: els.filter(e => e.offsetParent !== null).length
  }));
  if (sparkInfo.visible > 0) passes.push(`Sparkline: ${sparkInfo.visible} đường xu hướng hiển thị ✓`);
  else passes.push(`Sparkline: 0 hiển thị (history <2 kỳ — feature ngủ chờ data, đúng spec)`);

  const jsonHasGauge = R ? R.groups.some(g => (g.cards || []).some(c => !!c.gauge)) : false;
  const gaugeDrawn = await page.$eval('#pmiGauge', el => el.childElementCount > 0).catch(() => false);
  const gaugeVisible = await page.$eval('.gauge-wrap', el => el.offsetParent !== null).catch(() => false);
  if (!jsonHasGauge) {
    passes.push('Gauge PMI: không khai báo trong JSON kỳ này (editorial) — bỏ qua ✓');
  } else if (gaugeDrawn && gaugeVisible) passes.push('Gauge PMI: đã vẽ + hiển thị ✓');
  else if (gaugeDrawn) passes.push('Gauge PMI: đã vẽ (ẩn do chưa có data — đúng spec) ✓');
  else warnings.push('Gauge PMI chưa vẽ');

  const signalCards = await page.$$eval('.data-card.signal-red, .data-card.signal-green, .data-card.signal-amber', els => els.length);
  const signalItems = await page.$$eval('.ed-value.pos, .ed-value.neg, .ed-value.neu', els => els.length);
  if (signalCards + signalItems > 0) passes.push(`Signal-flagged: ${signalCards} cards + ${signalItems} ed-items ✓`);

  // === CHECK 6: NAV click chuyển section ===
  console.log('🖱️  Check 6: NAV click interaction...');
  try {
    // Click tab THỨ 2 (nếu tồn tại) — data-driven: tab group2 có thể đã bị ẩn
    const tabCount = await page.$$eval('.nav-tab', els => els.length);
    if (tabCount < 2) {
      passes.push('NAV: chỉ 1 tab — không thể test chuyển tab (chấp nhận) ✓');
    } else {
      const secondTarget = await page.$eval('.nav-tab:nth-child(2)', el => el.dataset.target);
      await page.click(`.nav-tab[data-target="${secondTarget}"]`, { timeout: 3000 });
      await page.waitForTimeout(400);
      const targetActive = await page.$eval(`#${secondTarget}`, el => el.classList.contains('active'));
      if (targetActive) passes.push(`NAV click → ${secondTarget} active ✓`);
      else errors.push(`NAV click ${secondTarget} did NOT activate`);

      // Verify only 1 active at a time
      const activeGroups = await page.$$eval('.group-section.active', els => els.length);
      if (activeGroups === 1) passes.push('Only 1 group active after click ✓');
      else warnings.push(`${activeGroups} groups active (expected 1)`);
    }
  } catch (e) {
    warnings.push(`NAV click test failed: ${e.message}`);
  }

  // === CHECK 7: Chart buttons — ẩn khi history <6 ===
  console.log('📈 Check 7: Chart buttons (ẩn khi <6 tháng data)...');
  const jsonHasChartCards = R ? R.groups.some(g => (g.cards || []).some(c => !!c.has_chart)) : false;
  const allChartBtns = await page.$$eval('.dc-chart-btn', els => ({
    total: els.length,
    visible: els.filter(b => b.style.display !== 'none' && b.offsetParent !== null).length,
    hidden: els.filter(b => b.style.display === 'none').length
  }));
  if (allChartBtns.total === 0 && !jsonHasChartCards) {
    passes.push('Chart buttons: 0 (JSON kỳ này không khai báo has_chart — editorial, đúng spec) ✓');
  } else if (allChartBtns.total > 0) {
    passes.push(`Chart buttons: ${allChartBtns.total} total (${allChartBtns.visible} visible, ${allChartBtns.hidden} ẩn do <6 tháng) ✓`);
    // Verify quy tắc: nút có <6 điểm phải ẨN (display:none), nút có ≥6 điểm mới HIỆN
    if (allChartBtns.hidden > 0) {
      passes.push(`Quy tắc ẩn nút khi thiếu data: ${allChartBtns.hidden} nút đã ẩn ✓`);
    }
    if (allChartBtns.visible > 0) {
      // Test modal mở được với nút VISIBLE (đủ data)
      try {
        await page.click('.nav-tab[data-target="group1"]', { timeout: 2000 });
        await page.waitForTimeout(200);
        // Click nút visible đầu tiên (CPI/PMI có 5 điểm — demo)
        const visibleBtnSelector = '.dc-chart-btn:not([style*="display: none"])';
        await page.click(visibleBtnSelector, { timeout: 3000 });
        await page.waitForTimeout(500);
        const modalActive = await page.$eval('#chartModal', el => el.classList.contains('active'));
        if (modalActive) {
          passes.push('Chart modal mở khi click nút đủ data ✓');
          const modalCanvas = await page.$eval('#modalChart', el => el.tagName === 'CANVAS');
          if (modalCanvas) passes.push('Modal có canvas ✓');
          await page.click('.modal-close', { timeout: 2000 });
          await page.waitForTimeout(200);
        } else {
          warnings.push('Chart modal không mở khi click nút visible');
        }
      } catch (e) {
        warnings.push(`Modal test: ${e.message}`);
      }
    } else {
      passes.push('Không có nút visible (toàn bộ <6 tháng) — đúng behavior ✓');
    }
  } else {
    warnings.push('Không có nút chart nào (template sai)');
  }

  // === CHECK 9: Risks/Catalysts + Takeaways ===
  console.log('⚠️ Check 9: Risks/Catalysts/Takeaways...');
  const risksCount = await page.$$eval('.rc-box.risks .rc-item', els => els.length);
  const catalystsCount = await page.$$eval('.rc-box.catalysts .rc-item', els => els.length);
  if (risksCount >= 3 && catalystsCount >= 3) {
    passes.push(`Risks (${risksCount}) + Catalysts (${catalystsCount}) ✓`);
  } else {
    warnings.push(`Risks (${risksCount}) + Catalysts (${catalystsCount}) — expected ≥3 each`);
  }

  const takeawayCount = await page.$$eval('.takeaways li', els => els.length);
  if (takeawayCount >= 3) passes.push(`Key takeaways: ${takeawayCount} (≥3) ✓`);
  else warnings.push(`Key takeaways: ${takeawayCount} (expected ≥3)`);

  // === CHECK 10: Footer + disclaimer ===
  console.log('📝 Check 10: Footer...');
  const footerCount = await page.$$eval('footer', els => els.length);
  const disclaimerCount = await page.$$eval('.disclaimer', els => els.length);
  if (footerCount > 0 && disclaimerCount > 0) passes.push('Footer + disclaimer ✓');
  else warnings.push('Footer or disclaimer missing');

  // === CHECK 11: JS errors ===
  console.log('🔧 Check 11: JS errors...');
  if (errors.length === 0) passes.push('No JS console errors ✓');

  // === SCREENSHOTS ===
  console.log('📸 Screenshots...');
  await page.screenshot({ path: path.join(outputDir, 'full-page.png'), fullPage: true });
  passes.push('Full page screenshot ✓');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(outputDir, 'hero.png'),
    clip: { x: 0, y: 0, width: 1480, height: 650 }
  });

  // Group 1 view (default)
  await page.click('.nav-tab[data-target="group1"]', { timeout: 2000 });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const nav = document.querySelector('.nav-tabs');
    if (nav) window.scrollTo({ top: nav.offsetTop - 10, behavior: 'instant' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(outputDir, 'group1-real-economy.png'),
    clip: { x: 0, y: 0, width: 1480, height: 900 }
  });

  // === REPORT ===
  console.log('\n' + '='.repeat(60));
  console.log('📋 QA REPORT — vn-macro-monthly');
  console.log('='.repeat(60));

  console.log(`\n✅ PASSES (${passes.length}):`);
  passes.forEach(p => console.log(`  ✓ ${p}`));

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`);
    errors.forEach(e => console.log(`  ✗ ${e}`));
  }

  console.log('\n' + '='.repeat(60));
  const status = errors.length > 0 ? '❌ FAIL' : warnings.length > 0 ? '⚠️  PASS WITH WARNINGS' : '✅ PASS';
  console.log(`Result: ${status}`);
  console.log(`Screenshots: ${outputDir}/{full-page,hero,group1-real-economy}.png`);
  console.log('='.repeat(60));

  await browser.close();
  process.exit(errors.length > 0 ? 2 : warnings.length > 0 ? 1 : 0);
}

runQA().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(3);
});
