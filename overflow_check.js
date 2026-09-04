// 슬라이드별 오버플로 측정 — 각 .slide 안에서 가장 아래로 내려간 요소의 bottom 좌표를 잰다
// 슬라이드 높이 720, 하단 패딩 50 → 콘텐츠는 670 이하에서 끝나야 안전
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = __dirname;
const work = path.join(os.tmpdir(), 'r5v2');
const browser = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));

const html = fs.readFileSync(path.join(SRC, 'Hub71_Round5_Deck_EN_v4.html'), 'utf8');

const probe = `<script>
window.addEventListener('load', function(){
  setTimeout(function(){
    var out = [];
    document.querySelectorAll('.slide').forEach(function(sl, i){
      var sb = sl.getBoundingClientRect();
      var maxB = 0, who = '';
      var SKIP = ['pad','body-flex','slide','deck','brand-footer','slide-num','src','cov-foot'];
      sl.querySelectorAll('*').forEach(function(el){
        var cn = (el.className || '') + '';
        if (SKIP.some(function(k){ return cn.split(' ').indexOf(k) >= 0; })) return;
        if (el.closest('.brand-footer') || el.closest('.cov-foot')) return;
        var r = el.getBoundingClientRect();
        if (r.height === 0 || r.width === 0) return;
        var b = r.bottom - sb.top;
        if (b > maxB) { maxB = b; who = (el.className || el.tagName) + ''; }
      });
      out.push(i + ':' + Math.round(maxB) + ':' + who.slice(0, 22));
    });
    document.title = 'PROBE|' + out.join('|');
  }, 900);
});
</script></body>`;

const probeFile = path.join(work, 'probe.html');
fs.writeFileSync(probeFile, html.replace('</body>', probe), 'utf8');

let dom = '';
try {
  dom = execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=1280,900', '--virtual-time-budget=4000', '--dump-dom',
    'file:///' + probeFile.replace(/\\/g, '/')], { encoding: 'utf8', timeout: 120000 });
} catch (e) { dom = e.stdout || ''; }

const m = dom.match(/PROBE\|([^<]*)</);
if (!m) { console.log('probe failed'); process.exit(1); }

const NAMES = ['COVER', 'S1 Challenge', 'S2 Youngest', 'S3 Proven', 'S4 WhyAnjalZ', 'S5 Deliver', 'S6 Team'];
console.log('슬라이드 높이 720 · 콘텐츠 안전선 670 (하단 패딩 50)');
console.log('─'.repeat(62));
for (const part of m[1].split('|')) {
  const [i, bottom, who] = part.split(':');
  const b = Number(bottom);
  const flag = b > 700 ? '  ❌ 오버플로' : b > 672 ? '  ⚠ 여유 없음' : '  ok';
  console.log(`${(NAMES[i] || i).padEnd(14)} bottom ${String(b).padStart(4)}  ${who.padEnd(24)}${flag}`);
}
