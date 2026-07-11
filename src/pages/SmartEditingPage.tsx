import { useState } from 'react'
import {
  Sparkles, PlayCircle, Pause, RefreshCw, Volume2, Wand2, Zap,
  Crop, Scissors, Combine, FileText, ChevronDown, Upload, Trash2,
  Send, Check,
} from 'lucide-react'

export default function SmartEditingPage() {
  const [playing, setPlaying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedAi, setSelectedAi] = useState<Set<number>>(new Set([0, 2]))
  const [activeTool, setActiveTool] = useState<string | null>('split')
  const [resolution, setResolution] = useState('1080P')
  const [format, setFormat] = useState('MP4')
  const [lockRuntime, setLockRuntime] = useState(true)

  const [subtitles, setSubtitles] = useState([
    { id: 1, time: '00:03', text: '未來 5 年，AI 將重塑工作…' },
    { id: 2, time: '00:11', text: '從工具、效率到協作四維度' },
  ])

  const aiSuggestions = ['刪除靜音片段', '去除口誤/重複', '節奏優化', '自動轉場建議']

  const tools = [
    { key: 'crop', icon: Crop, label: '裁剪' },
    { key: 'split', icon: Scissors, label: '分割' },
    { key: 'merge', icon: Combine, label: '合併' },
    { key: 'transition', icon: Wand2, label: '轉場' },
  ]

  const toggleAi = (i: number) => {
    setSelectedAi((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const runAiEdit = () => {
    if (editing) return
    setEditing(true)
    setTimeout(() => setEditing(false), 1600)
  }

  const removeSubtitle = (id: number) => {
    setSubtitles((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 預覽 + 右側工具區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左欄：預覽視窗 + AI 智能建議 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 預覽視窗 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">預覽視窗</h2>
                <span className="text-[11.5px] text-gray-400">1080P · 00:42 / 03:15</span>
              </div>
              <div className="relative flex-1 rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[240px]">
                <div className="text-center text-gray-400">
                  <PlayCircle className="w-12 h-12 mx-auto opacity-60" />
                  <p className="text-[12px] mt-2">AI 協作工作流 · 剪輯預覽</p>
                </div>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <button className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-800 hover:bg-white transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    className="w-11 h-11 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30"
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </button>
                  <button className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-800 hover:bg-white transition-all">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </span>
              </div>
            </div>

            {/* AI 智能建議 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-bold text-gray-900">AI 智能建議</h2>
                <span className="text-[11px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">OpenMontage edit</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {aiSuggestions.map((label, i) => {
                  const on = selectedAi.has(i)
                  return (
                    <button
                      key={i}
                      onClick={() => toggleAi(i)}
                      className={
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ' +
                        (on
                          ? 'border-violet-300 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300')
                      }
                    >
                      <Zap className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-[12.5px] text-gray-700">{label}</span>
                      {on && <Check className="w-3.5 h-3.5 text-emerald-600 font-bold ml-auto" />}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={runAiEdit}
                disabled={editing}
                className="mt-3 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-80"
              >
                {editing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> AI 剪輯中…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> 一鍵智能剪輯
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右欄：剪輯工具 + 字幕編輯 + 導出設置 */}
          <div className="space-y-6">
            {/* 剪輯工具 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">剪輯工具</h2>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((t) => {
                  const Icon = t.icon
                  const active = activeTool === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActiveTool(t.key)}
                      className={
                        'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] border transition-all ' +
                        (active
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-violet-50')
                      }
                    >
                      <Icon className="w-4 h-4" /> {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 字幕編輯 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">字幕編輯</h2>
              <div className="space-y-2">
                {subtitles.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
                    <span className="text-[11px] text-violet-500 font-mono">{s.time}</span>
                    <span className="text-[12.5px] text-gray-700 flex-1 truncate">{s.text}</span>
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <button
                      onClick={() => removeSubtitle(s.id)}
                      className="text-gray-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {subtitles.length === 0 && (
                  <p className="text-[12px] text-gray-400 text-center py-2">暫無字幕</p>
                )}
                <button className="text-[12px] text-violet-600 hover:underline">AI 自動對齊字幕 ›</button>
              </div>
            </div>

            {/* 導出設置 */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">導出設置</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] text-gray-500 mb-1">分辨率</label>
                  <div className="relative">
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full appearance-none px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 outline-none cursor-pointer"
                    >
                      <option>1080P</option>
                      <option>2K</option>
                      <option>4K</option>
                      <option>豎屏 9:16</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-gray-500 mb-1">格式</label>
                  <div className="relative">
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full appearance-none px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 outline-none cursor-pointer"
                    >
                      <option>MP4</option>
                      <option>MOV</option>
                      <option>WebM</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[12.5px] text-gray-700">鎖定 render_runtime</p>
                    <p className="text-[11px] text-gray-400">鎖定後不再自動變更時長</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={lockRuntime}
                    onClick={() => setLockRuntime((v) => !v)}
                    className={
                      'relative inline-flex h-6 w-[42px] items-center rounded-full transition-colors ' +
                      (lockRuntime ? 'bg-emerald-500' : 'bg-gray-300')
                    }
                  >
                    <span
                      className={
                        'inline-block h-[18px] w-[18px] rounded-full bg-white transition-transform ' +
                        (lockRuntime ? 'translate-x-[21px]' : 'translate-x-[3px]')
                      }
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 時間軸 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">時間軸</h2>
            <div className="flex items-center gap-3 text-[11.5px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-violet-400" />視頻軌</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />音頻軌</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />字幕軌</span>
            </div>
          </div>
          <div className="space-y-2">
            {/* 視頻軌 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-12 shrink-0">視頻</span>
              <div className="flex-1 flex gap-1.5">
                <div className="h-11 rounded-lg bg-violet-100 border border-violet-200 flex items-center px-2 text-[11px] text-violet-700 shrink-0" style={{ width: 120 }}>開頭鉤子</div>
                <div className="h-11 rounded-lg bg-violet-100 border border-violet-200 flex items-center px-2 text-[11px] text-violet-700 shrink-0" style={{ width: 150 }}>痛點引入</div>
                <div className="h-11 rounded-lg bg-violet-200 border border-violet-300 flex items-center px-2 text-[11px] text-violet-800 shrink-0" style={{ width: 180 }}>核心內容</div>
                <div className="h-11 rounded-lg bg-violet-100 border border-violet-200 flex items-center px-2 text-[11px] text-violet-700 shrink-0" style={{ width: 130 }}>總結CTA</div>
              </div>
            </div>
            {/* 音頻軌 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-12 shrink-0">音頻</span>
              <div className="flex-1 flex gap-1.5">
                <div className="h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center px-2 text-[11px] text-emerald-700 w-full">專業男聲配音 · BGM</div>
              </div>
            </div>
            {/* 字幕軌 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-12 shrink-0">字幕</span>
              <div className="flex-1 flex gap-1.5">
                <div className="h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center px-2 text-[11px] text-amber-700" style={{ width: '60%' }}>自動字幕 · 已對齊</div>
                <div className="h-8 rounded-lg bg-amber-50 border border-dashed border-amber-300 flex items-center px-2 text-[11px] text-amber-500" style={{ width: '36%' }}>待生成 02:10–03:15</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                <Upload className="w-4 h-4" /> 導入素材
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                <Trash2 className="w-4 h-4 text-rose-500" /> 廢棄片段
              </button>
            </div>
            <button className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center gap-2">
              <Send className="w-4 h-4" /> 渲染並發布
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
