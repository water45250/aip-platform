const { chromium } = require('playwright');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('[ERR]', e.message));
  await page.goto('https://www.bigwhale.top/#/course-workshop', { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea', { timeout: 30000 });
  await page.fill('textarea', '我是ESG認證的顧問，要針對東南亞的務工人員開始講識ESG的系列課程。我有多年ESG輔導經驗，是上海首個ESG高級顧問，希望用錄播視頻+實操作業交付，定價299元，風格專業嚴謹。');
  await page.getByText('開始課程生成').click();
  await page.waitForFunction(() => document.body.innerText.includes('待你確認'), { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/v10_nobreak.png', fullPage: false });
  // 检查标签是否完整（不截断）
  const body = await page.evaluate(() => document.body.innerText);
  const labels = ['👤 身份', '💡 專長領域', '🎯 目標學員', '📖 課程主題'];
  const ok = labels.every(l => body.includes(l));
  console.log('标签完整:', ok);
  console.log('版本:', (body.match(/v10-\d+/) || [])[0] || '未找到');
  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
