const { chromium } = require('playwright');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', e => console.error('[ERR]', e.message));
  const log = (...a) => console.log('[V11]', ...a);

  await page.goto('https://www.bigwhale.top/#/course-workshop', { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea', { timeout: 30000 });

  // 详细输入直达 HITL-1
  const idea = '我想做一個關於「小紅書從0到1萬粉的實操方法」的課程。目標學員是想做副業的職場白領，時間少、預算低。我本人有3年社群運營經驗，擅長內容策劃與選題。課程交付形式為錄播視頻+實操作業，定價199元，希望風格輕鬆接地氣、多舉真實案例。';
  await page.fill('textarea', idea);
  await page.getByText('開始課程生成').click();

  // HITL-1 → 确认
  await page.waitForFunction(() => document.body.innerText.includes('待你確認'), { timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.getByText('確認並繼續').click();
  log('HITL-1 已确认');

  // 轮询到 HITL-4（内容预览确认），这是右侧内容最多的节点
  let hitl4 = false;
  for (let i = 0; i < 120; i++) {
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes('內容預覽確認')) { hitl4 = true; break; }
    if (body.includes('課程已生成完畢')) break;
    if (body.includes('語音合成') || body.includes('數字人視頻')) {
      log('跳过中间HITL...');
      try { await page.getByText('確認並繼續').click(); } catch {}
      await page.waitForTimeout(2000);
    } else {
      // 尝试确认当前 HITL
      try { await page.getByText('確認並繼續').click({ timeout: 1000 }); } catch {}
      await page.waitForTimeout(2500);
    }
  }

  log('到达内容生产阶段:', hitl4);
  await page.waitForTimeout(4000); // 等预览加载

  // 测量左侧列高度和空白区域
  const metrics = await page.evaluate(() => {
    const leftCol = document.querySelector('.lg\\:col-span-2');
    const chatArea = leftCol?.querySelector('.flex-1');
    const rightCol = document.querySelector('.lg\\:col-span-2')?.parentElement?.children[1];
    return {
      leftHeight: leftCol?.offsetHeight,
      chatAreaHeight: chatArea?.offsetHeight,
      rightHeight: rightCol?.offsetHeight,
      windowHeight: window.innerHeight,
    };
  });

  log(`左侧对话区总高: ${metrics.leftHeight}px`);
  log(`消息区高度: ${metrics.chatAreaHeight}px`);
  log(`右侧面板高度: ${metrics.rightHeight}px`);
  log(`空白估算: ~${Math.max(0, (metrics.leftHeight || 0) - (metrics.chatAreaHeight || 0) - 180)}px`);

  await page.screenshot({ path: '/tmp/v11_noblank.png', fullPage: false });
  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
