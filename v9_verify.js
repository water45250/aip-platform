const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));
  const log = (...a) => console.log('[V9]', ...a);

  await page.goto('https://www.bigwhale.top/#/course-workshop', { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea', { timeout: 30000 });

  const idea = '我是ESG認證的顧問，要針對東南亞的務工人員開始講識ESG的系列課程。我有多年ESG輔導經驗，是上海首個ESG高級顧問，希望用錄播視頻+實操作業交付，定價299元，風格專業嚴謹。';
  await page.fill('textarea', idea);
  await page.getByText('開始課程生成').click();

  await page.waitForFunction(() => document.body.innerText.includes('待你確認'), { timeout: 60000 });
  await page.waitForTimeout(4000);

  const body = await page.evaluate(() => document.body.innerText);
  const panel = body.slice(body.indexOf('需求解析摘要'), body.indexOf('確認並繼續') + 30);

  const hasIdentityLabel  = body.includes('👤 身份');
  const hasExpertiseLabel = body.includes('💡 專長領域');
  const hasAudienceLabel  = body.includes('🎯 目標學員');
  const hasTopicLabel     = body.includes('📖 課程主題');
  const noRawJsonBraces   = !body.includes('"identity"') && !body.includes('{\n  "identity"');
  const showsValue        = body.includes('ESG');

  log('=== v9 HITL-1 需求摘要可读验证 ===');
  log('👤 身份 标签:', hasIdentityLabel);
  log('💡 專長領域 标签:', hasExpertiseLabel);
  log('🎯 目標學員 标签:', hasAudienceLabel);
  log('📖 課程主題 标签:', hasTopicLabel);
  log('❌ 无裸JSON("identity"引号):', noRawJsonBraces);
  log('显示值(ESG等):', showsValue);
  log('');
  log('--- 预览区片段 ---');
  log(panel.slice(0, 500));

  await page.screenshot({ path: '/tmp/v9_hitl1.png', fullPage: false });
  log('CONSOLE ERRORS:', errors.length ? errors.join(' | ') : 'none');

  const pass = hasIdentityLabel && hasExpertiseLabel && hasAudienceLabel && noRawJsonBraces && showsValue;
  log('==== 验证结果:', pass ? 'PASS ✅' : 'NEED-REVIEW ⚠️');
  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
