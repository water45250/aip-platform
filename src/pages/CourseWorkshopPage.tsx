import { useState, useEffect, useRef, useCallback, Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Sparkles, Send, Loader2, CheckCircle2,
  AlertCircle, ChevronLeft, Pencil, Download, ClipboardCheck,
  History, X, SkipForward, Wand2,
  ListChecks, Plus, RotateCcw, ChevronDown, FileText, Cpu,
} from 'lucide-react'

// ============================================================
// ErrorBoundary：防止单个子组件崩溃导致整棵樹（含輸入框）不渲染
// ============================================================
class InputErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[InputErrorBoundary]', err.message, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-3 flex gap-2">
          <input
            defaultValue=""
            placeholder="回覆 AI 的追問，推進需求解析…（上方對話區發生渲染錯誤，輸入框仍可用）"
            className="flex-1 rounded-xl border border-red-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-400 text-red-700 bg-red-50"
            id="fallback-input"
          />
        </div>
      )
    }
    return this.props.children
  }
}

/* ============================================================
 * 課程工坊（Course Workshop）
 * 對接 aip-core(FastAPI) 課程生成引擎。
 * 前端掛在 www.bigwhale.top，aip-core 經 Nginx 的 /aip 前綴反代到 8080，
 * 且 /aip 前綴會被剝離，故公網路徑為 /aip/api/...（/api 指向 Laravel）。
 * 後端契約：src/aip_core/api/__init__.py（T1.5/M5/M6/M7）
 * HITL 與階段定義：src/aip_core/graph/state.py
 * ========================================================== */
const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL ?? '/aip'

const USER_ID = 'web-user'

// HITL 元數據（與後端 state.py HITL_DEFINITIONS 對齊）
// content_type：單一內容類型（用於「編輯內容」時的種子）；
// types：該確認點要預覽的內容類型數組（HITL 出現時自動拉取並展示）。
const HITL_META: Record<string, { label: string; node: string; content_type: string; types: string[]; edit_field: string | null }> = {
  'HITL-1': { label: '需求解析確認', node: 'requirement_analysis', content_type: '', types: [], edit_field: 'user_profile' },
  'HITL-2': { label: 'IP 定位確認', node: 'ip_positioning', content_type: 'ip_report', types: ['ip_report'], edit_field: 'ip_positioning' },
  'HITL-3': { label: '課程大綱確認', node: 'course_architecture', content_type: 'outline', types: ['outline'], edit_field: 'course_outline' },
  'HITL-4': { label: '內容預覽確認', node: 'content_production_serial', content_type: 'scripts', types: ['scripts', 'slides', 'cases'], edit_field: null },
  'HITL-5': { label: '語音合成確認', node: 'voice_tts', content_type: 'audio', types: ['audio'], edit_field: null },
  'HITL-6': { label: '數字人視頻確認', node: 'digital_human', content_type: 'video', types: ['video'], edit_field: null },
  'HITL-7': { label: '審核報告確認', node: 'quality_review', content_type: 'review', types: ['review'], edit_field: null },
}

// 每個節點「做什麼 / 產出什麼」（解決「不知道節點做啥、有何產出」）
// key 與後端 ALL_NODES / stages[].name 對齊
const STAGE_INFO: Record<string, { label: string; does: string; produces: string; types: string[] }> = {
  requirement_analysis: {
    label: '需求解析', does: '收集課程方向、目標學員、交付形式，判斷需求是否完整',
    produces: '用戶畫像（身份 / 專長 / 學員 / 主題 / 風格）', types: [],
  },
  ip_positioning: {
    label: 'IP 定位', does: '基於畫像生成一句話定位、差異化標籤與內容矩陣',
    produces: 'IP 定位報告', types: ['ip_report'],
  },
  course_architecture: {
    label: '課程架構', does: '拆解模塊與課時，規劃學習路徑與鉤子',
    produces: '課程大綱（模塊 / 課時）', types: ['outline'],
  },
  content_production_parallel: {
    label: '內容生產（講稿/課件/案例）', does: '並行生成每節課講稿、課件與實戰案例',
    produces: '講稿 / 課件 / 案例', types: ['scripts', 'slides', 'cases'],
  },
  content_production_serial: {
    label: '內容生產（營銷/定價）', does: '生成營銷文案與定價方案',
    produces: '營銷文案 / 定價方案', types: ['marketing', 'pricing'],
  },
  voice_tts: {
    label: '語音合成', does: '把講稿合成為課時音頻',
    produces: '課時音頻', types: ['audio'],
  },
  digital_human: {
    label: '數字人視頻', does: '用數字人生成講解視頻',
    produces: '數字人視頻', types: ['video'],
  },
  quality_review: {
    label: '質量審核', does: '評估課程質量並給出修正建議',
    produces: '審核報告（評分 / 維度）', types: ['review'],
  },
  packaging: {
    label: '打包交付', does: '匯總所有交付物為可下載包',
    produces: 'ZIP 課程包', types: [],
  },
}

const TYPE_LABELS: Record<string, string> = {
  outline: '課程大綱', ip_report: 'IP 定位報告', scripts: '講稿', slides: '課件',
  cases: '實戰案例', marketing: '營銷文案', pricing: '定價方案', review: '審核報告',
  audio: '音頻', video: '視頻',
}

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string }
type HitlInfo = { hitl_id: string; label: string; status: string } | null

// 自动拉取的 HITL 内容预览（key=hitl_id, value=fetched data）
type HitlContentMap = Record<string, any>

export default function CourseWorkshopPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [pendingHitl, setPendingHitl] = useState<HitlInfo>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [, setNeedFollowup] = useState(false)
  const [stages, setStages] = useState<{ name: string; label: string; status: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [stageData, setStageData] = useState<Record<string, any>>({})
  const [hitlContentMap, setHitlContentMap] = useState<HitlContentMap>({})
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const showError = useCallback((msg: string) => {
    const hint = /500|LLM|anthropic|openai|API.?key|model/i.test(msg)
      ? '　💡 若為後端節點執行報錯，多半是 LLM 配置問題（檢查 LLM_PROVIDER / LLM_MODEL / DEEPSEEK_API_KEY）。'
      : ''
    setError(msg + hint)
  }, [])

  const pushMsg = useCallback((m: ChatMsg) => setMessages((prev) => [...prev, m]), [])
  const downloadUrl = sessionId ? `${API_BASE}/api/course/${sessionId}/download` : '#'

  // 輪詢進度
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
        // v15: 同步 pendingHitl，防止状态回退（后端 v14 自动推进多个节点时，
        // 轮询可能拿到中间状态的旧 HITL，导致右侧面板显示已过的确认点）
        const nextHitl = d.current_hitl ?? null
        const hitlOrder = (id: string | undefined) => {
          if (!id) return -1
          const m: Record<string, number> = {'HITL-1':1,'HITL-2':2,'HITL-3':3,'HITL-4':4,'HITL-5':5,'HITL-6':6,'HITL-7':7}
          return m[id] ?? 0
        }
        setPendingHitl((prev) => {
          // v15: 不允许回退到更早的 HITL（防止轮询旧数据覆盖新状态）
          if (prev != null && nextHitl != null && hitlOrder(nextHitl.hitl_id) < hitlOrder(prev.hitl_id)) {
            return prev
          }
          // 注意：原先「prev==null 且 nextHitl 非 HITL-1 就 return prev(null)」的守卫会在
          // 刷新页面后把正确的 HITL 按钮（如 HITL-7 审核报告确认）整个藏掉。
          // 询问阶段（HITL-1=asking）后端本就回传 current_hitl=null，无需前端再拦。
          return nextHitl
        })
        setIsComplete(!!d.is_complete)
      } catch { /* 靜默重試 */ }
    }
    tick()
    const id = window.setInterval(tick, 3000)
    return () => { active = false; window.clearInterval(id) }
  }, [sessionId, isComplete])

  // 自動拉取 HITL 内容：當 pendingHitl 出現或變化時，自動抓取對應內容並預覽
  // 用戶不再需要點「編輯內容後確認」才能看到產出——直接展示。
  useEffect(() => {
    if (!pendingHitl || !sessionId) return
    const hitlId = pendingHitl.hitl_id
    const meta = HITL_META[hitlId]
    if (!meta?.types?.length) return // 無 types 的節點（如 HITL-1 需求解析）無需拉取

    let active = true
    const fetchOne = async (t: string) => {
      try {
        const r = await fetch(`${API_BASE}/api/course/${sessionId}/content/${t}`)
        const d = await r.json().catch(() => ({}))
        if (!active) return
        setHitlContentMap((prev) => ({ ...prev, [t]: d?.data ?? null }))
      } catch { /* 靜默 */ }
    }
    const run = async () => {
      // 首次拉取
      await Promise.all(meta.types.map(fetchOne))
      if (!active) return
      // 延遲補抓：節點剛完成、內容尚未落庫時，2s 後再補一次
      await new Promise((res) => setTimeout(res, 2000))
      if (!active) return
      await Promise.all(meta.types.map(fetchOne))
    }
    run()
    return () => { active = false }
  }, [pendingHitl?.hitl_id, sessionId])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // 展開節點時拉取該節點的產出
  const toggleExpand = useCallback(async (name: string) => {
    const info = STAGE_INFO[name]
    const next = expanded === name ? null : name
    setExpanded(next)
    if (next && info?.types?.length) {
      for (const t of info.types) {
        if (stageData[t] !== undefined) continue
        try {
          const r = await fetch(`${API_BASE}/api/course/${sessionId}/content/${t}`)
          const d = await r.json().catch(() => ({}))
          setStageData((prev) => ({ ...prev, [t]: d?.data ?? null }))
        } catch {
          setStageData((prev) => ({ ...prev, [t]: null }))
        }
      }
    }
  }, [expanded, sessionId, stageData])

  // 創建會話
  const createCourse = async (initial: string) => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API_BASE}/api/course/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_message: initial, user_id: USER_ID }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { showError(`創建失敗 (${r.status})${j?.detail ? '：' + JSON.stringify(j.detail) : ''}`); return }
      setSessionId(j.session_id)
      setProfile(j.profile)
      setMessages([
        { role: 'user', content: initial },
        { role: 'assistant', content: j.agent_message || '（無回覆）' },
      ])
      setPendingHitl(j.hitl ?? null)
      setNeedFollowup(j.need_followup ?? false)
    } catch (e) { showError('網絡錯誤：' + (e instanceof Error ? e.message : String(e))) }
    finally { setLoading(false) }
  }

  // 發送追問
  const sendMessage = async () => {
    const text = input.trim()
    if (!sessionId || loading) return  // 移除 !text 检查：空输入时给出提示而非静默退出
    if (!text) {
      setError('⚠️ 請先輸入內容再發送'); setTimeout(() => setError(null), 2500); return
    }
    setLoading(true); setError(null)
    pushMsg({ role: 'user', content: text })
    try {
      const r = await fetch(`${API_BASE}/api/course/${sessionId}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        // 发送失败：保留用户输入原文，便于用户修正后重试（避免 400/网络错误吞掉内容）
        showError(`發送失敗 (${r.status})${j?.detail ? '：' + JSON.stringify(j.detail) : ''}`)
        return
      }
      if (j.agent_message) pushMsg({ role: 'assistant', content: j.agent_message })
      if (j.profile) setProfile(j.profile)
      // 仅当响应明确带回 hitl 时才更新，避免内容生成阶段收到「消息已接收」这类
      // 非需求阶段响应时误把待确认面板清空，导致输入框/确认面板竞态消失。
      if (j.hitl !== undefined) setPendingHitl(j.hitl)
      if (j.need_followup !== undefined) setNeedFollowup(j.need_followup)
      setInput('') // 仅成功发送后清空输入框（发送失败已在上方 return，输入不丢）
  }
    finally { setLoading(false) }
  }

  // HITL 操作
  const doHitl = async (action: string, edits?: any) => {
    if (!sessionId || !pendingHitl) return
    setLoading(true); setError(null); setEditing(false)
    const meta = HITL_META[pendingHitl.hitl_id]
    pushMsg({ role: 'system', content: `▶ ${meta?.label ?? pendingHitl.hitl_id}：${actionLabel(action)}` })
    try {
      const r = await fetch(`${API_BASE}/api/course/${sessionId}/hitl/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      setIsComplete(!!d.is_complete)
      setPendingHitl(d.next_hitl ?? null)
      pushMsg({ role: 'system', content: `↺ 已恢復會話 ${sid}` })
    } catch (e) { showError('網絡錯誤：' + (e instanceof Error ? e.message : String(e))) }
    finally { setLoading(false) }
  }

  const reset = () => {
    setSessionId(null); setProfile(null); setMessages([]); setPendingHitl(null)
    setIsComplete(false); setStages([]); setError(null); setExpanded(null); setStageData({})
    setHitlContentMap({})
  }

  // HITL 内容預覽：HITL 出現即直接渲染產出，客戶無需先點「編輯內容後確認」。
  // 默認模式（非 editing）下在「待你確認」標題下、操作按鈕上方調用。
  const renderHitlPreview = (hitlId: string) => {
    const meta = HITL_META[hitlId]
    // HITL-1：無 types，直接展示已解析的需求摘要，讓客戶一眼看到「需求是什麼」
    if (!meta?.types?.length) {
      if (hitlId === 'HITL-1') {
        // 需求解析字段 → 人類可讀標籤（避免裸 JSON）
        const PROFILE_FIELDS: { key: string; label: string; icon?: string }[] = [
          { key: 'identity', label: '👤 身份' },
          { key: 'expertise', label: '💡 專長領域' },
          { key: 'experience', label: '📚 經驗背景' },
          { key: 'target_audience', label: '🎯 目標學員' },
          { key: 'course_topic', label: '📖 課程主題' },
          { key: 'delivery_format', label: '📦 交付形式' },
          { key: 'style_preference', label: '🎨 風格偏好' },
        ]
        const knownKeys = new Set(PROFILE_FIELDS.map(f => f.key).concat(['completeness', 'need_followup']))
        const rows = PROFILE_FIELDS
          .map(f => ({ ...f, val: profile?.[f.key] }))
          .filter(r => r.val != null && r.val !== '' && r.val !== 'null')
        const extras = Object.entries(profile ?? {}).filter(([k, v]) => !knownKeys.has(k) && v != null && v !== '' && v !== 'null')
        return (
          <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="text-[12px] font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-violet-500" /> 需求解析摘要（AI 已提取）
            </div>
            {profile ? (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {rows.map(r => (
                  <div key={r.key} className="flex gap-2 text-[12.5px] leading-relaxed items-baseline">
                    <span className="shrink-0 text-gray-400 whitespace-nowrap">{r.label}</span>
                    <span className="text-gray-800 font-medium flex-1">{String(r.val)}</span>
                  </div>
                ))}
                {extras.map(([k, v]: [string, any]) => (
                  <div key={k} className="flex gap-2 text-[12.5px] leading-relaxed items-baseline">
                    <span className="shrink-0 text-gray-400 whitespace-nowrap">{k}</span>
                    <span className="text-gray-800 font-medium flex-1">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[12px] text-gray-400">（解析中…）</p>}
          </div>
        )
      }
      return null
    }
    return (
      <div className="space-y-3 mb-3">
        {meta.types.map((t) => (
          <div key={t} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="text-[12px] font-semibold text-violet-600 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {TYPE_LABELS[t] ?? t}
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              <ContentViewer type={t} data={hitlContentMap[t]} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to="/digital-human" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 課程工坊
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-500" /> 課程工坊
              <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cpu className="w-3 h-3" /> DeepSeek 真實生成
              </span>
              <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded" title="前端构建版本">v17-{new Date().toISOString().slice(0,10).replace(/-/g,'')}</span>
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

        {sessionId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* 左：對話流 */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 flex flex-col min-h-[360px]">
              <h2 className="text-sm font-bold text-gray-900 mb-3">AI 協作對話</h2>
              <InputErrorBoundary>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : m.role === 'system' ? 'flex justify-center' : 'flex justify-start'}>
                    {m.role === 'system' ? (
                      <span className="text-[11.5px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{m.content}</span>
                    ) : (
                      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>{m.content}</div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* 输入框常驻：无条件渲染，确保任何状态下用户都能输入。
                  即使 isComplete=true 或任意 HITL 状态，输入框始终可见可用。 */}
              <>
                {pendingHitl && pendingHitl.hitl_id !== "HITL-1" && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-[12px]">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>AI 已生成「{HITL_META[pendingHitl.hitl_id]?.label ?? pendingHitl.label}」產出，請在右側確認、修改或跳過，確認後才會進入下一節點。</span>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <input
                      value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={pendingHitl?.hitl_id === "HITL-1" ? "可繼續補充需求，AI 會即時更新確認摘要…" : "回覆 AI 的追問，推進需求解析…"}
                      className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-400"
                    />
                  <button onClick={sendMessage} disabled={loading} className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 發送
                  </button>
                  </div>
                </>
              </InputErrorBoundary>
            </div>

            {/* 右：HITL / 完成 */}
            <div className="space-y-5">
              {pendingHitl && (
                <div className="bg-white rounded-xl border border-violet-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="w-4 h-4 text-violet-500" />
                    <h2 className="text-sm font-bold text-gray-900">待你確認</h2>
                  </div>
                  <p className="text-[13px] text-violet-700 font-medium mb-3">{HITL_META[pendingHitl.hitl_id]?.label ?? pendingHitl.label}</p>

                  {editing ? (
                    /* 编辑模式：JSON textarea */
                    <div className="space-y-2">
                      <textarea
                        value={editText} onChange={(e) => setEditText(e.target.value)} rows={10}
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
                    /* 默认模式：内容预览 + 操作按钮 */
                    <>
                      {/* 内容预览区 */}
                      {renderHitlPreview(pendingHitl.hitl_id)}

                      {/* 主要操作按钮 */}
                      <div className="mt-3 space-y-2">
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
                          <button onClick={openEdit} disabled={loading} className="w-full py-2 rounded-xl border border-violet-200 text-[12.5px] text-violet-600 hover:bg-violet-50 flex items-center justify-center gap-1.5 disabled:opacity-60">
                            <Pencil className="w-3.5 h-3.5" /> 編輯內容後確認（修改原始 JSON）
                          </button>
                        )}
                        <button onClick={() => doHitl('skip_all')} disabled={loading} className="w-full py-2 rounded-xl text-[12px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60">
                          <SkipForward className="w-3.5 h-3.5" /> 一鍵跳過全部確認點
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {isComplete && (
                <div className="bg-white rounded-xl border border-emerald-200 p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 交付完成
                  </h2>
                  <p className="text-[12.5px] text-gray-500 mb-3">課程包（講稿/課件/案例/營銷/定價/審核）已生成，可下載或逐節點查看產出。</p>
                  <a href={downloadUrl} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:brightness-110">
                    <Download className="w-4 h-4" /> 下載課程包 (ZIP)
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 流水線：每個節點說明 + 產出（核心改進）*/}
        {sessionId && stages.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-violet-500" /> 生成流水線 · 每個節點做什麼、產出什麼
              </h2>
              {isComplete && <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已完成</span>}
            </div>
            <div className="space-y-2.5">
              {stages.map((s, i) => {
                const info = STAGE_INFO[s.name] ?? { label: s.label, does: '', produces: '', types: [] }
                const dot = s.status === 'completed' ? 'bg-emerald-500 text-white'
                  : s.status === 'running' ? 'bg-violet-600 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-400'
                const isExp = expanded === s.name
                const hasContent = info.types.length > 0 && s.status === 'completed'
                return (
                  <div key={s.name} className={'rounded-xl border ' + (s.status === 'running' ? 'border-violet-200 bg-violet-50/40' : 'border-gray-200')}>
                    <button
                      onClick={() => hasContent && toggleExpand(s.name)}
                      className={'w-full flex items-start gap-3 p-3.5 text-left ' + (hasContent ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default')}
                    >
                      <div className={`mt-0.5 w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${dot}`}>
                        {s.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={'text-[13.5px] font-semibold ' + (s.status === 'running' ? 'text-violet-700' : 'text-gray-800')}>{info.label}</span>
                          {s.status === 'running' && <span className="text-[11px] text-violet-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 生成中…</span>}
                          {s.status === 'completed' && <span className="text-[10.5px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">已完成</span>}
                          {s.status === 'pending' && <span className="text-[10.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">等待中</span>}
                          {hasContent && <ChevronDown className={'w-4 h-4 text-gray-400 ml-auto transition-transform ' + (isExp ? 'rotate-180' : '')} />}
                        </div>
                        <p className="text-[12px] text-gray-500 mt-1"><span className="text-gray-400">做：</span>{info.does}</p>
                        <p className="text-[12px] text-gray-500"><span className="text-gray-400">產出：</span>{info.produces}</p>
                      </div>
                    </button>
                    {isExp && hasContent && (
                      <div className="px-3.5 pb-3.5 space-y-3">
                        {info.types.map((t) => (
                          <div key={t} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                            <div className="text-[12px] font-semibold text-violet-600 mb-1.5 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> {TYPE_LABELS[t] ?? t}
                            </div>
                            <ContentViewer type={t} data={stageData[t]} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
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

function actionLabel(a: string): string {
  return { confirm: '確認', skip: '跳過', regenerate: '重新生成', edit: '編輯', skip_all: '一鍵跳過全部' }[a] ?? a
}

// 內容渲染（每種類型以人類可讀格式呈現，不裸 JSON）
function ContentViewer({ type, data }: { type: string; data: any }) {
  if (data == null) return <p className="text-gray-400 text-[12px]">（暫無內容）</p>

  // ── 課程大綱（已有，保持不變） ──
  if (type === 'outline' && data.modules) {
    return (
      <div className="space-y-3">
        <div className="text-[14px] font-bold text-gray-900">{data.course_title}</div>
        <div className="text-[11.5px] text-gray-400">{data.total_modules} 模塊 · {data.total_lessons} 課時 · {data.total_duration_minutes} 分鐘</div>
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

  // ── 審核報告（已有，保持不變） ──
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
  // ── IP 定位報告（可讀化：定位宣言 / 差異標籤 / 內容矩陣 / 飛輪） ──
  if (type === 'ip_report') {
    const items: { label: string; value: React.ReactNode }[] = []
    // 一句話定位
    if (data.positioning_statement)
      items.push({ label: '🎯 定位宣言', value: <span className="text-[13px] font-medium text-gray-900">{data.positioning_statement}</span> })
    // 差異化標籤
    if (Array.isArray(data.differentiation_tags) && data.differentiation_tags.length > 0) {
      items.push({
        label: '✨ 差異化標籤',
        value: <div className="flex flex-wrap gap-1.5">
          {data.differentiation_tags.map((t: string, i: number) => (
            <span key={i} className="text-[11.5px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>,
      })
    }
    // 內容矩陣
    if (data.content_matrix) {
      const cm = data.content_matrix
      items.push({
        label: '📊 內容矩陣',
        value: (
          <div className="space-y-1 text-[12px] text-gray-700">
            {cm.platforms && <div><span className="text-gray-400">平台：</span>{String(cm.platforms)}</div>}
            {cm.content_types && <div><span className="text-gray-400">內容形式：</span>{String(cm.content_types)}</div>}
            {cm.frequency && <div><span className="text-gray-400">更新頻率：</span>{String(cm.frequency)}</div>}
          </div>
        ),
      })
    }
    // 飛輪/步驟（截圖中看到的 trust_flywheel 結構）
    const flywheelKey = Object.keys(data).find(k => Array.isArray(data[k]) && data[k][0]?.step)
    if (flywheelKey) {
      items.push({
        label: '🔄 增長飛輪',
        value: (
          <div className="space-y-2">
            {(data[flywheelKey] as any[]).map((step, i) => (
              <div key={i} className="flex gap-3 items-start rounded-lg bg-white border border-gray-100 p-2.5">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">{step.step ?? i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-gray-800 leading-snug">{step.action}</div>
                  {step.goal && <div className="text-[11.5px] text-gray-500 mt-0.5">→ 目標：{step.goal}</div>}
                </div>
              </div>
            ))}
          </div>
        ),
      })
    }
    // 其他未識別字段用可讀摘要兜底
    const knownKeys = new Set(['positioning_statement', 'differentiation_tags', 'content_matrix', flywheelKey])
    const extra = Object.entries(data).filter(([k]) => !knownKeys.has(k))
    if (extra.length > 0) {
      items.push(...extra.map(([k, v]: [string, any]) => ({
        label: k,
        value: typeof v === 'string'
          ? <pre className="whitespace-pre-wrap font-sans text-[12px] text-gray-600">{v}</pre>
          : <pre className="whitespace-pre-wrap font-sans text-[11.5px] text-gray-600 max-h-[200px] overflow-y-auto">{JSON.stringify(v, null, 2)}</pre>,
      })))
    }

    return items.length > 0 ? (
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <div className="text-[11.5px] font-semibold text-violet-600 mb-1">{item.label}</div>
            <div>{item.value}</div>
          </div>
        ))}
      </div>
    ) : <p className="text-gray-400 text-[12px]">（暫無 IP 定位數據）</p>
  }

  // ── 講稿（按課時展示） ──
  if (type === 'scripts') {
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2.5">
          {data.map((item: any, i: number) => (
            <div key={i} className="rounded-lg border border-gray-100 p-3">
              <div className="text-[12.5px] font-semibold text-gray-800 mb-1">
                {item.title || item.lesson_title || `講稿 ${i + 1}`}
              </div>
              {item.module && <span className="text-[10.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mr-1.5">{item.module}</span>}
              {(typeof item.content === 'string' ? item.content : item.script || item.body) && (
                <p className="text-[12px] text-gray-600 mt-1.5 leading-relaxed line-clamp-4">
                  {(typeof item.content === 'string' ? item.content : item.script || item.body || '').slice(0, 300)}{(item.content?.length > 300 ? '…' : '')}
                </p>
              )}
              {item.duration_minutes && <span className="text-[10.5px] text-gray-400 ml-auto">{item.duration_minutes}′</span>}
            </div>
          ))}
        </div>
      )
    }
    if (typeof data === 'object') {
      // 對象形式：{ "M1L1": {...}, ... }
      return (
        <div className="space-y-2.5">
          {Object.entries(data).map(([key, val]: [string, any], i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-3">
              <div className="text-[12.5px] font-semibold text-gray-800 mb-1">{val.title || key}</div>
              {val.script && <p className="text-[12px] text-gray-600 mt-1 leading-relaxed line-clamp-4">{String(val.script).slice(0, 300)}…</p>}
            </div>
          ))}
        </div>
      )
    }
  }

  // ── 課件 ──
  if (type === 'slides') {
    const entries = Array.isArray(data) ? data : (typeof data === 'object' ? Object.entries(data).map(([k, v]: [string, any]) => ({ ...v, _key: k })) : [])
    if (entries.length > 0) {
      return (
        <div className="space-y-2">
          {entries.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2.5 text-[12px] text-gray-700">
              <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded bg-blue-50 text-blue-600 text-[10px] font-bold">PPT</span>
              <span className="font-medium truncate">{item.title || item._key || `課件 ${i + 1}`}</span>
              {item.slide_count && <span className="text-gray-400 ml-auto">{item.slide_count} 頁</span>}
            </div>
          ))}
        </div>
      )
    }
  }

  // ── 實戰案例 ──
  if (type === 'cases') {
    const entries = Array.isArray(data) ? data : []
    if (entries.length > 0) {
      return (
        <div className="space-y-2.5">
          {entries.map((c: any, i: number) => (
            <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
              <div className="text-[12.5px] font-semibold text-gray-800 mb-1">案例 {i + 1}：{c.title || c.case_name || ''}</div>
              {c.context && <p className="text-[12px] text-gray-600"><span className="text-gray-400">背景：</span>{c.context}</p>}
              {c.action && <p className="text-[12px] text-gray-600 mt-1"><span className="text-gray-400">做法：</span>{c.action}</p>}
              {c.result && <p className="text-[12px] text-emerald-700 mt-1"><span className="text-gray-400">效果：</span>{c.result}</p>}
            </div>
          ))}
        </div>
      )
    }
  }

  // ── 營銷文案 ──
  if (type === 'marketing') {
    if (typeof data === 'object' && !Array.isArray(data)) {
      return (
        <div className="space-y-3">
          {Object.entries(data).map(([k, v]: [string, any]) => (
            <div key={k}>
              <div className="text-[11.5px] font-semibold text-violet-600 mb-1 capitalize">{k.replace(/_/g, ' ')}</div>
              <div className="text-[12.5px] text-gray-700 leading-relaxed whitespace-pre-wrap">{typeof v === 'string' ? v : JSON.stringify(v, null, 2)}</div>
            </div>
          ))}
        </div>
      )
    }
    if (typeof data === 'string') {
      return <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-gray-700">{data}</pre>
    }
  }

  // ── 定價方案 ──
  if (type === 'pricing') {
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((tier: any, i: number) => (
            <div key={i} className="rounded-lg border border-emerald-100 p-3 flex items-center gap-4">
              <div>
                <div className="text-[14px] font-bold text-emerald-700">{tier.name || tier.tier || `方案${i+1}`}</div>
                {tier.price !== undefined && <div className="text-[18px] font-extrabold text-gray-900">¥{tier.price}</div>}
              </div>
              <div className="flex-1 space-y-0.5 text-[11.5px] text-gray-600">
                {(tier.features || tier.includes || []).map((f: string, j: number) => (
                  <div key={j}>✓ {f}</div>
                ))}
                {tier.description && <div className="mt-1 text-gray-500">{tier.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )
    }
    if (typeof data === 'object' && !Array.isArray(data)) {
      return (
        <div className="rounded-lg border border-gray-100 p-3 text-[13px] text-gray-800">
          <div className="text-[16px] font-bold text-emerald-700">¥{data.price ?? data.amount ?? '—'}</div>
          {data.strategy && <div className="text-[12px] text-gray-500 mt-1">{data.strategy}</div>}
          {data.tiers && <div className="mt-2 space-y-1">{JSON.stringify(data.tiers)}</div>}
        </div>
      )
    }
  }

  // ── 音頻 / 視頻 ──
  if ((type === 'audio' || type === 'video') && typeof data === 'object') {
    const entries = Array.isArray(data) ? data : (data.files || data.items || Object.values(data))
    if (Array.isArray(entries) && entries.length > 0) {
      return (
        <div className="space-y-2">
          {entries.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg border border-gray-100 p-2.5 text-[12px]">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-[10px]">{type === 'audio' ? '♫' : '▶'}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 truncate">{item.title || item.name || item.filename || `${type} ${i + 1}`}</div>
                {item.duration && <span className="text-gray-400">{item.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      )
    }
  }

  // ── 最終兜底（純文本 / 未知結構） ──
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
