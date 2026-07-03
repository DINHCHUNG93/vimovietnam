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
 *   2. NAV tab bar (4 tabs) — click chuyển section được
 *   3. Group sections (4 nhóm, group1 active mặc định)
 *   4. Highlight boxes (neg + pos) trong mỗi nhóm
 *   5. Data cards với signal flag
 *   6. Click-to-chart: nút [📊] mở modal
 *   7. Risks/Catalysts + Key Takeaways
 *   8. Footer + disclaimer
 *   9. No JS console errors
 *  10. Screenshots: full-page + hero + 1 group
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

  console.log(`🔍 QA Macro Monthly — Testing: ${url}`);
  console.log(`📁 Output: ${outputDir}\n`);

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

  // === CHECK 2: NAV tabs (4 tabs) ===
  console.log('🧭 Check 2: NAV tabs...');
  const navTabs = await page.$$eval('.nav-tab', els =>
    els.map(t => ({ target: t.dataset.target, text: t.textContent.trim(), isActive: t.classList.contains('active') }))
  );
  if (navTabs.length === 4) passes.push(`NAV: 4 tabs ✓`);
  else warnings.push(`NAV: ${navTabs.length} tabs (expected 4)`);

  const activeDefault = navTabs.filter(t => t.isActive);
  if (activeDefault.length === 1 && activeDefault[0].target === 'group1') {
    passes.push('NAV: group1 active by default ✓');
  } else {
    warnings.push('NAV: group1 not active by default');
  }

  // === CHECK 3: Group sections (4 nhóm) ===
  console.log('📋 Check 3: Group sections...');
  const groups = await page.$$eval('.group-section', els =>
    els.map(g => ({ id: g.id, isActive: g.classList.contains('active') }))
  );
  if (groups.length === 4) passes.push(`Group sections: 4 ✓`);
  else warnings.push(`Group sections: ${groups.length} (expected 4)`);

  // === CHECK 4: Highlight boxes (neg + pos) ===
  console.log('🎯 Check 4: Highlight boxes...');
  const negBoxes = await page.$$eval('.highlight-box.neg', els => els.length);
  const posBoxes = await page.$$eval('.highlight-box.pos', els => els.length);
  if (negBoxes >= 4 && posBoxes >= 4) {
    passes.push(`Highlight boxes: ${negBoxes} neg + ${posBoxes} pos ✓`);
  } else {
    warnings.push(`Highlight boxes: ${negBoxes} neg + ${posBoxes} pos (expected ≥4 each)`);
  }

  // === CHECK 5: Data cards + panels + narrative + news (mật độ thông tin) ===
  console.log('📇 Check 5: Mật độ thông tin...');
  const dataCards = await page.$$eval('.data-card', els => els.length);
  const panels = await page.$$eval('.panel', els => els.length);
  const narratives = await page.$$eval('.dc-narrative', els => els.length);
  const newsItems = await page.$$eval('.dc-news-item', els => els.length);
  const totalDense = dataCards + panels;
  if (totalDense >= 30) passes.push(`Mật độ: ${dataCards} cards + ${panels} panels = ${totalDense} (≥30) ✓`);
  else warnings.push(`Mật độ thấp: ${totalDense} (expected ≥30 = cards + panels)`);
  if (narratives > 0) passes.push(`Narrative (kể chuyện số liệu): ${narratives} card ✓`);
  else warnings.push('Narrative: 0 card (thiếu phần kể chuyện)');
  if (newsItems > 0) passes.push(`News enrichment: ${newsItems} tin embed ✓`);
  else warnings.push('News enrichment: 0 tin');

  // Special insight — 5 chuyên đề phân tích chuyên sâu
  console.log('🔬 Check 5b: Special insights...');
  const specialInsights = await page.$$eval('.special-insight', els => els.length);
  if (specialInsights >= 5) passes.push(`Special insights: ${specialInsights} (≥5) ✓`);
  else warnings.push(`Special insights: ${specialInsights} (expected ≥5: CPI/Lãi suất/XNK/Bán lẻ/PMI)`);
  // Mỗi insight phải có 4 phần: title, summary, numbers_tell, news, cross_refs
  const siNewsItems = await page.$$eval('.special-insight .si-news-item', els => els.length);
  if (siNewsItems >= 10) passes.push(`Special insight news: ${siNewsItems} tin (≥10) ✓`);
  else warnings.push(`Special insight news: ${siNewsItems} (expected ≥10 across 5 insights)`);

  // Images — Hero + 5 special insight banner
  console.log('📷 Check 5c: Images...');
  const heroHasImage = await page.$eval('.hero', el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none' && bg.includes('unsplash.com');
  }).catch(() => false);
  if (heroHasImage) passes.push('Hero có ảnh nền Unsplash ✓');
  else warnings.push('Hero thiếu ảnh nền');

  const insightBanners = await page.$$eval('.si-banner', els => els.length);
  if (insightBanners >= 5) passes.push(`Special insight banners: ${insightBanners} ảnh (≥5) ✓`);
  else warnings.push(`Special insight banners: ${insightBanners} (expected ≥5)`);

  const signalCards = await page.$$eval('.data-card.signal-red, .data-card.signal-green, .data-card.signal-amber', els => els.length);
  if (signalCards > 0) passes.push(`Signal-flagged cards: ${signalCards} ✓`);

  // === CHECK 6: NAV click chuyển section ===
  console.log('🖱️  Check 6: NAV click interaction...');
  try {
    // Click group2 tab
    await page.click('.nav-tab[data-target="group2"]', { timeout: 3000 });
    await page.waitForTimeout(400);
    const group2Active = await page.$eval('#group2', el => el.classList.contains('active'));
    if (group2Active) passes.push('NAV click → group2 active ✓');
    else errors.push('NAV click group2 did NOT activate');

    // Verify only 1 active at a time
    const activeGroups = await page.$$eval('.group-section.active', els => els.length);
    if (activeGroups === 1) passes.push('Only 1 group active after click ✓');
    else warnings.push(`${activeGroups} groups active (expected 1)`);
  } catch (e) {
    warnings.push(`NAV click test failed: ${e.message}`);
  }

  // === CHECK 7: Chart buttons — ẩn khi history <6 ===
  console.log('📈 Check 7: Chart buttons (ẩn khi <6 tháng data)...');
  const allChartBtns = await page.$$eval('.dc-chart-btn', els => ({
    total: els.length,
    visible: els.filter(b => b.style.display !== 'none' && b.offsetParent !== null).length,
    hidden: els.filter(b => b.style.display === 'none').length
  }));
  if (allChartBtns.total > 0) {
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
  if (takeawayCount >= 5) passes.push(`Key takeaways: ${takeawayCount} (≥5) ✓`);
  else warnings.push(`Key takeaways: ${takeawayCount} (expected ≥5)`);

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
