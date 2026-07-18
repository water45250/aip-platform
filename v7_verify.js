const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const contentCalls = []; // 记录 /content/ 自动拉取
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('response', async (resp) => {
    const u = resp.url();
    if (u.includes('/api/course/') && u.includes('/content/')) {
      try {
        const j = await resp.json();
        const hasData = j && j.data != null;
        contentCalls.push({ url: u.split('/').pop(), status: resp.status(), hasData });
      } catch { contentCalls.push({ url: u.split('/').pop(), status: resp.status(), hasData: 'parse-fail' }); }
    }
  });
  const log = (...a) => console.log('[V7]', ...a);

  await page.goto('https://www.bigwhale.top/#/course-workshop', { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea', { timeout: 30000 });

  const idea = '我想做一個關於「小紅書從0到1萬粉的實操方法」的課程。目標學員是想做副業的職場白領，時間少、預算低。我本人有3年社群運營經驗，擅長內容策劃與選題。課程交付形式為錄播視頻+實操作業，定價199元，希望風格輕鬆接地氣、多舉真實案例。';
  await page.fill('textarea', idea);
  await page.getByText('開始課程生成').click();

  // 等待「待你確認」面板（HITL-1）
  await page.waitForFunction(() => document.body.innerText.includes('待你確認'), { timeout: 45000 });
  await page.waitForTimeout(3500);

  let body = await page.evaluate(() => document.body.innerText);
  const hitl1Label = body.includes('需求解析確認');        // 繁体前端标签
  const hasProfileSummary = body.includes('需求解析摘要'); // 新功能：HITL-1 自动摘要
  log('到達 HITL-1(需求解析確認):', hitl1Label);
  log('HITL-1 是否「自動」展示需求解析摘要(无需点编辑):', hasProfileSummary);
  await page.screenshot({ path: '/tmp/v7_hitl1.png', fullPage: false });

  // 确认 HITL-1，推进到 HITL-2
  await page.getByText('確認並繼續').click();
  log('已点击「確認並繼續」，等待 HITL-2...');

  let hitl2 = false;
  for (let i = 0; i < 80; i++) {
    body = await page.evaluate(() => document.body.innerText);
    if (body.includes('IP 定位確認')) { hitl2 = true; break; }
    if (body.includes('課程已生成完畢')) { log('流程已直接完成（跳过HITL-2）'); break; }
    await page.waitForTimeout(2000);
  }
  log('到達 HITL-2(IP 定位確認):', hitl2);

  if (hitl2) {
    await page.waitForTimeout(5000); // 自动拉取 + 2s 补抓
    body = await page.evaluate(() => document.body.innerText);
    const hasIpReport = body.includes('IP 定位報告');     // TYPE_LABELS[ip_report] 预览卡
    const noEmpty = !body.includes('（暫無內容）') && !body.includes('（解析中…）');
    const confirmUsable = body.includes('確認並繼續');
    log('HITL-2 是否自动展示「IP 定位報告」预览:', hasIpReport);
    log('HITL-2 预览是否非空:', noEmpty);
    log('HITL-2 确认按钮可用:', confirmUsable);
    await page.screenshot({ path: '/tmp/v7_hitl2.png', fullPage: false });
  }

  log('=== /content/ 自动拉取记录 ===');
  contentCalls.forEach(c => log('  ', JSON.stringify(c)));
  log('CONSOLE ERRORS:', errors.length ? errors.join(' | ') : 'none');

  const pass = hitl1Label && hasProfileSummary && hitl2 && body.includes('IP 定位報告') && !body.includes('（暫無內容）');
  log('==== 验证结果:', pass ? 'PASS ✅' : 'NEED-REVIEW ⚠️');
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
