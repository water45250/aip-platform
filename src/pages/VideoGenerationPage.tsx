import { useEffect, useRef, useState } from 'react'
import {
  Image as ImageIcon, Wand2, Download, Send,
  Cpu, Check, PlayCircle, Sparkles, Loader2, AlertTriangle,
} from 'lucide-react'

// OpenMontage 后端 API 基址：与数字人模块同约定（/api/openmontage/...），
// 规避 /api/api/ 双前缀。VITE_API_BASE_URL 为空时直接走同源 /api。
const RAW = import.meta.env.VITE_API_BASE_URL as string | undefined
const API_BASE = RAW && RAW !== '/api' ? RAW.replace(/\/+$/, '') : ''
const om = (p: string) => `${API_BASE}/api/openmontage${p}`

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('aip_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

interface Shot {
  index: number
  label: string
  text: string
  image?: string
  audio?: string
  duration: number
}

interface JobState {
  id: string
  status: 'queued' | 'running' | 'done' | 'failed'
  progress: number
  stage: string
  message: string
  title: string
  shots: Shot[]
  output: string | null
  error: string | null
  qa?: { duration: number; size_bytes: number; has_video: boolean; has_audio: boolean }
}

interface Capability {
  capability: string
  configured: number
  total: number
  available_providers: string[]
  unavailable_providers: string[]
}

const STYLES = ['知識解說', '科技測評', '品牌故事', '種草短視頻', '知識科普']
const DURATIONS = [30, 40, 60, 90]
const VOICES = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '曉曉（女聲·溫柔）' },
  { id: 'zh-CN-YunxiNeural', name: '雲希（男聲·活力）' },
  { id: 'zh-CN-YunyangNeural', name: '雲揚（男聲·沉穩）' },
]

const CAP_LABELS: Record<string, string> = {
  script_writing: '腳本/分鏡',
  image_generation: 'AI 生圖',
  voice_tts: '智能配音',
  real_footage: '真實素材',
  video_generation: 'AI 生視頻',
}

export default function VideoGenerationPage() {
  const [topic, setTopic] = useState('AI 如何提升個人生產力')
  const [style, setStyle] = useState(STYLES[0])
  const [duration, setDuration] = useState(40)
  const [voice, setVoice] = useState(VOICES[0].id)

  const [caps, setCaps] = useState<Capability[] | null>(null)
  const [capsError, setCapsError] = useState(false)

  const [job, setJob] = useState<JobState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<number | null>(null)

  // 拉取能力目录（哪些 Provider 已配置）
  useEffect(() => {
    let alive = true
    fetch(om('/capabilities'))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setCaps(d.capabilities || []) })
      .catch(() => { if (alive) setCapsError(true) })
    return () => { alive = false }
  }, [])

  // 輪詢任務狀態
  const stopPoll = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null }
  }
  const poll = (id: string) => {
    stopPoll()
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(om(`/jobs/${id}`))
        if (!r.ok) return
        const d = await r.json()
        const next: JobState = {
          id: d.id,
          status: d.status === 'done' ? 'done' : d.status === 'failed' ? 'failed' : 'running',
          progress: d.progress ?? 0,
          stage: d.stage ?? '',
          message: d.message ?? '',
          title: d.title ?? '',
          shots: d.shots ?? [],
          output: d.output ?? null,
          error: d.error ?? null,
          qa: d.qa,
        }
        setJob(next)
        if (next.status === 'done' || next.status === 'failed') stopPoll()
      } catch { /* 忽略單次輪詢錯誤，下次重試 */ }
    }, 2000)
  }

  useEffect(() => () => stopPoll(), [])

  const submit = async () => {
    if (!topic.trim() || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch(om('/jobs'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ topic, style, duration, voice }),
      })
      if (!r.ok) throw new Error('submit failed')
      const d = await r.json()
      setJob({ id: d.id, status: 'running', progress: 0, stage: '排隊', message: '任務已提交', title: topic, shots: [], output: null, error: null })
      poll(d.id)
    } catch {
      setJob({ id: '', status: 'failed', progress: 0, stage: '', message: '', title: topic, shots: [], output: null, error: '提交失敗，請確認服務可用後重試' })
    } finally {
      setSubmitting(false)
    }
  }

  const mediaUrl = (id: string, file: string) => om(`/media/${id}/${file}`)

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 頭部 */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" /> 影片生成
            </h1>
            <p className="text-[12.5px] text-gray-500 mt-1">
              由 OpenMontage 驅動 · 腳本→生圖→配音→合成 一條龍真實生成
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 font-medium">
            Powered by OpenMontage
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* 左欄 */}
          <div className="space-y-6">
            {/* 創作意圖 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-4">創作意圖</h2>
              <label className="block text-[12.5px] text-gray-500 mb-1.5">視頻主題</label>
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：AI 如何提升個人生產力"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-violet-400 outline-none text-[13px] text-gray-800"
              />
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-[12px] text-gray-500 mb-1">風格</label>
                  <SelectInput value={style} options={STYLES} onChange={setStyle} />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-500 mb-1">時長</label>
                  <SelectInput
                    value={String(duration)}
                    options={DURATIONS.map(String)}
                    onChange={(v) => setDuration(Number(v))}
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-gray-500 mb-1">配音音色</label>
                  <SelectInput value={voice} options={VOICES.map((v) => v.id)} labels={VOICES.map((v) => v.name)} onChange={setVoice} />
                </div>
              </div>
              <button
                onClick={submit}
                disabled={submitting || !topic.trim()}
                className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {job && job.status === 'running' ? '生成中…' : '開始生成影片'}
              </button>
            </section>

            {/* 能力面板 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[15px] font-semibold text-gray-800">可用能力</h2>
                <span className="text-[11px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Provider 配置</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-3">系統按服務器已配置的雲 Key 自動啟用能力；未配置項將以零成本路徑兜底</p>
              {capsError ? (
                <div className="flex items-center gap-2 text-[12.5px] text-amber-600 bg-amber-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4" /> 能力服務暫不可達，請確認後端 aip-openmontage 已啟動
                </div>
              ) : !caps ? (
                <div className="text-[12.5px] text-gray-400">載入中…</div>
              ) : (
                <div className="space-y-2">
                  {caps.map((c) => {
                    const ok = c.configured > 0
                    return (
                      <div key={c.capability} className="flex items-center justify-between border rounded-xl px-3 py-2.5">
                        <span className="text-[13px] text-gray-700">{CAP_LABELS[c.capability] || c.capability}</span>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {ok ? (
                            <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              {c.available_providers.join(' · ')}
                            </span>
                          ) : (
                            <>
                              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {c.unavailable_providers.join(' · ') || '未配置'}
                              </span>
                              <span className="text-[10.5px] text-amber-600">零成本兜底</span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 進度與分鏡 */}
            {job && (job.status === 'running' || job.status === 'done' || job.status === 'failed') && (
              <section className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-[15px] font-semibold text-gray-800 mb-3">
                  {job.status === 'failed' ? '生成失敗' : job.status === 'done' ? '生成完成' : '生成進度'}
                </h2>
                {job.status === 'failed' ? (
                  <div className="flex items-center gap-2 text-[13px] text-rose-600 bg-rose-50 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4" /> {job.error || '未知錯誤'}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[12.5px] text-gray-600 mb-2">
                      <span>{job.stage || '處理中'}</span>
                      <span className="font-semibold text-violet-600">{job.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{ width: `${job.progress}%` }} />
                    </div>
                    <p className="text-[12px] text-gray-400 mb-3">{job.message}</p>
                    <div className="space-y-2">
                      {job.shots.map((s) => (
                        <div key={s.index} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                          {s.image ? (
                            <img src={mediaUrl(job.id, s.image)} alt={s.label} className="w-12 h-8 rounded-md object-cover bg-gray-200" />
                          ) : (
                            <div className="w-12 h-8 rounded-md bg-violet-100 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-violet-500" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] text-gray-700 truncate">{s.label} · {s.text}</p>
                            <p className="text-[11px] text-gray-400">{s.duration ? `配音 ${s.duration.toFixed(1)}s` : '處理中…'}</p>
                          </div>
                        </div>
                      ))}
                      {job.shots.length === 0 && <p className="text-[12px] text-gray-400">正在編寫腳本與分鏡…</p>}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>

          {/* 右欄 */}
          <div className="space-y-6">
            {/* 預覽 / 成片 */}
            <section className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-3">預覽 / 成片</h2>
              {job && job.status === 'done' && job.output ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
                    <video controls src={mediaUrl(job.id, job.output)} className="w-full h-full" />
                  </div>
                  <div className="flex gap-2">
                    <a href={mediaUrl(job.id, job.output)} download className="flex-1 py-2 rounded-lg text-[12.5px] text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> 下載成片
                    </a>
                    <button className="flex-1 py-2 rounded-lg text-[12.5px] text-white bg-gradient-to-r from-violet-600 to-purple-600 transition-all flex items-center justify-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> 導入成品預覽
                    </button>
                  </div>
                  {job.qa && (
                    <p className="text-[11px] text-gray-400">
                      時長 {job.qa.duration.toFixed(1)}s · {(job.qa.size_bytes / 1024 / 1024).toFixed(2)} MB · 含視頻{job.qa.has_video ? '✓' : '✗'} 含音軌{job.qa.has_audio ? '✓' : '✗'}
                    </p>
                  )}
                </div>
              ) : job && job.status === 'running' ? (
                <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 mx-auto animate-spin opacity-60" />
                    <p className="text-[12px] mt-2">渲染預覽 · 生成中</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <PlayCircle className="w-10 h-10 mx-auto opacity-60" />
                    <p className="text-[12px] mt-2">成片預覽 · Remotion / FFmpeg</p>
                  </div>
                </div>
              )}
            </section>

            {/* 說明 / 成本治理 */}
            <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-violet-500" />
                <h2 className="text-[14px] font-semibold text-gray-800">生成說明</h2>
              </div>
              <div className="space-y-2 text-[12.5px] text-gray-600">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 腳本/分鏡：OpenAI / DeepSeek（雲端 LLM）</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 生圖/生視頻：fal.ai（FLUX·Kling·Veo）· OpenAI · Kling 官方</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 配音：edge-tts（免費雲端 TTS）</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 音樂：Suno（需 Key）</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 合成：FFmpeg 1080p</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 兜底：Archive.org 真實素材 + 漸變占位</div>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">配置雲 Key（FAL_KEY / OPENAI_API_KEY / KLING_API_KEY / SUNO_API_KEY）即啟用對應真實生成；未配置時自動降級為零成本路徑，仍可產出成片。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectInput({
  value, options, labels, onChange,
}: { value: string; options: string[]; labels?: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 outline-none cursor-pointer"
      >
        {options.map((o, i) => (
          <option key={o} value={o}>{labels ? labels[i] : o}</option>
        ))}
      </select>
    </div>
  )
}
