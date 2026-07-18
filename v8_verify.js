const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));
  const log = (...a) => console.log('[V8]', ...a);

  await page.goto('https://www.bigwhale.top/#/course-workshop', { waitUntil: 'networkidle' });
  await page.waitForSelector('textarea', { timeout: 30000 });

  // 详细课程想法，一次跨过需求完整度阈值
  const idea = '我想做一個關於「小紅書從0到1萬粉的實操方法」的課程。目標學員是想做副業的職場白領，時間少、預算低。我本人有3年社群運營經驗，擅長內容策劃與選題。課程交付形式為錄播視頻+實操作業，定價199元，希望風格輕鬆接地氣、多舉真實案例。';
  await page.fill('textarea', idea);
  await page.getByText('開始課程生成').click();

  // 等待 HITL-1 → 确认
  await page.waitForFunction(() => document.body.innerText.includes('待你確認'), { timeout: 45000 });
  await page.waitForTimeout(3500);
  await page.getByText('確認並繼續').click();

  // 轮询等待 HITL-2
  let hitl2 = false;
  for (let i = 0; i < 80; i++) {
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes('IP 定位確認')) { hitl2 = true; break; }
    if (body.includes('課程已生成完畢')) break;
    await page.waitForTimeout(2000);
  }

  if (!hitl2) {
    log('未到达 HITL-2');
    await browser.close(); process.exit(1); return;
  }
  log('已到达 HITL-2');

  // 等自动拉取完成（首次 + 2s补抓）
  await page.waitForTimeout(5500);

  const body = await page.evaluate(() => document.body.innerText);

  // ===== 核心断言：IP定位报告以「人类可读格式」呈现 =====
  const hasPositioningLabel   = body.includes('定位宣言');       // 🎯 定位宣言
  const hasDiffLabel          = body.includes('差異化標籤');      // ✨ 差異化標籤
  const hasFlywheelLabel      = body.includes('增長飛輪');        // 🔄 增長飛輪
  const noRawJsonBraces        = !body.includes('{\n    "step": 1,'); // 不再显示裸 JSON 缩进格式

  // 检查是否有结构化内容（步骤卡片）而非 JSON 大括号堆叠
  const panelText = body.slice(body.indexOf('待你確認'), body.indexOf('確認並繼續') + 50);
  const jsonLikePattern        = /^\s*{/m.test(panelText.slice(0, 500));

  log('=== v8 可读渲染验证 ===');
  log('🎯 定位宣言 标签:', hasPositioningLabel);
  log('✨ 差異化標籤 标签:', hasDiffLabel);
  log('🔄 增長飛輪 标签:', hasFlywheelLabel);
  log('❌ 不含裸JSON缩进("{\\n    \\"step\\"":', noRawJsonBraces);
  log('预览区非纯 JSON 格式:', !jsonLikePattern || hasPositioningLabel);
  log('');
  log('--- 面板预览区片段 ---');
  log(panelText.slice(0, 600));

  await page.screenshot({ path: '/tmp/v8_readable.png', fullPage: false });
  log('CONSOLE ERRORS:', errors.length ? errors.join(' | ') : 'none');

  // 判断：至少出现一个可读标签 + 不再有裸 JSON 缩进格式 = PASS
  const pass = (hasPositioningLabel || hasDiffLabel || hasFlywheelLabel) && noRawJsonBraces;
  log('==== 验证结果:', pass ? 'PASS ✅' : 'NEED-REVIEW ⚠️');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
