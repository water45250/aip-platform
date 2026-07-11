import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Download, Calendar, TrendingUp, TrendingDown,
  FileVideo, Play, ThumbsUp, MessageCircle, Share2, Users,
  ArrowRight, RefreshCw,
} from 'lucide-react'

// ============ Mock 数据 ============
const KPI_CARDS = [
  { key: 'content', label: '內容總數', value: '1,248', icon: FileVideo, color: '#7C3AED', change: '+12.5%', up: true },
  { key: 'views',   label: '播放量',   value: '128.6萬', icon: Play,      color: '#3B82F6', change: '+18.7%', up: true },
  { key: 'likes',   label: '點贊量',   value: '8.7萬',   icon: ThumbsUp,  color: '#EC4899', change: '+22.3%', up: true },
  { key: 'comments',label: '評論量',   value: '1.2萬',   icon: MessageCircle,color:'#06B6D4', change: '+15.8%', up: true },
  { key: 'shares',  label: '分享量',   value: '2.6萬',   icon: Share2,    color: '#F59E0B', change: '+19.8%', up: true },
  { key: 'fans',    label: '漲粉數',   value: '3,752',   icon: Users,     color: '#10B981', change: '+17.4%', up: true },
]

const REALTIME_DATA = [
  { label: '播放量', value: '28,542', sparkline: [20,25,22,30,28,35,32] },
  { label: '點贊量', value: '1,632', sparkline: [10,15,12,18,14,20,16] },
  { label: '評論量', value: '256',  sparkline: [5,8,6,12,9,14,11] },
  { label: '分享量', value: '512',  sparkline: [8,10,9,14,12,16,13] },
  { label: '漲粉數', value: '328',  sparkline: [4,6,5,8,7,10,8] },
]

// 趋势数据（7天）
const TREND_DATES = ['05-15','05-16','05-17','05-18','05-19','05-20','05-21']
const TREND_CURRENT = [8.2, 12.5, 19.8, 14.3, 17.6, 21.2, 12.8]
const TREND_LAST = [5.1, 7.8, 11.2, 9.0, 10.5, 13.1, 8.4]

// 内容类型
const CONTENT_TYPES = [
  { label: '數字人視頻', pct: 38.6, color: '#7C3AED' },
  { label: '知識分享',   pct: 24.3, color: '#06B6D4' },
  { label: 'vlog',       pct: 15.8, color: '#10B981' },
  { label: '教程攻略',   pct: 12.7, color: '#F59E0B' },
  { label: '其他',       pct: 8.6,  color: '#E5E7EB' },
]

// TOP 内容排行
const TOP_CONTENTS = [
  { rank: 1, title: 'AI如何改變我們的工作方式', date: '2024-05-18', views: '152,643' },
  { rank: 2, title: '5個高效時間管理技巧',     date: '2024-05-17', views: '98,765' },
  { rank: 3, title: '旅行vlog｜川西之旅',     date: '2024-05-16', views: '87,543' },
  { rank: 4, title: '职场沟通的5个关键点',     date: '2024-05-15', views: '76,432' },
  { rank: 5, title: '如何用AI提升创作效率',     date: '2024-05-14', views: '65,221' },
]

// 来源渠道
const CHANNELS = [
  { name: '推薦頁', current: 68.7, last: 56.7, pct: '53.4%', trend: '+21.3%' },
  { name: '關注頁', current: 28.6, last: 24.8, pct: '22.2%', trend: '+15.7%' },
  { name: '搜索',   current: 16.8, last: 15.5, pct: '13.1%', trend: '+8.9%' },
  { name: '其他',   current: 14.5, last: 15.0, pct: '11.3%', trend: '-3.2%' },
]

// 关键指标
const KEY_METRICS = [
  { label: '完播率', value: '48.7%', trend: '+6.3%', up: true, miniTrend: [42,44,45,47,46,48,49] },
  { label: '互動率', value: '6.2%',  trend: '+1.1%', up: true, miniTrend: [5.0,5.2,5.4,5.8,5.9,6.0,6.2] },
  { label: '平均播放時長', value: '42秒', trend: '+7.8%', up: true, miniTrend: [38,39,40,41,41,42,43] },
]

// 热力图数据（24h × 7d）
const HEATMAP_DAYS = ['周一','周二','周三','周四','周五','周六','周日']
function heatLevel(h:number,d:number):number {
  // 模拟：工作日晚间活跃，周末全天活跃
  const base = d>=5 ? 60 : ((h>=19 && h<=23) || (h>=7 && h<=9)) ? 70 : 20
  return Math.min(100, Math.max(0, base + Math.round((Math.sin(h/3+d)*30))))
}

export default function AnalyticsPage() {
  const [trendTab, setTrendTab] = useState<'views'|'likes'|'comments'|'shares'|'fans'>('views')
  const [topTab, setTopTab] = useState<'views'|'likes'|'fans'|'interact'>('views')
  const [userTab, setUserTab] = useState<'gender'|'age'|'active'>('gender')
  const [dateRange] = useState('2024-05-15 ~ 2024-05-21')
  const [compareMode, setCompareMode] = useState('上週期')

  // ========== SVG Helpers ==========
  function SparklinePath(data: number[], width=64, height=24): string {
    if (data.length < 2) return ''
    const max = Math.max(...data), min = Math.min(...data)
    const range = max - min || 1
    const stepX = width / (data.length - 1)
    return data.map((v,i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)} ${((max - v) / range * (height - 4) + 2).toFixed(1)}`).join(' ')
  }

  function TrendLine({ data, w, h, color }: { data: number[]; w: number; h: number; color: string }): ReactNode {
    if (!data.length) return <></>
    const max = Math.max(...data, ...TREND_LAST) * 1.1
    const min = 0
    const range = max - min || 1
    const stepX = w / (data.length - 1)
    const pts = data.map((v,i) => ({x:i*stepX, y:h-(v-min)/range*h}))
    const pathD = pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    // area fill
    const areaD = `${pathD} L${pts[pts.length-1].x} ${h} L${pts[0].x} ${h} Z`
    return <g><path d={areaD} fill={`${color}10`} /><path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></g>
  }

  function DonutChart({ segments, size=140, innerR=80 }: { segments: { pct: number; color: string }[]; size?: number; innerR?: number }): ReactNode {
    let acc = 0
    const cx=size/2, cy=size/2, r=(size-innerR)/2 + innerR/2, ir=innerR/2
    const paths = segments.map(s => {
      const start = acc
      acc += s.pct / 100
      const large = s.pct > 50 ? 1 : 0
      const x1=cx+r*Math.cos(Math.PI*2*start-Math.PI/2), y1=cy+r*Math.sin(Math.PI*2*start-Math.PI/2)
      const x2=cx+r*Math.cos(Math.PI*2*acc-Math.PI/2), y2=cy+r*Math.sin(Math.PI*2*acc-Math.PI/2)
      const ix1=cx+ir*Math.cos(Math.PI*2*acc-Math.PI/2), iy1=cy+ir*Math.sin(Math.PI*2*acc-Math.PI/2)
      return (
        <path key={s.color} d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix1} ${iy1} A${ir} ${ir} 0 ${large} 0 ${x1} ${y1}`} fill={s.color} />
      )
    })
    return <svg width={size} height={size}>{paths}</svg>
  }

  // Gender pie (simple)
  function GenderPie(): ReactNode {
    const r=54, cx=60, cy=60, malePct=62.3
    const maleEnd = malePct/100 * 360 - 90 // start from top (-90deg)
    const mx1=cx+r*Math.cos(-90*Math.PI/180), my1=cy+r*Math.sin(-90*Math.PI/180)
    const mx2=cx+r*Math.cos(maleEnd*Math.PI/180), my2=cy+r*Math.sin(maleEnd*Math.PI/180)
    const largeMale=malePct>50?1:0
    return (
      <svg width={120} height={120}>
        <circle cx={cx}cy={cy}r={r}fill="#E5E7EB"/>
        <path d={`M${mx1} ${my1} A${r} ${r} 0 ${largeMale} 1 ${mx2} ${my2} L${cx} ${cy} Z`} fill="#7C3AED"/>
        <path d={`M${mx2} ${my2} A${r} ${r} 0 ${largeMale?0:1} 1 ${mx1} ${my1} L${cx} ${cy} Z`} fill="#EC4899"/>
      </svg>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* ===== Header ===== */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Link to="/dashboard" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
              <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 數據分析
            </Link>
            <h1 className="text-xl font-bold text-gray-900">數據分析</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">全面了解您的內容表現，洞察數據驅動增長</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button className="flex items-center gap-1.5 text-[12.5px] text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
              <Calendar className="w-3.5 h-3.5" /> {dateRange}
            </button>
            <select value={compareMode} onChange={e=>setCompareMode(e.target.value)}
              className="text-[12.5px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none pr-7 bg-no-repeat bg-[right_6px_center]"
              style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3e%3cpath d='M1 3l4 4 4-4' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3e%3c/svg%3e")`}}>
              <option>上週期</option><option>上月同期</option><option>去年同期</option>
            </select>
            <button className="flex items-center gap-1.5 text-[12.5px] text-white bg-violet-600 rounded-lg px-3 py-1.5 hover:bg-violet-700">
              <Download className="w-3.5 h-3.5" /> 導出數據
            </button>
          </div>
        </div>

        {/* ===== KPI Cards Row ===== */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3.5">
          {KPI_CARDS.map(k => {
            const Icon = k.icon
            return (
              <div key={k.key} className="rounded-xl bg-white border border-gray-100 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">{k.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:k.color+'12'}}>
                    <Icon className="w-4 h-4" style={{color:k.color}} />
                  </div>
                </div>
                <div className="text-[20px] font-bold text-gray-900 leading-none">{k.value}</div>
                <div className={'flex items-center gap-1 text-[11.5px] font-medium ' + (k.up ? 'text-green-600' : 'text-red-500')}>
                  {k.up ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                  較上週期 {k.change}
                </div>
              </div>
            )
          })}
        </div>

        {/* ===== 数据趋势 + 实时数据 ===== */}
        <div className="grid grid-cols-12 gap-5">
          {/* 趋势图 */}
          <div className="col-span-8 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[14.5px] font-bold text-gray-800">數據趨勢</div>
              <div className="flex items-center gap-3">
                <select className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white"
                  onChange={e=>setTrendTab(e.target.value as any)}>
                  <option value="views">按天</option><option value="week">按週</option><option value="month">按月</option>
                </select>
                <select className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white"
                  onChange={e=>setTrendTab(e.target.value as any)}>
                  <option value="">折線圖</option>
                </select>
              </div>
            </div>
            {/* Tab 切换 */}
            <div className="flex items-center gap-4 text-[13px]">
              {[{k:'views',l:'播放量'},{k:'likes',l:'點贊量'},{k:'comments',l:'評論量'},{k:'shares',l:'分享量'},{k:'fans',l:'漲粉數'}].map(t =>
                <button key={t.k} onClick={()=>setTrendTab(t.k as any)}
                  className={'pb-1.5 border-b-2 transition-colors ' + (trendTab===t.k ? 'border-violet-500 text-violet-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700')}>
                  {t.l}
                </button>
              )}
            </div>
            {/* SVG Chart */}
            <div className="relative">
              <svg viewBox="0 0 650 220" className="w-full" preserveAspectRatio="none" style={{height:'200px'}}>
                {/* Grid lines */}
                {[0,0.25,0.5,0.75,1].map(p => (
                  <g key={p}>
                    <line x1="40" y1={20+p*170} x2="620" y2={20+p*170} stroke="#f3f4f6" strokeWidth="1"/>
                    <text x="35" y={24+p*170} textAnchor="end" fontSize="11" fill="#9ca3af">{Math.round((1-p)*20)}萬</text>
                  </g>
                ))}
                {/* X labels */}
                {TREND_DATES.map((d,i) => (
                  <text key={d} x={40+i*(580/(TREND_DATES.length-1))} y="210" textAnchor="middle" fontSize="11" fill="#9ca3af">{d}</text>
                ))}
                {/* Lines */}
                <g transform="translate(40,0)">
                  <TrendLine data={TREND_CURRENT} w={580} h={170} color="#7C3AED"/>
                  <TrendLine data={TREND_LAST}     w={580} h={170} color="#D1D5DB"/>
                </g>
              </svg>
              {/* Tooltip mock */}
              <div className="absolute left-[45%] top-[35%] bg-white shadow-lg border border-gray-100 rounded-lg p-2.5 text-[11px] space-y-1 pointer-events-none z-10">
                <div className="font-medium text-gray-800">05-18</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500"/> 當前週期 <span className="ml-auto font-semibold">128,479</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300"/> 上週期 <span className="ml-auto font-semibold">98,345</span></div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-5 text-[11.5px] text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-500 rounded"/> 當前週期</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gray-300 rounded"/> 上週期</span>
            </div>
          </div>

          {/* 实时数据 */}
          <div className="col-span-4 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[14.5px] font-bold text-gray-800">實時數據（今日）</div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400"><RefreshCw className="w-3 h-3"/> 更新于 14:30</div>
            </div>
            <div className="space-y-3">
              {REALTIME_DATA.map(r => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12.5px] text-gray-600">{r.label}</span>
                    <span className="text-[16px] font-bold text-gray-900">{r.value}</span>
                  </div>
                  <svg width="100%" height="26" preserveAspectRatio="none">
                    <path d={SparklinePath(r.sparkline, 280, 24)} fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== 第二行：内容类型 + TOP排行 + 用户画像 ===== */}
        <div className="grid grid-cols-12 gap-5">
          {/* 内容类型 */}
          <div className="col-span-4 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="text-[14.5px] font-bold text-gray-800">內容類型表現</div>
            <div className="flex justify-center">
              <DonutChart segments={CONTENT_TYPES.map(c=>({pct:c.pct,color:c.color}))} size={160} innerR={95}/>
              <div className="relative -mt-[115px] ml-[55px] text-center pointer-events-none">
                <div className="text-[11px] text-gray-400">播放量佔比</div>
                <div className="text-[18px] font-bold text-gray-900">128.6萬</div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {CONTENT_TYPES.map(c => (
                <div key={c.label} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{backgroundColor:c.color}}/>
                  <span className="text-gray-600 flex-1">{c.label}</span>
                  <span className="font-medium text-gray-800">{c.pct}%</span>
                </div>
              ))}
            </div>
            <button className="w-full text-center text-[12.5px] text-violet-600 hover:text-violet-700 font-medium pt-1">
              查看詳情 <ArrowRight className="w-3.5 h-3.5 inline"/>
            </button>
          </div>

          {/* TOP 排行榜 */}
          <div className="col-span-4 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="text-[14.5px] font-bold text-gray-800">TOP內容排行榜</div>
            {/* Tabs */}
            <div className="flex items-center gap-3 text-[12.5px]">
              {[{k:'views',l:'播放量'},{k:'likes',l:'點贊量'},{k:'fans',l:'漲粉數'},{k:'interact',l:'互動率'}].map(t =>
                <button key={t.k} onClick={() => setTopTab(t.k as any)}
                  className={'pb-1 border-b-2 transition-colors ' + (topTab===t.k?'border-violet-500 text-violet-600 font-medium':'border-transparent text-gray-500 hover:text-gray-700')}>{t.l}
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              {TOP_CONTENTS.map(item => (
                <div key={item.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer group">
                  <span className={
                    'w-5 h-5 rounded-sm flex items-center justify-center text-[11px] font-bold shrink-0 ' +
                    (item.rank<=3 ? 'bg-gradient-to-br from-red-400 to-orange-400 text-white' : 'bg-gray-100 text-gray-500')
                  }>{item.rank}</span>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-cyan-400 shrink-0 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-gray-800 truncate group-hover:text-violet-600">{item.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{item.date}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-semibold text-gray-800">{item.views}</div>
                    <div className="text-[10px] text-gray-400">{topTab==='views'?'觀看計數':'--'}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full text-center text-[12.5px] text-violet-600 hover:text-violet-700 font-medium">
              查看全部 <ArrowRight className="w-3.5 h-3.5 inline"/>
            </button>
          </div>

          {/* 用户画像 */}
          <div className="col-span-4 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="text-[14.5px] font-bold text-gray-800">用戶畫像</div>
            <div className="flex items-center gap-2 text-[12px]">
              {[{k:'gender',l:'性別分布'},{k:'age',l:'年齡分布'},{k:'active',l:'活躍分布'}].map(t =>
                <button key={t.k} onClick={()=>setUserTab(t.k as any)}
                  className={'px-3 py-1 rounded-full border transition-all ' +
                    (userTab===t.k ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>{t.l}
                </button>
              )}
            </div>
            {/* 性别分布（默认 tab） */}
            <div className="flex justify-center py-2">
              <GenderPie/>
            </div>
            <div className="flex justify-center gap-8 text-[12.5px]">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-500"/> 男性 <span className="font-semibold text-gray-800 ml-1">62.3%</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400"/> 女性 <span className="font-semibold text-gray-800 ml-1">37.7%</span></div>
            </div>
            {/* 活跃时间分布热力图 */}
            <div className="pt-2">
              <div className="text-[12px] text-gray-500 mb-2">活躍時間分布</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]" cellSpacing="1">
                  <thead>
                    <tr>
                      <th className="py-1 text-gray-400 font-normal"></th>
                      {['00:00','03:00','06:00','09:00','12:00','15:00','18:00','21:00'].map(h=>
                        <th key={h} className="py-1 text-gray-400 font-normal">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {HEATMAP_DAYS.map(d => (
                      <tr key={d}>
                        <td className="pr-2 text-right text-gray-400 whitespace-nowrap py-0.5">{d}</td>
                        {[0,3,6,9,12,15,18,21].map(h => {
                          const lvl = heatLevel(h, HEATMAP_DAYS.indexOf(d))
                          const alpha = Math.max(8, Math.min(90, lvl))
                          return <td key={h} className="w-5 h-5 rounded-sm" style={{backgroundColor:`rgba(124,58,237,${alpha/100})`}} />
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={9} className="pt-1 text-center text-gray-400">低</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 第三行：来源渠道 + 关键指标对比 ===== */}
        <div className="grid grid-cols-12 gap-5">
          {/* 来源渠道 */}
          <div className="col-span-7 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="text-[14.5px] font-bold text-gray-800">來源渠道分析</div>
            <div className="grid grid-cols-5 gap-3 text-[11.5px] text-gray-500 font-medium pb-2">
              <div>渠道</div><div className="text-right">播放量</div><div className="text-right">播放量</div><div className="text-right">佔比</div><div className="text-right">較上週期</div>
            </div>
            <div className="space-y-3">
              {CHANNELS.map(ch => (
                <div key={ch.name} className="space-y-1.5">
                  <div className="flex items-center gap-3 text-[13px]">
                    <div className="w-16 text-gray-700 font-medium">{ch.name}</div>
                    <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden relative">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 absolute left-0 top-0" style={{width:`${ch.current/Math.max(...CHANNELS.map(c=>c.current))*100}%`}}/>
                    </div>
                    <div className="w-14 text-right text-gray-800 font-semibold">{ch.current}萬</div>
                    <div className="w-12 text-right text-gray-500">{ch.pct}</div>
                    <div className={'w-16 text-right font-medium '+(ch.trend.startsWith('+')?'text-green-600':'text-red-500')}>
                      {ch.trend.startsWith('+')?<TrendingUp className="w-3 h-3 inline mr-0.5"/>:<TrendingDown className="w-3 h-3 inline mr-0.5"/>}{ch.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 关键指标对比 */}
          <div className="col-span-5 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="text-[14.5px] font-bold text-gray-800">關鍵指標對比</div>
            <div className="space-y-5">
              {KEY_METRICS.map(m => (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-600">{m.label}</span>
                    <span className="text-[18px] font-bold text-gray-900">{m.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-5">
                      <svg width="100%" height="20" preserveAspectRatio="none">
                        <path d={SparklinePath(m.miniTrend, 240, 18)} fill="none" stroke={m.up?"#7C3AED":"#EC4899"} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className={'text-[11.5px] font-medium flex items-center gap-0.5 '+(m.up?'text-green-600':'text-red-500')}>
                      {m.up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}較上週期 {m.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
