#!/usr/bin/env node
/**
 * run_monthly.js — Pipeline 1 lệnh: verify → render → QA (tùy chọn)
 *
 * Usage:
 *   node scripts/run_monthly.js --json=2026-07/report.json --history=history.json
 *   node scripts/run_monthly.js --json=2026-07/report.json --history=history.json --qa
 *
 * Luồng:
 *   1. verify_data.js — dừng ngay nếu FAIL (exit 2); WARNINGS → in ra để xem
 *   2. render.js — sinh report.html (cùng thư mục với report.json)
 *   3. --qa → chạy qa_report.js (cần Playwright: cd scripts && npm install)
 */

const { spawnSync } = require('child_process');
const path = require('path');

function arg(name, def) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.replace(`--${name}=`, '') : def;
}
const jsonPath = arg('json');
const historyPath = arg('history');
const withQA = process.argv.includes('--qa');

if (!jsonPath || !historyPath) {
  console.error('❌ Usage: node run_monthly.js --json=report.json --history=history.json [--qa]');
  process.exit(2);
}

const scriptsDir = __dirname;
const outPath = path.join(path.dirname(path.resolve(jsonPath)), 'report.html');

function run(name, args, opts = {}) {
  console.log(`\n▶ ${name}...`);
  const r = spawnSync('node', args, { stdio: 'inherit', ...opts });
  return r.status;
}

// 1. VERIFY — dừng nếu dữ liệu sai
const v = run('verify_data.js (kiểm tra dữ liệu)', [path.join(scriptsDir, 'verify_data.js'), `--json=${jsonPath}`, `--history=${historyPath}`]);
if (v === 2) {
  console.error('\n❌ DỪNG: verify_data.js FAIL — sửa report.json trước khi render.');
  process.exit(2);
}
if (v === 1) console.log('\n⚠️ verify có warnings — đọc kỹ rồi quyết định, có thể render tiếp.');

// 2. RENDER
const r = run('render.js (sinh report.html)', [path.join(scriptsDir, 'render.js'), `--json=${jsonPath}`, `--history=${historyPath}`, `--out=${outPath}`]);
if (r !== 0) {
  console.error('\n❌ DỪNG: render.js lỗi.');
  process.exit(1);
}

// 3. QA (tùy chọn)
if (withQA) {
  const q = run('qa_report.js (QA giao diện)', [path.join(scriptsDir, 'qa_report.js'), `--url=file://${outPath}`, '--output=/tmp/qa-monthly']);
  if (q === 2) {
    console.error('\n❌ QA FAIL — báo cáo có lỗi.');
    process.exit(2);
  }
}

console.log(`\n✅ HOÀN TẤT: ${outPath}`);
console.log('   Mở bằng: open ' + outPath);
process.exit(0);
