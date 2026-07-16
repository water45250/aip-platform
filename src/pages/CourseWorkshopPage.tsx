import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, BookOpen, Layers, Sparkles, Send, Loader2, CheckCircle2,
  AlertCircle, ChevronLeft, Pencil, Download,
  History, X, Target, PenTool, Image as ImageIcon, Megaphone,
  DollarSign, ClipboardCheck, Eye, SkipForward, Wand2,
  ListChecks, Plus, RotateCcw,
} from 'lucide-react'

/* ============================================================
 * 課程工坊（Course Workshop）
 * 對接 aip-core(FastAPI) 課程生成引擎。
 * 前端掛在 www.bigwhale.top，aip-core 經 Nginx 的 /aip 前綴反代到 8080，
 * 且 /aip 前綴會被剝離，故公網路徑為 /aip/api/...（/api 指向 Laravel）。
 * 後端契約：src/aip_core/api/__init__.py（T1.5/M5/M6/M7）
 * HITL 與階段定義：src/aip_core/graph/state.py
 * ========================================================== */
const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL ?? '/aip'

const USER_ID = 'web-user' // 當前前端未做登入態，統一用固定 user_id 串聯會話

// HITL 元數據（與後端 state.py HITL_DEFINITIONS 對齊）
// edit_field 為 null 時，後端 hitl/action 尚不支持該節點的編輯
const HITL_META: Record<string, { label: string; node: string; content_type: string; edit_field: string | null }> = {
  'HITL-1': { label: '需求解析確認', node: 'requirement_analysis', content_type: '', edit_field: 'user_profile' },
  'HITL-2': { label: 'IP 定位確認', node: 'ip_positioning', content_type: 'ip_report', edit_field: 'ip_positioning' },
  'HITL-3': { label: '課程大綱確認', node: 'course_architecture', content_type: 'outline', edit_field: 'course_outline' },
  'HITL-4': { label: '內容預覽確認', node: 'content_production_serial', content_type: 'scripts', edit_field: null },
  'HITL-5': { label: '語音合成確認', node: 'voice_tts', content_type: 'audio', edit_field: null },
  'HITL-6': { label: '數字人視頻確認', node: 'digital_human', content_type: 'video', edit_field: null },
  'HITL-7': { label: '審核報告確認', node: 'quality_review', content_type: 'review', edit_field: null },
}

// 階段標籤由後端 /progress 的 stages[].label 提供，前端無需重複定義

const CONTENT_TABS = [
  { type: 'outline', label: '課程大綱', icon: BookOpen },
  { type: 'ip_report', label: 'IP定位', icon: Target },
  { type: 'scripts', label: '講稿', icon: PenTool },
  { type: 'slides', label: '課件', icon: ImageIcon },
  { type: 'cases', label: '實戰案例', icon: Layers },
  { type: 'marketing', label: '營銷文案', icon: Megaphone },
  { type: 'pricing', label: '定價方案', icon: DollarSign },
  { type: 'review', label: '審核報告', icon: ClipboardCheck },
]

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string }
type HitlInfo = { hitl_id: string; label: string; status: string } | null

export default function CourseWorkshopPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stage, setStage] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [pendingHitl, setPendingHitl] = useState<HitlInfo>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [stages, setStages] = useState<{ name: string; label: string; status: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [activeContent, setActiveContent] = useState<string | null>(null)
  const [contentData, setContentData] = useState<any>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // ===== 工具：錯誤提示（含 LLM Key 提示）=====
  const showError = useCallback((msg: string) => {
    const hint = /500|LLM|anthropic|openai|API.?key|model/i.test(msg)
      ? '　💡 若為後端節點執行報錯，多半是容器未配置 LLM API Key（ANTHROPIC_API_KEY / OPENAI_API_KEY / LLM_PROVIDER）。需求解析階段無需 Key，後續 IP 定位/課程架構/內容生產等需配置後方可跑通。'
      : ''
    setError(msg + hint)
  }, [])

  const pushMsg = useCallback((m: ChatMsg) => setMessages((prev) => [...prev, m]), [])

  // ===== 輪詢進度（驅動階段條 + 當前 HITL + 完成態）=====
  useEffect(() => {
    if (!sessionId || isComplete) return
    let active = true
    const tick = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/course/${sessionId}/progress`)
        if (!r.ok) return
        const d = await r.json()
        if (!active) return
        setStages(d.stages ?? [])
        setPendingHitl(d.current_hitl ?? null)
        setIsComplete(!!d.is_complete)
      } catch { /* 輪詢失敗靜默重試 */ }
    }
    tick()
    const id = window.setInterval(tick, 3000)
    return () => { active = false; window.clearInterval(id) }
  }, [sessionId, isComplete])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ===== 創建課程會話 =====
  const createCourse = async (initial: string) => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API_BASE}/api/course/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_message: initial, user_id: USER_ID }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { showError(`創建失敗 (${r.status})${j?.detail ? '：' + JSON.stringify(j.detail) : ''}`); return }
      setSessionId(j.session_id)
      setStage(j.stage)
      setProfile(j.profile)
      setMessages([
        { role: 'user', content: initial },
        { role: 'assistant', content: j.agent_message || '（無回覆）' },
      ])
      setPendingHitl(j.hitl ?? null)
    } catch (e) { showError('網絡錯誤：' + (e instanceof Error ? e.message : String(e))) }
    finally { setLoading(false) }
  }

  // ===== 發送對話消息（追問回覆）=====
  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !sessionId || loading) return
    setInput(''); setLoading(true); setError(null)
    pushMsg({ role: 'user', content: text })
    try {
      const r = await fetch(`${API_BASE}/api/course/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { showError(`發送失敗 (${r.status})${j?.detail ? '：' + JSON.stringify(j.detail) : ''}`); return }
      if (j.agent_message) pushMsg({ role: 'assistant', content: j.agent_message })
      if (j.profile) setProfile(j.profile)
      setPendingHitl(j.hitl ?? null)
      setStage(j.stage ?? stage)
    } catch (e) { showError('網絡錯誤：' + (e instanceof Error ? e.message : String(e))) }
    finally { setLoading(false) }
  }

  // ===== HITL 確認操作 =====
  const doHitl = async (action: string, edits?: any) => {
    if (!sessionId || !pendingHitl) return
    setLoading(true); setError(null); setEditing(false)
    const meta = HITL_META[pendingHitl.hitl_id]
    pushMsg({ role: 'system', content: `▶ ${meta?.label ?? pendingHitl.hitl_id}：${actionLabel(action)}` })
    try {
      const r = await fetch(`${API_BASE}/api/course/${sessionId}/hitl/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hitl_id: pendingHitl.hitl_id, action, edits }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { showError(`操作失敗 (${r.status})${j?.detail ? '：' + JSON.stringify(j.detail) : ''}`); return }
      if (j.next_hitl) setPendingHitl(j.next_hitl)
      else setPendingHitl(null)
      if (j.is_complete) { setIsComplete(true); pushMsg({ role: 'system', content: '🎉 課程已生成完畢，可下載交付包。' }) }
    } catch (e) { showError('網絡錯誤：' + (e instanceof Error ? e.message : String(e))) }
    finally { setLoading(false) }
  }

  // ===== 打開編輯：預填當前節點內容 =====
  const openEdit = async () => {
    if (!pendingHitl) return
    const meta = HITL_META[pendingHitl.hitl_id]
    let seed: any = null
    if (pendingHitl.hitl_id === 'HITL-1') seed = profile
    else if (meta?.content_type) {
      try {
        const r = await fetch(`${API_BASE}/api/course/${sessionId}/content/${meta.content_type}`)
        const d = await r.json().catch(() => ({}))
        seed = d?.data ?? null
      } catch { seed = null }
    }
    setEditText(seed ? JSON.stringify(seed, null, 2) : '{}')
    setEditing(true)
  }

  const submitEdit = () => {
    if (!pendingHitl) return
    const meta = HITL_META[pendingHitl.hitl_id]
    if (!meta?.edit_field) { showError('該確認點暫不支持前端編輯'); return }
    let parsed: any = null
    try { parsed = JSON.parse(editText) } catch { showError('編輯內容不是合法 JSON'); return }
    doHitl('edit', { [meta.edit_field]: parsed })
  }

  // ===== 會話歷史 =====
  const loadSessions = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/course/sessions?user_id=${encodeURIComponent(USER_ID)}`)
      const d = await r.json().catch(() => ({ sessions: [] }))
      setSessions(d.sessions ?? [])
    } catch { setSessions([]) }
  }
  useEffect(() => { if (historyOpen) loadSessions() }, [historyOpen])

  const resumeSession = async (sid: string) => {
    setHistoryOpen(false); setLoading(true); setError(null)
    try {
      const r = await fetch(`${API_BASE}/api/course/${sid}/resume`)
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { showError(`恢復失敗 (${r.status})`); return }
      setSessionId(sid)
      setStage(d.stage)
      setIsComplete(!!d.is_complete)
      setPendingHitl(d.next_hitl ?? null)
      pushMsg({ role: 'system', content: `↺ 已恢復會話 ${sid}` })
    } catch (e) { showError('網絡錯誤：' + (e instanceof Error ? e.message : String(e))) }
    finally { setLoading(false) }
  }

  // ===== 內容預覽 =====
  const loadContent = async (type: string) => {
    if (!sessionId) return
    setActiveContent(type); setContentLoading(true); setContentData(null)
    try {
      const r = await fetch(`${API_BASE}/api/course/${sessionId}/content/${type}`)
      const d = await r.json().catch(() => ({}))
      setContentData(d?.data ?? null)
    } catch { setContentData(null) }
    finally { setContentLoading(false) }
  }

  const reset = () => {
    setSessionId(null); setStage(''); setProfile(null); setMessages([]); setPendingHitl(null)
    setIsComplete(false); setStages([]); setError(null); setActiveContent(null); setContentData(null)
  }

  const downloadUrl = sessionId ? `${API_BASE}/api/course/${sessionId}/download` : '#'

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-5">
        {/* 麪包屑 + 標題 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to="/digital-human" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 課程工坊
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-500" /> 課程工坊
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {sessionId && (
              <button onClick={reset} className="text-[12.5px] text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> 新建課程
              </button>
            )}
            <button onClick={() => setHistoryOpen(true)} className="text-[12.5px] text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> 歷史會話
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-[12.5px] leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 無會話：需求輸入 */}
        {!sessionId && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-bold text-gray-900">描述你的課程想法</h2>
              <span className="text-[11px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">AI 協作生成</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：我想做一個關於「小紅書從 0 到 1 萬粉的實操方法」的課程，面向想做副業的職場人"
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-[13px] text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <button
              onClick={() => createCourse(input.trim())}
              disabled={!input.trim() || loading}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loading ? '正在解析需求…' : '開始課程生成'}
            </button>
          </div>
        )}

        {/* 有會話：階段進度條 */}
        {sessionId && stages.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-violet-500" /> 生成流水線
              </h2>
              {isComplete && <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已完成</span>}
            </div>
            <div className="flex flex-wrap gap-x-1 gap-y-3">
              {stages.map((s, i) => {
                const dot = s.status === 'completed' ? 'bg-emerald-500 text-white'
                  : s.status === 'running' ? 'bg-violet-600 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-400'
                const line = i < stages.length - 1 ? (s.status === 'completed' ? 'bg-emerald-400' : 'bg-gray-200') : ''
                return (
                  <div key={s.name} className="flex items-center">
                    <div className="flex flex-col items-center w-[110px]">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${dot}`}>
                        {s.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`mt-1.5 text-[10.5px] text-center leading-tight ${s.status === 'running' ? 'text-violet-600 font-medium' : 'text-gray-500'}`}>{s.label}</span>
                    </div>
                    {i < stages.length - 1 && <div className={`w-[14px] h-0.5 ${line} mb-5`} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 有會話：對話 + HITL */}
        {sessionId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 左：對話流 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 flex flex-col min-h-[360px]">
              <h2 className="text-sm font-bold text-gray-900 mb-3">AI 協作對話</h2>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[480px] pr-1">
                {messages.map((m, i) => (
                  <div key={i} className={
                    m.role === 'user' ? 'flex justify-end' :
                    m.role === 'system' ? 'flex justify-center' : 'flex justify-start'
                  }>
                    {m.role === 'system' ? (
                      <span className="text-[11.5px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{m.content}</span>
                    ) : (
                      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                        m.role === 'user' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>{m.content}</div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* 追問輸入 */}
              {pendingHitl == null && !isComplete && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="回覆 AI 的追問，推進需求解析…"
                    className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-400"
                  />
                  <button onClick={sendMessage} disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 發送
                  </button>
                </div>
              )}
            </div>

            {/* 右：HITL 確認面板 / 完成操作 */}
            <div className="space-y-5">
              {pendingHitl && (
                <div className="bg-white rounded-xl border border-violet-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="w-4 h-4 text-violet-500" />
                    <h2 className="text-sm font-bold text-gray-900">待你確認</h2>
                  </div>
                  <p className="text-[13px] text-violet-700 font-medium mb-3">{pendingHitl.label}</p>

                  {editing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={10}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-mono text-gray-800 outline-none focus:border-violet-400"
                      />
                      <div className="flex gap-2">
                        <button onClick={submitEdit} disabled={loading} className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-[12.5px] font-medium hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} 提交並確認
                        </button>
                        <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 hover:bg-gray-50">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button onClick={() => doHitl('confirm')} disabled={loading} className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-1.5">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 確認並繼續
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => doHitl('regenerate')} disabled={loading} className="py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-60">
                          <RotateCcw className="w-3.5 h-3.5" /> 重新生成
                        </button>
                        <button onClick={() => doHitl('skip')} disabled={loading} className="py-2 rounded-xl border border-gray-200 text-[12.5px] text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-60">
                          <SkipForward className="w-3.5 h-3.5" /> 跳過
                        </button>
                      </div>
                      {HITL_META[pendingHitl.hitl_id]?.edit_field && (
                        <button onClick={openEdit} disabled={loading} className="w-full py-2 rounded-xl border border-gray-200 text-[12.5px] text-violet-600 hover:bg-violet-50 flex items-center justify-center gap-1.5 disabled:opacity-60">
                          <Pencil className="w-3.5 h-3.5" /> 編輯內容後確認
                        </button>
                      )}
                      <button onClick={() => doHitl('skip_all')} disabled={loading} className="w-full py-2 rounded-xl text-[12px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                        <SkipForward className="w-3.5 h-3.5" /> 一鍵跳過全部確認點
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isComplete && (
                <div className="bg-white rounded-xl border border-emerald-200 p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 交付完成
                  </h2>
                  <p className="text-[12.5px] text-gray-500 mb-3">課程包（講稿/課件/案例/營銷/定價/審核）已生成，可下載或逐項預覽。</p>
                  <a href={downloadUrl} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:brightness-110">
                    <Download className="w-4 h-4" /> 下載課程包 (ZIP)
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 內容預覽 */}
        {sessionId && isComplete && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-500" /> 課程內容預覽
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {CONTENT_TABS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.type}
                    onClick={() => loadContent(t.type)}
                    className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] border transition-all ' +
                      (activeContent === t.type ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-violet-50')}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                )
              })}
            </div>
            <div className="min-h-[120px] rounded-xl bg-gray-50 border border-gray-100 p-4 text-[13px] text-gray-700">
              {!activeContent && <p className="text-gray-400">選擇上方標籤預覽對應內容。</p>}
              {activeContent && contentLoading && <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> 加載中…</div>}
              {activeContent && !contentLoading && <ContentViewer type={activeContent} data={contentData} />}
            </div>
          </div>
        )}
      </div>

      {/* 歷史會話抽屜 */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={() => setHistoryOpen(false)} />
          <div className="w-[360px] bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><History className="w-4 h-4 text-violet-500" /> 歷史會話</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sessions.length === 0 && <p className="text-[12.5px] text-gray-400 text-center py-8">尚無會話記錄</p>}
              {sessions.map((s) => (
                <button key={s.session_id} onClick={() => resumeSession(s.session_id)} className="w-full text-left rounded-xl border border-gray-200 p-3 hover:bg-violet-50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-gray-800 truncate">{s.course_title || '未命名課程'}</span>
                    {s.completed ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">已完成</span>
                      : <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">進行中</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">#{s.session_id} · {s.stage}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== 輔助 =====
function actionLabel(a: string): string {
  return { confirm: '確認', skip: '跳過', regenerate: '重新生成', edit: '編輯', skip_all: '一鍵跳過全部' }[a] ?? a
}

// 內容渲染：依類型美化展示
function ContentViewer({ type, data }: { type: string; data: any }) {
  if (data == null) return <p className="text-gray-400">暫無內容（可能該節點尚未生成或需配置 LLM Key）。</p>

  // 課程大綱結構化
  if (type === 'outline' && data.modules) {
    return (
      <div className="space-y-3">
        <div className="text-[14px] font-bold text-gray-900">{data.course_title}</div>
        <div className="text-[11.5px] text-gray-400">
          {data.total_modules} 模塊 · {data.total_lessons} 課時 · {data.total_duration_minutes} 分鐘
        </div>
        {data.modules.map((m: any) => (
          <div key={m.id} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">{m.id}</span>
              <span className="text-[13px] font-semibold text-gray-800">{m.title}</span>
              {m.phase && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{m.phase}</span>}
            </div>
            {m.description && <p className="text-[12px] text-gray-500 mb-1.5">{m.description}</p>}
            <div className="space-y-1">
              {(m.lessons || []).map((l: any) => (
                <div key={l.id} className="flex items-start gap-2 text-[12px] text-gray-600 pl-2">
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5">{l.id}</span>
                  <span>{l.title}</span>
                  {l.duration_minutes && <span className="text-gray-400 ml-auto">{l.duration_minutes}′</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 審核報告
  if (type === 'review' && data.dimensions) {
    return (
      <div className="space-y-2">
        <div className="text-[15px] font-bold text-gray-900">總分 {data.total_score}/100 {data.pass_ ? '✅ 通過' : '⚠️ 未通過'}</div>
        {Object.entries(data.dimensions).map(([k, v]: any) => (
          <div key={k} className="flex items-center gap-3 text-[12.5px]">
            <span className="w-28 text-gray-600">{k}</span>
            <span className="text-violet-600 font-medium">{v.score}/{v.max}</span>
            {v.issues && <span className="text-gray-400 truncate">— {v.issues}</span>}
          </div>
        ))}
      </div>
    )
  }

  // 通用：對象 → 卡片；字符串 → 預格式；數組 → 列表
  if (typeof data === 'string') return <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed">{data}</pre>
  if (Array.isArray(data)) return (
    <div className="space-y-2">
      {data.map((item: any, i: number) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 text-[12.5px]">
          {typeof item === 'object' ? <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(item, null, 2)}</pre> : String(item)}
        </div>
      ))}
    </div>
  )
  if (typeof data === 'object') return (
    <div className="space-y-3">
      {Object.entries(data).map(([k, v]: any) => (
        <div key={k}>
          <div className="text-[12px] font-semibold text-violet-600 mb-1">{k}</div>
          {typeof v === 'string'
            ? <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-gray-700">{v}</pre>
            : <pre className="whitespace-pre-wrap font-sans text-[12px] text-gray-700">{JSON.stringify(v, null, 2)}</pre>}
        </div>
      ))}
    </div>
  )
  return <pre className="whitespace-pre-wrap font-sans text-[12.5px]">{String(data)}</pre>
}
