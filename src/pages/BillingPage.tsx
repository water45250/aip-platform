import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Download, Calendar, TrendingUp, TrendingDown,
  Receipt, CreditCard, FileText, Wallet, Ticket,
  Crown, ArrowRight, Search, Filter,
  CheckCircle2,
  Zap,
} from 'lucide-react'

// ============ Tab 定義 ============
const TABS = [
  { key: 'orders', label: '訂單記錄' },
  { key: 'bills',  label: '帳單記錄' },
  { key: 'invoice', label: '發票管理' },
  { key: 'payment', label: '支付方式' },
  { key: 'coupon',  label: '優惠券' },
] as const
type TabKey = typeof TABS[number]['key']

// ============ KPI Cards ============
const KPIS = [
  { icon: Receipt,   label: '累計消費', value: '¥9,820.00', change: '+18.6%', up: true, color: '#7C3AED', sub: '較上月' },
  { icon: CreditCard,label: '本月消費', value: '¥1,680.00', change: '+6.3%',  up: true, color: '#3B82F6', sub: '較上月' },
  { icon: FileText,  label: '未支付訂單', value: '2',          pending: '待支付 ¥299.00', color: '#10B981' },
  { icon: Wallet,    label: '可用餘額', value: '¥298.50',     action: '立即充值', color: '#F59E0B' },
  { icon: Ticket,   label: '代金券',   value: '3',            action: '查看詳情', suffix: '張可用', color: '#EC4899' },
]

// ============ 消費趨勢數據 ============
const TREND_DATES = ['2024-11','2024-12','2025-01','2025-02','2025-03','2025-04','2025-05']
const TREND_VALUES = [1020,1280,1550,1420,1890,1580,1680]

// ============ 消費構成（本月） ============
const COST_BREAKDOWN = [
  { label: '視頻生成', pct: 45, amt: '¥756.00', color: '#7C3AED' },
  { label: '數字人',   pct: 20, amt: '¥336.00', color: '#06B6D4' },
  { label: '聲音克隆', pct: 15, amt: '¥252.00', color: '#EC4899' },
  { label: '智能剪輯', pct: 10, amt: '¥168.00', color: '#F59E0B' },
  { label: '其他服務', pct: 10, amt: '¥168.00', color: '#D1D5DB' },
]

// ============ 訂單記錄 ============
interface OrderRow {
  id: string
  product: string
  type: string
  amount: string
  discount?: string
  paid: string
  status: 'paid' | 'pending' | 'cancelled' | 'refunded'
  time: string
}

const ORDERS: OrderRow[] = [
  { id: '202505210001', product: 'AI 積分包（5000 積分）', type: '積分包', amount: '¥299.00', paid: '¥299.00', status: 'paid', time: '2025-05-21 14:30:22' },
  { id: '202505200045', product: '數字人視頻生成（10分鐘）', type: '服務', amount: '¥168.00', discount: '-¥20.00', paid: '¥148.00', status: 'paid', time: '2025-05-20 10:15:33' },
  { id: '202505180032', product: '尊享會員 年付', type: '套餐', amount: '¥998.00', discount: '-¥100.00', paid: '¥898.00', status: 'paid', time: '2025-05-18 09:22:11' },
  { id: '202505160023', product: '智能剪輯（高級版）', type: '服務', amount: '¥59.00', paid: '¥59.00', status: 'paid', time: '2025-05-16 18:45:06' },
  { id: '202505150018', product: '聲音克隆（高級音色）', type: '服務', amount: '¥99.00', paid: '¥99.00', status: 'paid', time: '2025-05-15 11:08:42' },
  { id: '202505130015', product: '高清導出（4K）', type: '服務', amount: '¥39.00', paid: '¥39.00', status: 'paid', time: '2025-05-13 14:55:19' },
  { id: '202505120009', product: 'AI 積分包（10000 積分）', type: '積分包', amount: '¥499.00', discount: '-¥50.00', paid: '¥449.00', status: 'pending', time: '2025-05-12 20:30:44' },
  { id: '202505100007', product: '數字人視頻生成（20分鐘）', type: '服務', amount: '¥299.00', paid: '¥299.00', status: 'cancelled', time: '2025-05-10 18:20:33' },
]

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('orders')
  const [orderFilter, setOrderFilter] = useState('全部訂單')
  const [statusFilter, setStatusFilter] = useState('全部狀態')

  // SVG Helpers
  function TrendLine({ data, w=520, h=160 }: { data: number[]; w: number; h: number }): ReactNode {
    if (!data.length) return null
    const max = Math.max(...data) * 1.15, min = 0
    const range = max - min || 1
    const stepX = w / (data.length - 1)
    const pts = data.map((v,i) => ({x:i*stepX, y:h-(v-min)/range*h}))
    const pathD = pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const areaD = `${pathD} L${pts[pts.length-1].x} ${h} L${pts[0].x} ${h} Z`
    return (
      <svg viewBox={`0 0 ${w+40} ${h+30}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25"/><stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/></linearGradient>
        </defs>
        <g transform="translate(24,8)">
          {/* grid */}
          {[0,0.25,0.5,0.75,1].map(p => (
            <g key={p}><line x1={0} y1={p*h} x2={w} y2={p*h} stroke="#f3f4f6" strokeWidth="1"/>
              <text x={-6} y={p*h+3.5} textAnchor="end" fontSize="11" fill="#9ca3af">{Math.round((1-p)*max)}</text></g>
          ))}
          {/* area + line */}
          <path d={areaD} fill="url(#trendGrad)"/><path d={pathD} fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* dots */}
          {pts.map((p,i) => (<circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#7C3AED" strokeWidth="2"/>))}
          {/* labels */}
          {TREND_DATES.map((d,i) => (<text key={d} x={i*stepX} y={h+16} textAnchor="middle" fontSize="11" fill="#9ca3af">{d}</text>))}
        </g>
      </svg>
    )
  }

  function CostDonut({ segments, size=150, innerR=90 }: { segments: typeof COST_BREAKDOWN; size?: number; innerR?: number }): ReactNode {
    let acc = -90 // start from top
    const cx=size/2, cy=size/2, r=(size-innerR)/2+innerR/2, ir=innerR/2
    return (
      <svg width={size} height={size}>
        {segments.map(s => {
          const sweep = s.pct/100 * 360
          const end = acc + sweep
          const rad1=acc*Math.PI/180, rad2=end*Math.PI/180
          const largeArc=sweep>180?1:0
          const mx1=cx+r*Math.cos(rad1), my1=cy+r*Math.sin(rad1)
          const mx2=cx+r*Math.cos(rad2), my2=cy+r*Math.sin(rad2)
          const ix1=cx+ir*Math.cos(rad2), iy1=cy+ir*Math.sin(rad2)
          const path = `M${mx1} ${my1} A${r} ${r} 0 ${largeArc} 1 ${mx2} ${my2} L${ix1} ${iy1} A${ir} ${ir} 0 ${largeArc?0:1} 0 ${mx1} ${my1}`
          acc += sweep
          return <path key={s.label} d={path} fill={s.color}/>
        })}
      </svg>
    )
  }

  function statusBadge(status: OrderRow['status']): ReactNode {
    const map: Record<string, { text: string; cls: string }> = {
      paid:      { text: '已支付', cls: 'bg-green-50 text-green-700 border-green-200' },
      pending:   { text: '待支付', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      cancelled: { text: '已取消', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
      refunded:  { text: '已退款', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    }
    const m = map[status]!
    return <span className={'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ' + m.cls}>{m.text}</span>
  }

  return (
    <div className="p-6">
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* ===== Header ===== */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Link to="/dashboard" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
                <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 訂單計費
              </Link>
              <h1 className="text-xl font-bold text-gray-900">訂單計費</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">管理您的訂單、賬單、發票和使用情況</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="flex items-center gap-1.5 text-[12.5px] text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                <Calendar className="w-3.5 h-3.5" /> 全部時間
              </button>
              <button className="flex items-center gap-1.5 text-[12.5px] text-white bg-violet-600 rounded-lg px-3 py-1.5 hover:bg-violet-700">
                <Download className="w-3.5 h-3.5" /> 導出記錄
              </button>
            </div>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex items-center gap-1 border-b border-gray-100">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ' +
                (activeTab === tab.key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== KPI Cards Row ===== */}
        <div className="grid grid-cols-5 gap-4">
          {KPIS.map(kpi => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="rounded-xl bg-white border border-gray-100 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{backgroundColor:kpi.color+'12'}}>
                    <Icon className="w-4.5 h-4.5" style={{color:kpi.color}}/>
                  </div>
                  <div className="text-[12.5px] text-gray-500">{kpi.label}</div>
                  {kpi.action && (
                    <button className="ml-auto text-[11.5px] text-violet-600 border border-violet-200 rounded-lg px-2.5 py-1 hover:bg-violet-50">{kpi.action}</button>
                  )}
                </div>
                <div className="text-[20px] font-bold text-gray-900 leading-none">{kpi.value}
                  {kpi.suffix && <span className="ml-1 text-sm font-normal text-gray-400">{kpi.suffix}</span>}
                </div>
                <div className="flex items-center gap-2 text-[11.5px]">
                  {kpi.pending && <span className="text-gray-400">{kpi.pending}</span>}
                  {kpi.change ? (
                    <>
                      <span className="text-gray-400">{kpi.sub}</span>
                      <span className={'font-medium flex items-center gap-0.5 '+(kpi.up?'text-green-600':'text-red-500')}>
                        {kpi.up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}{kpi.change}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* ===== Main Content Grid：三列布局（趨勢|構成|套餐），訂單表跨左中兩列 ===== */}
        <div className="grid grid-cols-12 gap-5">
          {/* 左列：消費趨勢 — col-6 */}
          <div className="col-span-6 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14.5px] font-bold text-gray-800">消費趨勢</h3>
              <select className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none pr-7 bg-no-repeat bg-[right_6px_center]"
                style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3e%3cpath d='M1 3l4 4 4-4' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3e%3c/svg%3e")`}}>
                <option>按月統計</option><option>按週統計</option>
              </select>
            </div>
            <TrendLine data={TREND_VALUES} w={480} h={180} />
          </div>

          {/* 中列：消費構成 — col-3 */}
          <div className="col-span-3 rounded-xl bg-white border border-gray-100 p-5 space-y-3">
            <h3 className="text-[13.5px] font-bold text-gray-800">消費構成（本月）</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <CostDonut segments={COST_BREAKDOWN}/>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] text-gray-400">總計</div>
                  <div className="text-[15px] font-bold text-gray-900 leading-none">¥1,680.00</div>
                </div>
              </div>
              <div className="space-y-1.5 w-full">
                {COST_BREAKDOWN.map(c => (
                  <div key={c.label} className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:c.color}}/>
                    <span className="text-gray-600 truncate">{c.label}</span>
                    <span className="font-medium text-gray-800 ml-auto">{c.pct}%</span>
                    <span className="text-gray-400 ml-1">{c.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右列：當前套餐 + 本月使用 + 快速操作 — col-3 堆疊 */}
          <div className="col-span-3 space-y-5">
            {/* 當前套餐 */}
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-violet-500"/>
                  <div>
                    <div className="text-[12.5px] font-bold text-gray-800">尊享會員（年付）</div>
                    <div className="text-[10.5px] text-gray-500">有效期至 2025-12-31</div>
                  </div>
                </div>
                <button className="text-[10.5px] font-medium text-white bg-violet-600 rounded-lg px-2.5 py-1 hover:bg-violet-700">續費升級</button>
              </div>
              <div className="space-y-1 pt-0.5">
                {['每月 5,000 積分','無限次創作','高清數字人導出','專屬客服授權','優先客服支持'].map(f=>(
                  <div key={f} className="flex items-center gap-1.5 text-[10.5px] text-gray-600">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0"/>{f}
                  </div>
                ))}
              </div>
              <button className="text-[10.5px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5 mt-0.5">
                查看套餐詳情 <ArrowRight className="w-3 h-3"/>
              </button>
            </div>

            {/* 本月使用情況 */}
            <div className="rounded-xl bg-white border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-gray-800">本月使用情況</h3>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">(期限：05.01 ~ 05.31)</span>
              </div>
              {[
                { label: 'AI 積分', used: 2880, total: 5000, unit: '', pct: 57 },
                { label: '數字人時長', used: 220, total: 600, unit: '分鐘', pct: 37 },
                { label: '高清導出', used: 38, total: 100, unit: '次', pct: 38 },
                { label: '雲存儲空間', used: 12.6, total: 50, unit: 'GB', pct: 25 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-600">{item.label}</span>
                    <span className="text-[10.5px] text-gray-400 whitespace-nowrap">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{width:`${item.pct}%`}}/>
                  </div>
                </div>
              ))}
              <button className="text-[10.5px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5 mt-0.5">
                查看完整明細 <ArrowRight className="w-3 h-3"/>
              </button>
            </div>

            {/* 快速操作 */}
            <div className="rounded-xl bg-white border border-gray-100 p-4">
              <h3 className="text-[12px] font-bold text-gray-800 mb-2.5">快速操作</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Zap, label: '立即充值', color: 'from-violet-500 to-purple-500' },
                  { icon: FileText, label: '開具發票', color: 'from-cyan-500 to-blue-500' },
                  { icon: Ticket, label: '領取優惠券', color: 'from-pink-500 to-rose-500' },
                ].map(act => {
                  const Icon = act.icon
                  return (
                    <button key={act.label} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group">
                      <div className={'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center ' + act.color}>
                        <Icon className="w-4 h-4 text-white"/>
                      </div>
                      <span className="text-[10.5px] font-medium text-violet-600 group-hover:text-violet-700">{act.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ===== 訂單記錄 Table — 跨左中兩列(col-9)，與右欄等高對齊 ===== */}
          <div className="col-span-9 rounded-xl bg-white border border-gray-100 p-5 space-y-4">
            <h3 className="text-[14.5px] font-bold text-gray-800">訂單記錄</h3>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)}
              className="text-[12.5px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none pr-7 bg-no-repeat bg-[right_6px_center]"
              style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3e%3cpath d='M1 3l4 4 4-4' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3e%3c/svg%3e")`}}>
              <option>全部訂單</option><option>積分包</option><option>服務</option><option>套餐</option>
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              className="text-[12.5px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none pr-7 bg-no-repeat bg-[right_6px_center]"
              style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3e%3cpath d='M1 3l4 4 4-4' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3e%3c/svg%3e")`}}>
              <option>全部狀態</option><option>已支付</option><option>待支付</option><option>已取消</option>
            </select>
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <input type="date" defaultValue="2025-05-01" className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px]" />
              <span>~</span>
              <input type="date" defaultValue="2025-05-31" className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px]" />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
              <input placeholder="搜索訂單號 / 商品名稱"
                className="w-full pl-9 pr-3 py-1.5 text-[12.5px] border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400"/>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['訂單號','商品名稱','訂單類型','金額','優惠','實付金額','狀態','創建時間','操作'].map(h =>
                    <th key={h} className="py-2.5 px-3 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ORDERS.map(row => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3 text-gray-500 font-mono">{row.id}</td>
                    <td className="py-3 px-3 text-gray-800 font-medium">{row.product}</td>
                    <td className="py-3 px-3 text-gray-500">{row.type}</td>
                    <td className="py-3 px-3 text-gray-800">{row.amount}</td>
                    <td className="py-3 px-3 text-red-500">{row.discount ?? '-'}</td>
                    <td className="py-3 px-3 text-gray-800 font-medium">{row.paid}</td>
                    <td className="py-3 px-3">{statusBadge(row.status)}</td>
                    <td className="py-3 px-3 text-gray-400">{row.time}</td>
                    <td className="py-3 px-3">
                      <button className="text-violet-600 hover:text-violet-700 font-medium whitespace-nowrap">查看詳情</button>
                      {row.status==='pending'&&<button className="ml-2 text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap">去支付</button>}
                      {row.status==='pending'&&<button className="ml-2 text-gray-400 hover:text-gray-600 font-medium whitespace-nowrap">取消</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[12px] text-gray-400">共 23 條</div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40">&lt;</button>
              {[1,2,3].map(p=>(
                <button key={p} className={'w-8 h-8 rounded-lg flex items-center justify-center text-[12.5px] font-medium transition-all '+(p===1?'bg-violet-50 border border-violet-200 text-violet-600':'text-gray-500 hover:bg-gray-50')}>{p}</button>
              ))}
              <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">&gt;</button>
              <select className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 ml-1 bg-white">
                <option>10 條/頁</option><option>20 條/頁</option>
              </select>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
