const { chromium } = require('playwright');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('[ERR]', e.message));
  const log = (...a) => console.log('[V12]', ...a);

  await page.goto('https://www.bigwhale.top/#/course-workshop', { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea', { timeout: 30000 });

  // 详细输入直达 HITL-1
  const idea = '我想做一個關於「小紅書從0到1萬粉的實操方法」的課程。目標學員是想做副業的職場白領，時間少、預算低。我本人有3年社群運營經驗，擅長內容策劃與選題。課程交付形式為錄播視頻+實操作業，定價199元。';
  await page.fill('textarea', idea);
  await page.getByText('開始課程生成').click();

  // HITL-1 确认
  await page.waitForFunction(() => document.body.innerText.includes('待你確認'), { timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.getByText('確認並繼續').click();
  log('HITL-1 OK');

  // 自动推进到 HITL-2~4：逐个确认（每个等出现再点）
  for (const hitlLabel of ['IP 定位', '課程大綱', '內容預覽']) {
    let found = false;
    for (let i = 0; i < 60; i++) {
      const body = await page.evaluate(() => document.body.innerText);
      if (body.includes(hitlLabel) && body.includes('待你確認')) { found = true; break; }
      if (body.includes('課程已生成完畢')) { log('流程提前完成'); break; }
      // 尝试点击确认（可能已经出现了）
      try { await page.getByText('確認並繼續').click({ timeout: 1000 }); } catch {}
      await page.waitForTimeout(2500);
    }
    if (!found && !await page.evaluate(() => document.body.innerText.includes('課程已生成完畢'))) {
      log(`等待 ${hitlLabel} 超时`);
    } else if (found) {
      await page.waitForTimeout(3000); // 等预览加载
      try { await page.getByText('確認並繼續').click(); } catch {}
      log(`${hitlLabel} 已确认`);
    }
  }

  // 关键验证：检查 content_production_serial 是否卡住或通过
  await page.waitForTimeout(5000);
  const body = await page.evaluate(() => document.body.innerText);

  const stillStuck = body.includes('生成中…') || body.includes('content_production_serial.*running');
  const passedHitl4 = body.includes('審核報告') || body.includes('語音合成') ||
                      body.includes('數字人視頻') || body.includes('課程已生成完畢');
  const hasMarketingPreview = body.includes('營銷文案');
  const hasPricingPreview = body.includes('定價方案');

  log('=== v12 卡关修复验证 ===');
  log('是否仍卡在"生成中…":', stillStuck ? '❌ YES (STILL STUCK)' : '✅ NO (NOT STUCK)');
  log('是否通过 HITL-4 到达后续节点:', passedHitl4 ? '✅ YES' : '⚠️ STILL AT HITL-4');
  log('营销文案预览:', hasMarketingPreview);
  log('定价方案预览:', hasPricingPreview);

  await page.screenshot({ path: '/tmp/v12_nostuck.png', fullPage: false });
  const pass = !stillStuck && (passedHitl4 || hasMarketingPreview || hasPricingPreview);
  log('==== 验证结果:', pass ? 'PASS ✅' : 'NEED-REVIEW ⚠️');
  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
