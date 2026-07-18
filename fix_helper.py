#!/usr/bin/env python3
path = '/app/src/aip_core/agents/content_agents.py'
with open(path) as f:
    content = f.read()

if '_call_with_timeout' in content:
    print('ALREADY EXISTS')
else:
    helper = '''
def _call_with_timeout(func, args=(), kwargs={}, timeout_seconds=15):
    """带超时的函数调用，超时返回 None（v12修复：防止CrewAI hang）"""
    import threading as _th
    result = [None]
    exc = [None]
    def target():
        try:
            result[0] = func(*args, **kwargs)
        except Exception as e:
            exc[0] = e
    t = _th.Thread(target=target, daemon=True)
    t.start()
    t.join(timeout=timeout_seconds)
    if t.is_alive():
        return None
    if exc[0] is not None:
        return None
    return result[0]


'''
    marker = 'def run_content_serial(state: CourseState) -> CourseState:'
    content = content.replace(marker, helper + marker)
    with open(path, 'w') as f:
        f.write(content)
    print('ADDED HELPER OK')
