import { useState } from 'react'
import {
  Play, Pause, Film, FileText, Image, Scissors, Cpu, Send, Download, Sparkles,
  Search, ShieldCheck, Link, CheckCircle2, Music, Mic, Video, RefreshCw, ArrowLeft,
} from 'lucide-react'
import { sampleProject } from '../lib/openmontage-schema'

// 類型 → lucide 圖標
const TYPE_ICON: Record<string, any> = {
  video: Video,
  animation: Film,
  image: Image,
  narration: Mic,
  music: Music,
  subtitle: FileText,
}

// 流水線階段（成品預覽階段，全部已完成）
const STAGES = [
  { key: 'research', label: '選題挖掘', icon: Search, status: 'complete', desc: 'AI 已分析熱門趨勢與競品內容，完成選題策劃。' },
  { key: 'proposal', label: '方案提案', icon: Sparkles, status: 'complete', desc: 'AI 已生成完整創作方案，包含風格定位與結構規劃。' },
  { key: 'script', label: '腳本創作', icon: FileText, status: 'complete', desc: 'AI 已根據選題生成腳本大綱，支持在線編輯調整。' },
  { key: 'scene', label: '分鏡規劃', icon: Film, status: 'complete', desc: 'AI 已完成分鏡設計，確定每個鏡頭的畫面與時長。' },
  { key: 'assets', label: '素材生成', icon: Image, status: 'complete', desc: '已生成視頻、圖片、語音等全部素材，可預覽確認。' },
  { key: 'edit', label: '智能剪輯', icon: Scissors, status: 'complete', desc: 'AI 已自動完成素材拼接、轉場與節奏優化。' },
  { key: 'compose', label: '合成渲染', icon: Cpu, status: 'complete', desc: '已完成最終渲染，視頻準備就緒可供發布。' },
]

// 示意性的剪輯 / 終審 / 渲染 / 發布數據（sampleProject 未含此類後製契約，僅作 UI 演示）
const EDIT_CUTS = sampleProject.sections.map((s, i) => ({
  id: 'c' + (i + 1),
  source: s.id,
  in_seconds: s.start_seconds,
  out_seconds: s.end_seconds,
  transition: i === 0 ? 'fade' : 'cut',
}))
const REVIEW_CHECKS = [
  { name: '內容安全合規', detail: '通過', passed: true },
  { name: '字幕語音對齊', detail: '誤差 < 120ms', passed: true },
  { name: '版權風險掃描', detail: '無命中', passed: true },
  { name: '畫質檢測', detail: '≥ 1080P', passed: true },
]
const PUBLISH_LOG = [
  { platform: '抖音', status: 'published', published_at: '2024-05-12 15:20', url: 'https://v.douyin.com/example' },
  { platform: 'YouTube', status: 'scheduled', published_at: '2024-05-13 10:00', url: '' },
  { platform: '小紅書', status: 'pending', published_at: '', url: '' },
]

function fmt(s: number): string {
  s = Math.max(0, Math.round(s))
  const m = Math.floor(s / 60)
  const x = s % 60
  return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    approved: { cls: 'bg-emerald-100 text-emerald-700', label: '已批准' },
    complete: { cls: 'bg-violet-100 text-violet-700', label: '已完成' },
    published: { cls: 'bg-emerald-100 text-emerald-700', label: '已發布' },
    scheduled: { cls: 'bg-blue-100 text-blue-700', label: '已排程' },
    pending: { cls: 'bg-gray-100 text-gray-600', label: '待處理' },
    in_progress: { cls: 'bg-blue-100 text-blue-700', label: '進行中' },
  }
  const m = map[status] || { cls: 'bg-gray-100 text-gray-600', label: status }
  return <span className={'text-[11px] px-2 py-0.5 rounded-full ' + m.cls}>{m.label}</span>
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-gray-500">{k}</span>
      <span className="text-gray-800 font-medium">{v}</span>
    </div>
  )
}

export default function FinalPreviewPage() {
  const project = sampleProject
  const total = project.total_duration_seconds
  const totalCost = project.assets.reduce((sum, a) => sum + (a.cost_usd || 0), 0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(32) // 百分比
  const [tab, setTab] = useState<'scenes' | 'assets'>('scenes')
  const [isPublishing, setIsPublishing] = useState(false)

  const currentTime = Math.round((progress / 100) * total)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    setProgress(pct)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = project.id + '.openmontage.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePublish = () => {
    if (isPublishing) return
    setIsPublishing(true)
    setTimeout(() => setIsPublishing(false), 1500)
  }

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 狀態橫幅 + 操作 */}
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white shadow-lg shadow-violet-500/25">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[12px] text-white/70">項目 {project.id} · 流水線 agent_driven</div>
              <div className="text-xl font-bold mt-1">{project.title}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-[12.5px] text-gray-700 bg-white/90 hover:bg-white rounded-full px-3.5 py-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-violet-500" /> 導出工程 JSON
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-white bg-white/15 hover:bg-white/25 rounded-full px-4 py-1.5 transition-all disabled:opacity-70"
              >
                {isPublishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isPublishing ? '發布中…' : '一鍵發布'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <StatusChip status="complete" />
            <StatusChip status="approved" />
            <span className="text-[12px] text-white/80">成本 ${totalCost.toFixed(2)}</span>
          </div>
        </div>

        {/* 播放器 + 成片信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-black overflow-hidden relative">
            <div className="aspect-video flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-[#1a1a2e] to-fuchsia-900/30" />
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative z-10 w-16 h-16 rounded-full bg-white/95 flex items-center justify-center text-violet-600 shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
              </button>
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <div
                  onClick={handleSeek}
                  className="h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer"
                >
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                    style={{ width: progress + '%' }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/80 mt-1.5">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Film className="w-4 h-4 text-violet-500" /> 成片信息
            </h3>
            <div className="space-y-2.5">
              <MetaRow k="時長" v={fmt(total)} />
              <MetaRow k="分辨率" v={project.outputs[0].resolution} />
              <MetaRow k="格式" v={project.outputs[0].format} />
              <MetaRow k="場景數" v={project.sections.length + ' 幕'} />
              <MetaRow k="素材數" v={project.assets.length + ' 項'} />
              <MetaRow k="剪輯軌" v={EDIT_CUTS.length + ' 段'} />
              <MetaRow k="渲染引擎" v="ffmpeg" />
              <MetaRow k="輸出路徑" v={project.outputs[0].path} />
              <MetaRow k="審批" v="人工已批准 ✓" />
            </div>
          </div>
        </div>

        {/* 製作進度 */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" /> 製作進度
          </h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STAGES.map((st, i) => {
              const Icon = st.icon
              return (
                <div key={st.key} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl bg-white border border-gray-100 shadow-sm w-[84px]">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] text-gray-700 font-medium leading-tight text-center">{st.label}</div>
                    <StatusChip status={st.status} />
                  </div>
                  {i < STAGES.length - 1 && <ArrowLeft className="w-4 h-4 text-gray-300 shrink-0 rotate-180" />}
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
            {STAGES.map((st) => {
              const Icon = st.icon
              return (
                <div key={st.key} className="rounded-xl bg-white border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[13px] font-semibold text-gray-800">{st.label}</div>
                    <StatusChip status={st.status} />
                  </div>
                  <div className="text-[12px] text-gray-600 leading-relaxed">
                    {st.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 分鏡 / 素材 Tab */}
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab('scenes')}
                className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ' + (tab === 'scenes' ? 'bg-violet-50 text-violet-600' : 'text-gray-500 hover:text-gray-700')}
              >
                <Film className="w-4 h-4" /> 分鏡列表
              </button>
              <button
                onClick={() => setTab('assets')}
                className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ' + (tab === 'assets' ? 'bg-violet-50 text-violet-600' : 'text-gray-500 hover:text-gray-700')}
              >
                <Image className="w-4 h-4" /> 素材清單
                <span className="text-[11px] text-gray-400">{project.assets.length}</span>
              </button>
            </div>
            {tab === 'assets' && (
              <div className="text-[12px]">
                <span className="text-gray-500">總成本</span>{' '}
                <span className="font-semibold text-gray-800">${totalCost.toFixed(2)}</span>
              </div>
            )}
          </div>

          {tab === 'scenes' ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {project.sections.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-mono">{s.id}</span>
                    <span className="text-[12.5px] font-medium text-gray-800">{s.label}</span>
                    {s.speaker_directions && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.speaker_directions}</span>
                    )}
                    <span className="ml-auto text-[11px] text-gray-400 font-mono">{fmt(s.start_seconds)}–{fmt(s.end_seconds)}</span>
                  </div>
                  <div className="text-[12px] text-gray-600 leading-snug">{s.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left">
                    {['ID', '類型', '來源工具', '模型', '時長', '解析度', '格式', '成本', '質量'].map((h) => (
                      <th key={h} className="text-[12px] font-medium text-gray-400 bg-gray-50 px-3 py-2 border-b border-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {project.assets.map((a) => {
                    const Icon = TYPE_ICON[a.type] || FileText
                    return (
                      <tr key={a.id} className="text-[12px]">
                        <td className="px-3 py-2.5 border-b border-gray-50 font-mono text-violet-600">{a.id}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50">
                          <span className="inline-flex items-center gap-1 text-gray-700">
                            <Icon className="w-3.5 h-3.5 text-gray-400" />{a.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-gray-50 text-gray-700">{a.source_tool}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50 text-gray-700">{a.model}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50 font-mono text-gray-600">{a.duration_seconds ? fmt(a.duration_seconds) : '-'}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50 text-gray-600">{a.resolution || '-'}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50 text-gray-600">{a.format || '-'}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50 font-mono text-gray-700">${(a.cost_usd || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5 border-b border-gray-50">
                          <span className={((a.quality_score ?? 0) >= 0.9 ? 'text-emerald-600' : 'text-amber-600') + ' font-medium'}>
                            {((a.quality_score || 0) * 100).toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 剪輯決策 / 終審 / 渲染報告 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-violet-500" /> 剪輯決策
            </h3>
            <div className="text-[12px] text-gray-500 mb-2">剪輯段 {EDIT_CUTS.length} · 轉場 {EDIT_CUTS.filter((c) => c.transition !== 'cut').length} · 疊加 2</div>
            {EDIT_CUTS.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-[12px] py-1 border-b border-gray-50">
                <span className="font-mono text-violet-600">{c.id}</span>
                <span className="text-gray-700">{c.source}</span>
                <span className="text-gray-400 font-mono">{fmt(c.in_seconds)}→{fmt(c.out_seconds)}</span>
                <span className="ml-auto text-gray-400">{c.transition}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-500" /> 終審確認
            </h3>
            <div className="mb-2 flex items-center gap-2">
              <StatusChip status="approved" />
              <span className="text-[12px] text-gray-500">{project.outputs[0].path.split('/').pop()}</span>
            </div>
            {REVIEW_CHECKS.map((c) => (
              <div key={c.name} className="flex items-center gap-2 py-1 text-[12.5px]">
                <CheckCircle2 className={'w-4 h-4 ' + (c.passed ? 'text-emerald-500' : 'text-rose-500')} />
                <span className="text-gray-700">{c.name}</span>
                <span className="ml-auto text-[11px] text-gray-400">{c.detail}</span>
              </div>
            ))}
            <div className="text-[12px] text-emerald-600 mt-1">無問題 · 建議直接發布</div>
          </div>

          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500" /> 渲染報告
            </h3>
            <MetaRow k="渲染時長" v="42s" />
            <MetaRow k="輸出" v={project.outputs[0].format + ' · ' + project.outputs[0].resolution} />
            <MetaRow k="幻燈片風險" v="2/6" />
            <div className="text-[12px] text-gray-500 pt-1 border-t border-gray-50 mt-1">
              已通過自動校驗，碼率與色彩空間符合平台規範。
            </div>
            <div className="text-[12px] text-emerald-600">無警告</div>
          </div>
        </div>

        {/* 發布記錄 */}
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-violet-500" /> 發布記錄
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PUBLISH_LOG.map((e) => (
              <div key={e.platform} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-gray-800">{e.platform}</span>
                  <StatusChip status={e.status} />
                </div>
                <div className="text-[11px] text-gray-400 font-mono mt-1">{e.published_at || '尚未發布'}</div>
                {e.url ? (
                  <a href={e.url} className="text-[11px] text-violet-600 hover:underline break-all">{e.url}</a>
                ) : (
                  <div className="text-[11px] text-gray-400">待填充連結</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 導出提示 */}
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 flex items-start gap-3">
          <Link className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
          <div className="text-[12.5px] text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-800">項目已準備就緒。</span>
            所有製作階段已完成審核，視頻可直接發布至各平台。如需修改，可返回對應步驟重新編輯。
          </div>
        </div>
      </div>
    </div>
  )
}
