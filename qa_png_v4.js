// 슬라이드별 QA PNG 생성 (ASCII 임시 경로에서 렌더 후 복사)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC_DIR = __dirname;
const QA_DIR = path.join(SRC_DIR, '_qa_v4');
const browser = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));

const work = path.join(os.tmpdir(), 'r5v2');
const html = fs.readFileSync(path.join(SRC_DIR, 'Hub71_Round5_Deck_EN_v4.html'), 'utf8');
if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });
// 이미지 매 실행 동기화 (새 에셋 누락 방지)
fs.mkdirSync(path.join(work, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC_DIR, 'img'))) {
  fs.copyFileSync(path.join(SRC_DIR, 'img', f), path.join(work, 'img', f));
}

const NAMES = ['00_cover', '01_challenge', '02_youngest', '03_proven', '04_whyanjalz', '05_deliver', '06_team'];
const idx = Number(process.argv[2]);
const targets = Number.isInteger(idx) ? [idx] : NAMES.map((_, i) => i);

for (const i of targets) {
  const isolate = `<style>
    html,body{background:#fff !important;}
    .deck{padding:0 !important; gap:0 !important;}
    .slide{display:none !important;}
    .slide:nth-of-type(${i + 1}){display:block !important; border-radius:0 !important; box-shadow:none !important;}
  </style></body>`;
  const one = path.join(work, `s${i}.html`);
  fs.writeFileSync(one, html.replace('</body>', isolate), 'utf8');
  const tmpPng = path.join(work, `s${i}.png`);
  try {
    execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--window-size=1280,720', '--virtual-time-budget=5000',
      `--screenshot=${tmpPng}`, 'file:///' + one.replace(/\\/g, '/')], { stdio: 'pipe', timeout: 120000 });
  } catch (e) { /* chrome은 성공해도 비정상 코드를 반환할 수 있음 */ }
  if (fs.existsSync(tmpPng)) {
    fs.copyFileSync(tmpPng, path.join(QA_DIR, NAMES[i] + '.png'));
    console.log(`${NAMES[i]}: ${(fs.statSync(tmpPng).size / 1024).toFixed(0)} KB`);
  } else {
    console.log(`${NAMES[i]}: FAILED`);
  }
}
