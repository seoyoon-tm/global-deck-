// v2 덱 PDF 렌더 (ASCII 임시 경로 경유)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const SRC = __dirname;
const work = path.join(os.tmpdir(), 'r5v2');
fs.mkdirSync(path.join(work, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'img'))) {
  fs.copyFileSync(path.join(SRC, 'img', f), path.join(work, 'img', f));
}
const deckHtml = path.join(work, 'deck.html');
fs.writeFileSync(deckHtml, fs.readFileSync(path.join(SRC, 'Hub71_Round5_Deck_EN_v4.html'), 'utf8'), 'utf8');

const browser = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));

const tmpPdf = path.join(work, 'deck.pdf');
if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
try {
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
    '--virtual-time-budget=8000', '--print-to-pdf=' + tmpPdf,
    'file:///' + deckHtml.replace(/\\/g, '/')], { stdio: 'pipe', timeout: 180000 });
} catch (e) { /* chrome은 성공해도 비정상 코드를 반환할 수 있음 */ }

const out = path.join(SRC, 'Hub71_Round5_Deck_EN_v4.pdf');
if (!fs.existsSync(tmpPdf)) { console.log('PDF fail'); process.exit(1); }
try {
  fs.copyFileSync(tmpPdf, out);
  console.log('PDF ok ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
} catch (e) {
  // 뷰어가 PDF를 열어 두면 덮어쓰기가 막힘 → 임시 파일명으로 저장하고 알림
  const alt = path.join(SRC, 'Hub71_Round5_Deck_EN_v4_fix.pdf');
  fs.copyFileSync(tmpPdf, alt);
  console.log('원본 PDF가 열려 있어 덮어쓰지 못함. ' + path.basename(alt) + ' 로 저장함. 뷰어를 닫고 다시 실행할 것');
}
