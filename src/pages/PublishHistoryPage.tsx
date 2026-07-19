import { useState, useCallback } from 'react'
import {
  Upload, CircleCheck, Calendar, RefreshCw, Delete, Check, X,
  Image, Clock, ChevronDown, CheckSquare,
} from 'lucide-react'

// ---------- types ----------
interface PublishItem {
  platform: string
  account_name: string
  status: 'success' | 'fail' | 'running' | 'pending' | 'cancelled'
}

interface PublishBatch {
  id: number | string
  title: string
  cover_url?: string
  items: PublishItem[]
  status: 'success' | 'partial' | 'failed' | 'running' | 'pending' | 'cancelled'
  created_at: string
}

// ---------- mock data ----------
const MOCK_BATCHES: PublishBatch[] = [
  {
    id: 1,
    title: '2025春季新品上市推廣視頻',
    items: [
      { platform: 'douyin', account_name: '抖音官方號', status: 'success' },
      { platform: 'kuaishou', account_name: '快手達人號', status: 'success' },
    ],
    status: 'success',
    created_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 2,
    title: 'AI智能體使用教程_第3集',
    items: [
      { platform: 'douyin', account_name: '抖音官方號', status: 'success' },
      { platform: 'xiaohongshu', account_name: '小紅書主號', status: 'fail' },
      { platform: 'bilibili', account_name: 'B站個人號', status: 'success' },
    ],
    status: 'partial',
    created_at: '2025-01-14T16:20:00Z',
  },
  {
    id: 3,
    title: '小紅書穿搭合集_春季系列',
    items: [
      { platform: 'xiaohongshu', account_name: '小紅書主號', status: 'success' },
    ],
    status: 'success',
    created_at: '2025-01-14T14:00:00Z',
  },
  {
    id: 4,
    title: '知識付費課程宣傳片',
    items: [
      { platform: 'douyin', account_name: '抖音官方號', status: 'failed' },
    ],
    status: 'failed',
    created_at: '2025-01-13T09:00:00Z',
  },
  {
    id: 5,
    title: '抖音圖文種草_美妝推薦',
    items: [
      { platform: 'douyin', account_name: '抖音官方號', status: 'success' },
      { platform: 'kuaishou', account_name: '快手達人號', status: 'success' },
    ],
    status: 'success',
    created_at: '2025-01-13T11:30:00Z',
  },
  {
    id: 6,
    title: '微博熱點營銷圖集',
    items: [
      { platform: 'weibo', account_name: '微博個人號', status: 'success' },
    ],
    status: 'success',
    created_at: '2025-01-12T15:00:00Z',
  },
]

// ---------- helpers ----------
function statusLabel(status: string): string {
  return (
    {
      pending: '等待中',
      running: '發布中',
      success: '全部成功',
      partial: '部分失敗',
      failed: '全部失敗',
      cancelled: '已取消',
    }[status] || status
  )
}

function statusClass(status: string): string {
  switch (status) {
    case 'success':
    case 'partial':
      return 'bg-emerald-50 text-emerald-600'
    case 'failed':
      return 'bg-red-50 text-red-500'
    case 'running':
      return 'bg-blue-50 text-blue-500'
    default:
      return 'bg-gray-50 text-gray-400'
  }
}

function formatCardTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 86400) {
    if (diff < 60) return '剛剛'
    if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
    return `${Math.floor(diff / 3600)} 小時前`
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function computeChannelsSummary(items: PublishItem[]) {
  const groups: Record<string, { platform: string; name: string; count: number }> = {}
  for (const it of items) {
    if (!groups[it.platform]) {
      groups[it.platform] = { platform: it.platform, name: it.platform, count: 0 }
    }
    groups[it.platform].count++
  }
  return Object.values(groups)
}

// ---------- component ----------
export default function PublishHistoryPage() {
  const [batches] = useState<PublishBatch[]>(MOCK_BATCHES)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selection, setSelection] = useState<Set<number | string>>(new Set())

  // stats
  const totalCount = batches.length
  const successCount = batches.filter((b) => b.status === 'success').length
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0
  const monthlyCount = batches.filter((b) => {
    const d = new Date(b.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const isAllSelected = batches.length > 0 && selection.size >= batches.length
  const isIndeterminate = selection.size > 0 && selection.size < batches.length

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => !prev)
    setSelection(new Set())
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) setSelection(new Set())
    else setSelection(new Set(batches.map((b) => b.id)))
  }, [isAllSelected, batches])

  const toggleSelection = useCallback((id: number | string) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
  }, [])

  const handleDelete = useCallback((batch: PublishBatch) => {
    if (window.confirm(`確定刪除發布記錄「${batch.title || '無標題'}」嗎？此操作不可恢復。`)) {
      // TODO: call API
    }
  }, [])

  const handleBatchDelete = useCallback(() => {
    if (selection.size === 0) return
    if (window.confirm(`確認刪除選中的 ${selection.size} 條發布記錄？此操作不可恢復。`)) {
      // TODO: call API
      setSelection(new Set())
    }
  }, [selection])

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">發布歷史</h1>
        <p className="text-sm text-gray-500 mt-1">回顧所有發布記錄</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-violet-100 rounded-xl p-5 hover:border-violet-300 hover:shadow-md hover:shadow-violet-50 transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mr-4">
              <Upload className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                {totalCount}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">總發布數</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mr-4">
              <CircleCheck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {successRate}%
              </div>
              <div className="text-sm text-gray-500 mt-0.5">成功率</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-cyan-100 rounded-xl p-5 hover:border-cyan-300 hover:shadow-md hover:shadow-cyan-50 transition-all">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center mr-4">
              <Calendar className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                {monthlyCount}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">本月發布</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Time */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 text-gray-600 appearance-none cursor-pointer"
            >
              <option value="all">全部時間</option>
              <option value="today">今天</option>
              <option value="7days">最近7天</option>
              <option value="30days">最近30天</option>
            </select>
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 text-gray-600 appearance-none cursor-pointer"
            >
              <option value="all">全部類型</option>
              <option value="video">視頻</option>
              <option value="image">圖集</option>
            </select>
            {/* Platform */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 text-gray-600 appearance-none cursor-pointer"
            >
              <option value="all">全部平台</option>
              <option value="douyin">抖音</option>
              <option value="xiaohongshu">小紅書</option>
              <option value="kuaishou">快手</option>
              <option value="weibo">微博</option>
              <option value="bilibili">B站</option>
            </select>
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 text-gray-600 appearance-none cursor-pointer"
            >
              <option value="all">全部狀態</option>
              <option value="success">全部成功</option>
              <option value="partial">部分失敗</option>
              <option value="failed">全部失敗</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectMode}
              disabled={batches.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckSquare className="w-4 h-4" />
              <span>多選</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Toolbar */}
      {selectMode && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl shadow-sm shadow-violet-100">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <div
              onClick={toggleSelectAll}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                isAllSelected
                  ? 'bg-violet-500 border-violet-500'
                  : isIndeterminate
                  ? 'bg-violet-300 border-violet-300'
                  : 'border-gray-300 hover:border-violet-400'
              }`}
            >
              {(isAllSelected || isIndeterminate) && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span>全選</span>
          </label>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-full text-sm text-violet-700">
            <Check className="w-3 h-3" />
            <span>
              已選 <strong className="font-semibold">{selection.size}</strong> / {batches.length}
            </span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleBatchDelete}
            disabled={selection.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>批量刪除{selection.size > 0 ? ` (${selection.size})` : ''}</span>
          </button>
          <button
            onClick={toggleSelectMode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-all"
          >
            <X className="w-4 h-4" />
            <span>退出多選</span>
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {batches.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock className="w-10 h-10 opacity-30 mb-3" />
          <p className="text-sm text-gray-500">暫無發布記錄</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {batches.map((batch) => {
            const isSelected = selection.has(batch.id)
            return (
              <div
                key={batch.id}
                onClick={() => {
                  if (selectMode) toggleSelection(batch.id)
                }}
                className={`group bg-white border rounded-xl overflow-hidden flex flex-col transition-all ${
                  selectMode ? 'cursor-pointer' : 'cursor-pointer hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5'
                } ${
                  isSelected
                    ? 'border-violet-400 bg-gradient-to-br from-violet-50/80 to-purple-50/80 shadow-lg shadow-violet-100 ring-2 ring-violet-400 -translate-y-0.5'
                    : 'border-gray-100'
                }`}
              >
                {/* Cover */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
                  {batch.cover_url ? (
                    <img src={batch.cover_url} alt={batch.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Select checkbox */}
                  {selectMode && (
                    <div
                      className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                        isSelected
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-transparent shadow-lg shadow-violet-300 scale-110'
                          : 'bg-black/40 border-white/50 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  )}

                  {/* Delete button (non-select mode) */}
                  {!selectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(batch)
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all z-10"
                    >
                      <Delete className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 py-3 flex-1 flex flex-col gap-2.5">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {batch.title || '無標題'}
                  </h3>

                  {/* Channels */}
                  {batch.items.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {computeChannelsSummary(batch.items).map((ch) => (
                        <span
                          key={ch.platform}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500"
                        >
                          {ch.name} × {ch.count}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="text-gray-400">{formatCardTime(batch.created_at)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${statusClass(batch.status)}`}>
                      {statusLabel(batch.status)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {batches.length > 0 && (
        <div className="flex justify-end py-4 px-5 bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>共 {batches.length} 條</span>
            <button className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
              上一頁
            </button>
            <button className="px-2.5 py-1.5 text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg shadow-sm">
              1
            </button>
            <button className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
