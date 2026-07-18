#!/usr/bin/env python3
"""v12 修复：content_production_serial 节点超时保护"""
import time, threading

def _call_with_timeout(func, args=(), kwargs={}, timeout_seconds=15):
    """带超时的函数调用，超时返回 None"""
    result = [None]
    exc = [None]
    def target():
        try:
            result[0] = func(*args, **kwargs)
        except Exception as e:
            exc[0] = e
    t = threading.Thread(target=target, daemon=True)
    t.start()
    t.join(timeout=timeout_seconds)
    if t.is_alive():
        return None
    if exc[0] is not None:
        return None
    return result[0]

path = '/app/src/aip_core/agents/content_agents.py'
with open(path, 'r') as f:
    content = f.read()

# 标记字符串（用于定位）
MARKER = '    """内容生产串行阶段 - LangGraph 节点函数'
if MARKER not in content:
    print('PATCH FAIL: marker not found')
    exit(1)

# 找到函数开始位置
idx = content.index(MARKER)
# 找到下一个顶层 def 或文件末尾作为结束
func_start = idx

# 找到这个函数的结束（下一个 def 在相同缩进级别或文件末尾）
search_from = idx + len(MARKER)
next_def_pos = len(content)
for candidate in range(search_from, len(content)):
    if content[candidate:candidate+4] == '\ndef' and candidate > 0 and content[candidate-1] == '\n':
        # 检查缩进是否为0（顶层函数）
        line_start = content.rfind('\n', 0, candidate) + 1
        indent = len(content[line_start:]) - len(content[line_start:].lstrip())
        if indent == 0:
            next_def_pos = candidate
            break

old_func_content = content[func_start:next_def_pos]

new_func = '''def run_content_serial(state: CourseState) -> CourseState:
    \"\"\"内容生产串行阶段 - LangGraph 节点函数（带超时保护）

    [v12修复] CrewAI LLM调用加15秒超时，
    超时/失败立即走模板降级，保证节点30秒内完成。
    \"\"\"
    profile = state.get("user_profile", {})
    ip = state.get("ip_positioning") or {}
    outline = state.get("course_outline", {})
    cases = state.get("cases", [])

    topic = profile.get("course_topic", "专业技能")
    start_time = time.time()

    # Step 1: 营销文案（15秒超时保护）
    marketing = _call_with_timeout(
        _generate_marketing_sync,
        args=(profile, ip, outline, cases),
        timeout_seconds=15
    )
    if not marketing or not isinstance(marketing, dict) or not marketing.get("sales_page"):
        marketing = _generate_fallback_marketing(profile, ip, outline, cases)

    # Step 2: 定价方案（15秒超时保护）
    pricing = _call_with_timeout(
        _generate_pricing_sync,
        args=(outline, topic),
        timeout_seconds=15
    )
    if not pricing or not isinstance(pricing, dict) or not pricing.get("standard_price"):
        pricing = _generate_fallback_pricing(outline)

    state["marketing_copy"] = marketing
    state["pricing_plan"] = pricing
    state["current_node"] = "content_production_serial"
    state["hitl_status"]["HITL-4"] = "pending"
    state["node_history"] = state.get("node_history", []) + [{
        "node": "content_production_serial",
        "start": start_time,
        "end": time.time(),
        "status": "ok",
    }]

    return state'''

content = content[:func_start] + new_func + content[next_def_pos:]
with open(path, 'w') as f:
    f.write(content)
print(f'PATCH OK (replaced {len(old_func_content)} bytes with {len(new_func)} bytes)')
