import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  ChevronLeft, Camera, User, Lock, Shield, Eye, EyeOff,
  Monitor, Clock, Crown, ArrowRight, X,
  TrendingUp, FileVideo, Play,
  Users as UsersIcon, Laptop, MapPin, Globe,
  Settings, Bell, Loader2, KeyRound, Fingerprint, Smartphone as PhoneIcon,
  AlertTriangle, Check, RefreshCw,
} from 'lucide-react'
import { securityApi, formatRelativeTime, formatDateTime } from '../lib/api'
import type { Device, LoginRecord, TwoFactorStatus } from '../lib/api'

// ============ Tab 定義 ============
const TABS = [
  { key: 'profile', label: '帳號資訊', icon: User },
  { key: 'prefs',   label: '我的偏好',  icon: Settings },
  { key: 'notify',  label: '通知設置',  icon: Bell },
] as const
type TabKey = typeof TABS[number]['key']

// ============ 設備圖標 ============
function deviceIcon(type: string) {
  switch (type) {
    case 'phone': return <PhoneIcon className="w-4 h-4" />
    case 'tablet': return <PhoneIcon className="w-4 h-4 rotate-90" />
    default: return <Laptop className="w-4 h-4" />
  }
}

// ============ 彈窗容器 ============
function Modal({ children, onClose, maxWidth = 'max-w-lg' }: { children: ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 overflow-hidden`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// ============ 加載態 ============
function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />
}

// ============ 主組件 ============
export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  // Profile state
  const [bio, setBio] = useState('用AI創造價值，分享知識與靈感 ✨')

  // 兩步驗證狀態
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus>({
    enabled: false, method: 'app', backupCodesRemaining: 0, lastChanged: '',
  })

  // ===== 對話框狀態 =====
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [twoFactorDialog, setTwoFactorDialog] = useState(false)
  const [deviceDialog, setDeviceDialog] = useState(false)
  const [loginHistoryDialog, setLoginHistoryDialog] = useState(false)
  const [securityScoreDialog, setSecurityScoreDialog] = useState(false)

  // ===== 密碼表單 =====
  const [passwordForm, setPasswordForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // ===== 數據載入 =====
  const [devices, setDevices] = useState<Device[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [removingDeviceId, setRemovingDeviceId] = useState<number | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [securityScore, setSecurityScore] = useState<{ score: number; maxScore: number; checks: { name: string; passed: boolean; detail: string }[] } | null>(null)
  const [scoreLoading, setScoreLoading] = useState(false)

  // ===== API 調用 =====
  const loadTwoFactor = useCallback(async () => {
    try {
      const res = await securityApi.getTwoFactorStatus()
      if (res.code === 200) setTwoFactor(res.data)
    } catch { /* 靜默處理 */ }
  }, [])

  const loadDevices = useCallback(async () => {
    setDevicesLoading(true)
    try {
      const res = await securityApi.getDevices()
      if (res.code === 200) setDevices(res.data)
    } catch {
      setDevices([])
    } finally {
      setDevicesLoading(false)
    }
  }, [])

  const loadLoginHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true)
    try {
      const res = await securityApi.getLoginHistory(page)
      if (res.code === 200) {
        setLoginHistory(res.data.items)
        setHistoryTotal(res.data.total)
        setHistoryPage(page)
      }
    } catch {
      setLoginHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const loadSecurityScore = useCallback(async () => {
    setScoreLoading(true)
    try {
      const res = await securityApi.getSecurityScore()
      if (res.code === 200) setSecurityScore(res.data)
    } catch {
      setSecurityScore(null)
    } finally {
      setScoreLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTwoFactor()
  }, [loadTwoFactor])

  // 打開對話框時加載數據
  useEffect(() => { if (deviceDialog) loadDevices() }, [deviceDialog, loadDevices])
  useEffect(() => { if (loginHistoryDialog) loadLoginHistory(1) }, [loginHistoryDialog, loadLoginHistory])
  useEffect(() => { if (securityScoreDialog) loadSecurityScore() }, [securityScoreDialog, loadSecurityScore])

  // ===== 交互處理 =====
  const toggleShowPassword = (field: string) => setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))

  const handlePasswordSubmit = async () => {
    setPasswordError('')
    if (!passwordForm.current || !passwordForm.newPwd || !passwordForm.confirm) {
      setPasswordError('請填寫所有欄位')
      return
    }
    if (passwordForm.newPwd.length < 8) {
      setPasswordError('新密碼長度至少為 8 個字符')
      return
    }
    if (passwordForm.newPwd !== passwordForm.confirm) {
      setPasswordError('兩次輸入的新密碼不一致')
      return
    }
    setPasswordSubmitting(true)
    try {
      const res = await securityApi.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPwd,
        confirmPassword: passwordForm.confirm,
      })
      if (res.code === 200) {
        setPasswordDialog(false)
        setPasswordForm({ current: '', newPwd: '', confirm: '' })
        alert(res.data.message || '密碼修改成功！')
      } else {
        setPasswordError(res.msg || '密碼修改失敗')
      }
    } catch (err) {
      setPasswordError('網路錯誤，請稍後重試')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const handleToggleTwoFactor = async () => {
    if (twoFactor.enabled) {
      setTwoFactorDialog(true)
    } else {
      setTwoFactorDialog(true)
    }
  }

  const confirmToggleTwoFactor = async (enable: boolean) => {
    try {
      const res = await securityApi.toggleTwoFactor(enable)
      if (res.code === 200) {
        setTwoFactor(prev => ({ ...prev, enabled: enable, lastChanged: new Date().toISOString().slice(0, 10) }))
        if (enable) alert('兩步驗證已開啟')
        else alert('兩步驗證已關閉')
      }
    } catch {
      alert('操作失敗，請稍後重試')
    } finally {
      setTwoFactorDialog(false)
    }
  }

  const handleRemoveDevice = async (deviceId: number) => {
    if (!confirm('確定要移除該設備嗎？移除後該設備將無法直接登錄。')) return
    setRemovingDeviceId(deviceId)
    try {
      const res = await securityApi.removeDevice(deviceId)
      if (res.code === 200) {
        setDevices(prev => prev.filter(d => d.id !== deviceId))
        alert('設備已移除')
      }
    } catch {
      alert('移除失敗，請稍後重試')
    } finally {
      setRemovingDeviceId(null)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-[1280px] mx-auto space-y-5">
        {/* ===== Header ===== */}
        <div>
          <RouterLink to="/dashboard" className="text-[12px] text-gray-400 hover:text-violet-600 flex items-center gap-1 mb-1">
            <ChevronLeft className="w-3.5 h-3.5" /> 創作中心 / 帳號中心
          </RouterLink>
          <h1 className="text-xl font-bold text-gray-900">帳號中心</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">管理您的帳號信息、偏好設置與安全配置</p>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex items-center gap-1 border-b border-gray-100">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ' +
                (activeTab === tab.key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== Tab Content ===== */}
        {activeTab === 'profile' && (
          <>
            <div className="grid grid-cols-12 gap-5">
              {/* 左：個人資料 */}
              <div className="col-span-7 rounded-xl bg-white border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-800">個人資料</h3>
                  <button className="text-[12.5px] text-violet-600 border border-violet-200 rounded-lg px-3.5 py-1.5 hover:bg-violet-50 font-medium">編輯資料</button>
                </div>

                <div className="flex items-start gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-200 to-cyan-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                      <div className="w-full h-full bg-cover bg-center"
                        style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Crect fill='%23ddd6fe'/%3E%3Ccircle cx='56' cy='42' r='20' fill='%23a78bfa'/%3E%3Cellipse cx='56' cy='90' rx='30' ry='24' fill='%23a78bfa'/%3E%3C/svg%3E")`}}
                      />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg hover:bg-violet-700 transition-all opacity-0 group-hover:opacity-100">
                      <Camera className="w-4 h-4"/>
                    </button>
                  </div>

                  <div className="flex-1 space-y-4 min-w-0">
                    <div className="flex items-center justify-between">
                      <div><span className="text-[12px] text-gray-400 mr-2">用戶名</span>
                        <span className="text-[14px] font-semibold text-gray-800">創作者888</span>
                        <span className="ml-2 text-[11px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">尊享會員</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-[12px] text-gray-400 mr-2">郵箱</span>
                        <span className="text-[14px] text-gray-700">creator888@aip.com</span></div>
                      <span className="text-[12px] text-green-600 font-medium">已驗證</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-[12px] text-gray-400 mr-2">手機號</span>
                        <span className="text-[14px] text-gray-700">138 **** 8888</span></div>
                      <span className="text-[12px] text-green-600 font-medium">已驗證</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-[12px] text-gray-400 mr-2">暱稱</span>
                        <span className="text-[14px] text-gray-700">創作者888</span></div>
                    </div>

                    <button className="mt-1 text-[12.5px] text-violet-600 border border-violet-200 rounded-lg px-4 py-1.5 hover:bg-violet-50 font-medium">更換頭像</button>

                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-start justify-between">
                        <label className="text-[12.5px] text-gray-500 pt-1">個人簡介</label>
                        <span className="text-[11.5px] text-gray-400">{bio.length}/200</span>
                      </div>
                      <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={2} maxLength={200}
                        className="w-full text-[13.5px] border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-violet-400 resize-none"
                      />
                      <div className="text-[11px] text-gray-400">支持 JPG、PNG 格式，大小不超過 2MB</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右：賬號安全 */}
              <div className="col-span-5 rounded-xl bg-white border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-800">帳號安全</h3>
                  <button onClick={() => setSecurityScoreDialog(true)}
                    className="text-[11.5px] text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> 安全評分
                  </button>
                </div>

                {/* 安全項列表 - 全部真實可操作 */}
                {[
                  { icon: Lock, title: '登錄密碼', desc: '建議定期更換密碼，保障帳號安全', action: '修改密碼', onClick: () => setPasswordDialog(true) },
                  {
                    icon: Shield, title: '兩步驗證',
                    desc: twoFactor.enabled ? `已開啟（${twoFactor.method === 'app' ? '驗證器App' : twoFactor.method === 'sms' ? '短信' : '郵件'}）` : '開啟後，登錄時需要額外驗證驗證碼',
                    action: '', toggle: true,
                    toggleState: twoFactor.enabled,
                    onToggle: handleToggleTwoFactor,
                  },
                  { icon: Monitor, title: '登錄設備管理', desc: '管理您當前帳號的登錄設備', action: '查看設備', onClick: () => setDeviceDialog(true) },
                  { icon: Clock, title: '最近登錄記錄', desc: '查看帳號最近的登錄活動', action: '查看記錄', onClick: () => setLoginHistoryDialog(true) },
                ].map((item,i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-violet-500"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-gray-800">{item.title}</div>
                        <div className="text-[11.5px] text-gray-400 mt-0.5">{item.desc}</div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {item.toggle ? (
                          <button onClick={item.onToggle}
                            className={`w-10 h-5.5 rounded-full transition-colors relative ${'toggleState' in item && (item as any).toggleState ?'bg-violet-500':'bg-gray-300'}`}>
                            <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-[2px] transition-all shadow ${'toggleState' in item && (item as any).toggleState ?'left-[22px]':'left-[2px]'}`}/>
                          </button>
                        ) : item.action ? (
                          <button onClick={item.onClick}
                            className="text-[12px] text-violet-600 border border-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-50 whitespace-nowrap">
                            {item.action}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}

                {/* 安全評分條 */}
                <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-green-700">安全評分</span>
                    <span className="text-sm font-bold text-green-600">{securityScore ? securityScore.score : '—'}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-green-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                      style={{ width: `${securityScore ? securityScore.score : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 下排：賬號統計 + 套餐資源使用 */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-7 rounded-xl bg-white border border-gray-100 p-6 space-y-4">
                <h3 className="text-[15px] font-bold text-gray-800">帳號統計</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: FileVideo, value: '132', label: '累計創作視頻', change: '+28%', color: '#7C3AED' },
                    { icon: Play, value: '58.7w', label: '累計播放量', change: '+36%', color: '#3B82F6' },
                    { icon: Heart, value: '2.3w', label: '累計點贊數', change: '+18%', color: '#EC4899' },
                    { icon: UsersIcon, value: '1.2w', label: '累計粉絲數', change: '+22%', color: '#10B981' },
                  ].map((stat,i) => {
                    const Icon = stat.icon
                    return (
                      <div key={i} className="rounded-xl bg-gray-50/80 p-4 space-y-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{backgroundColor: stat.color+'12'}}>
                          <Icon className="w-4.5 h-4.5" style={{color: stat.color}}/>
                        </div>
                        <div className="text-[20px] font-bold text-gray-900 leading-none">{stat.value}</div>
                        <div className="text-[11.5px] text-gray-500">{stat.label}</div>
                        <div className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                          <TrendingUp className="w-3 h-3"/> 較上月 {stat.change}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="col-span-5 rounded-xl bg-white border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-800">套餐與資源使用</h3>
                  <button className="text-[12px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5">查看詳情 <ArrowRight className="w-3.5 h-3.5"/></button>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-500"/>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-bold text-gray-800">尊享會員</div>
                    <div className="text-[11.5px] text-gray-500">有效期至 2025-12-31</div>
                  </div>
                  <button className="text-[12px] font-medium text-white bg-violet-600 rounded-lg px-4 py-1.5 hover:bg-violet-700">續費升級</button>
                </div>

                <div className="space-y-3">
                {[
                  { label: '視頻生成額度', pct: 57 },
                  { label: '數字人生成時長', used: 320, total: 800, unit: '分鐘', pct: 53 },
                  { label: 'AI 配額額度', used: 2800, total: 5000, unit: '字' },
                  { label: '雲存儲空間', used: 12.6, total: 50, unit: 'GB', pct: 25 },
                ].map((item,i) => {
                  const displayPct = item.pct ?? Math.round(item.used! / item.total! * 100)
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12.5px] text-gray-600">{item.label}</span>
                        {item.total ? (
                          <span className="text-[11.5px] text-gray-400">已用 {item.used.toLocaleString()} / {item.total.toLocaleString()} {item.unit} <span className="ml-1 text-gray-500">{displayPct}%</span></span>
                        ) : (
                          <span className="text-[11.5px] text-gray-400">{displayPct}%</span>
                        )}
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{width:`${displayPct}%`}} />
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- 我的偏好 --- */}
        {activeTab === 'prefs' && (
          <div className="rounded-xl bg-white border border-gray-100 p-6 space-y-5">
            <h3 className="text-[15px] font-bold text-gray-800">我的偏好</h3>
            {[
              { title: '界面語言', options: ['繁體中文','簡體中文','English'], current: '繁體中文' },
              { title: '主題風格', options: ['淺色主題','深色主題','跟隨系統'], current: '淺色主題' },
              { title: '默認發布平臺', options: ['抖音','微信公眾號','視頻號','小紅書','B站'], current: '抖音' },
              { title: '數字人默認形象', options: ['知性女主播','商務男主播','親和女主播'], current: '知性女主播' },
              { title: '視頻默認比例', options: ['9:16 (豎版)','16:9 (橫版)','1:1 (方形)'], current: '9:16 (豎版)' },
              { title: '自動保存草稿', options: ['開啟','關閉'], current: '開啟' },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-[13.5px] font-medium text-gray-700">{pref.title}</span>
                <select defaultValue={pref.current}
                  className="text-[12.5px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-400 bg-white appearance-none pr-7 bg-no-repeat bg-[right_6px_center]"
                  style={{backgroundImage:`url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3e%3cpath d='M1 3l4 4 4-4' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3e%3c/svg%3e")`}}>
                  {pref.options.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* --- 通知設置 --- */}
        {activeTab === 'notify' && (
          <div className="rounded-xl bg-white border border-gray-100 p-6 space-y-5 max-w-[720px]">
            <h3 className="text-[15px] font-bold text-gray-800">通知設置</h3>
            <div className="space-y-1">
              {[
                { cat: '系統通知', items: [
                  { label: '版本更新提醒', desc: '當有新版本可用時推送通知', on: true },
                  { label: '賬號安全警告', desc: '檢測到異常登錄或密碼更改時提醒', on: true },
                  { label: '系統維護公告', desc: '系統停機維護前的提前通知', on: true },
                ]},
                { cat: '業務通知', items: [
                  { label: '視頻生成完成', desc: '數字人/OpenMontage 視頻生成完成後通知', on: true },
                  { label: '聲音克隆完成', desc: '語音克隆訓練完成後通知', on: true },
                  { label: '發佈結果回調', desc: '一鍵發佈各平臺結果通知', on: true },
                  { label: '會員到期提醒', desc: '尊享會員到期前 7 天提醒續費', on: true },
                ]},
                { cat: '營銷消息', items: [
                  { label: '新功能上線', desc: 'AIP 新功能或優化上線通知', on: false },
                  { label: '優惠活動', desc: '限時折扣、特價套餐等促銷信息', on: false },
                ]},
              ].map((group, gi) => (
                <div key={gi}>
                  <div className="text-[12.5px] font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2 first:mt-0">{group.cat}</div>
                  {group.items.map((item, ii) => (
                    <label key={ii} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" defaultChecked={item.on} className="mt-0.5 w-4 h-4 accent-violet-600 rounded"/>
                      <div>
                        <div className="text-[13.5px] font-medium text-gray-800">{item.label}</div>
                        <div className="text-[11.5px] text-gray-400 mt-0.5">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* ===== 彈窗：修改密碼 ===== */}
      {/* ============================================ */}
      {passwordDialog && (
        <Modal onClose={() => { setPasswordDialog(false); setPasswordError(''); setPasswordForm({ current: '', newPwd: '', confirm: '' }) }}>
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">修改登錄密碼</h3>
              <button onClick={() => { setPasswordDialog(false); setPasswordError(''); setPasswordForm({ current: '', newPwd: '', confirm: '' }) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-amber-700">為保障帳號安全，請使用 8 位以上包含字母、數字和特殊字符的密碼</div>
            </div>

            <div>
              <label className="text-[12.5px] font-medium text-gray-600 mb-1.5 block">當前密碼</label>
              <div className="relative">
                <input type={showPassword['current'] ? 'text' : 'password'} value={passwordForm.current}
                  onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} placeholder="請輸入當前密碼"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
                <button onClick={() => toggleShowPassword('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword['current'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[12.5px] font-medium text-gray-600 mb-1.5 block">新密碼</label>
              <div className="relative">
                <input type={showPassword['newPwd'] ? 'text' : 'password'} value={passwordForm.newPwd}
                  onChange={e => setPasswordForm(p => ({ ...p, newPwd: e.target.value }))} placeholder="請輸入新密碼（至少 8 位）"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
                <button onClick={() => toggleShowPassword('newPwd')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword['newPwd'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[12.5px] font-medium text-gray-600 mb-1.5 block">確認新密碼</label>
              <div className="relative">
                <input type={showPassword['confirm'] ? 'text' : 'password'} value={passwordForm.confirm}
                  onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} placeholder="請再次輸入新密碼"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
                <button onClick={() => toggleShowPassword('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword['confirm'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="text-[12.5px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => { setPasswordDialog(false); setPasswordError(''); setPasswordForm({ current: '', newPwd: '', confirm: '' }) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">取消</button>
            <button onClick={handlePasswordSubmit} disabled={passwordSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-1.5">
              {passwordSubmitting && <Spinner />}
              {passwordSubmitting ? '提交中...' : '確認修改'}
            </button>
          </div>
        </Modal>
      )}

      {/* ============================================ */}
      {/* ===== 彈窗：兩步驗證設置 ===== */}
      {/* ============================================ */}
      {twoFactorDialog && (
        <Modal onClose={() => setTwoFactorDialog(false)}>
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${twoFactor.enabled ? 'bg-green-50' : 'bg-violet-50'}`}>
                {twoFactor.enabled ? <Check className="w-5 h-5 text-green-500" /> : <Shield className="w-5 h-5 text-violet-500" />}
              </div>
              <h3 className="text-base font-bold text-gray-900">{twoFactor.enabled ? '關閉兩步驗證' : '開啟兩步驗證'}</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {!twoFactor.enabled && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <Fingerprint className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-blue-700">
                  兩步驗證將為您的帳號增加一層保護。開啟後，除了密碼外，登錄時還需要輸入驗證器App生成的動態驗證碼。
                </p>
              </div>
            )}
            {twoFactor.enabled && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-red-700">關閉兩步驗證後，登錄時將不再需要額外驗證。這可能會降低您的帳號安全性。</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[12.5px] font-semibold text-gray-600">驗證方式</div>
              {[
                { key: 'app', label: '驗證器 App (Google Authenticator / Authy)', icon: <KeyRound className="w-4 h-4" /> },
                { key: 'sms', label: '短信驗證碼', icon: <PhoneIcon className="w-4 h-4" /> },
                { key: 'email', label: '郵件驗證碼', icon: <Globe className="w-4 h-4" /> },
              ].map(opt => (
                <button key={opt.key} disabled={twoFactor.enabled}
                  onClick={() => setTwoFactor(prev => ({ ...prev, method: opt.key as any }))}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${twoFactor.method === opt.key ? 'border-violet-300 bg-violet-50' : 'border-gray-200 hover:border-gray-300'} disabled:opacity-60`}>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">{opt.icon}</div>
                  <span className="text-[13px] text-gray-700">{opt.label}</span>
                </button>
              ))}
            </div>

            {twoFactor.enabled && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[12.5px] text-gray-600">備用驗證碼剩餘</span>
                <span className="text-[13px] font-semibold text-gray-800">{twoFactor.backupCodesRemaining} 個</span>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setTwoFactorDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">取消</button>
            <button onClick={() => confirmToggleTwoFactor(!twoFactor.enabled)}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-all ${twoFactor.enabled ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg'}`}>
              {twoFactor.enabled ? '確定關閉' : '確認開啟'}
            </button>
          </div>
        </Modal>
      )}

      {/* ============================================ */}
      {/* ===== 彈窗：登錄設備管理 ===== */}
      {/* ============================================ */}
      {deviceDialog && (
        <Modal onClose={() => setDeviceDialog(false)}>
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">登錄設備管理</h3>
                <p className="text-xs text-gray-500 mt-0.5">共 {devices.length} 台設備 · 可遠端移除可疑設備</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadDevices} disabled={devicesLoading}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${devicesLoading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setDeviceDialog(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {devicesLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Spinner /> <span className="ml-2 text-sm">載入中...</span>
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">暫無設備數據</div>
            ) : (
              devices.map(dev => (
                <div key={dev.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${dev.current ? 'border-violet-200 bg-violet-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${dev.current ? 'bg-violet-100' : 'bg-gray-100'}`}>
                    {dev.current ? <Laptop className="w-5 h-5 text-violet-500" /> : deviceIcon(dev.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-medium text-gray-800">{dev.device}</span>
                      {dev.current && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">當前設備</span>}
                    </div>
                    <div className="text-[11.5px] text-gray-400 mt-1">{dev.os} · {dev.browser}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{dev.ip}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{dev.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(dev.lastActive)}</span>
                    </div>
                  </div>
                  {!dev.current && (
                    <button onClick={() => handleRemoveDevice(dev.id)} disabled={removingDeviceId === dev.id}
                      className="text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all shrink-0 font-medium disabled:opacity-50 flex items-center gap-1">
                      {removingDeviceId === dev.id ? <Spinner /> : null}移除
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[11.5px] text-gray-400">移除設備後，該設備下次登錄需重新驗證</span>
            <button onClick={() => setDeviceDialog(false)}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:shadow-lg transition-all">關閉</button>
          </div>
        </Modal>
      )}

      {/* ============================================ */}
      {/* ===== 彈窗：最近登錄記錄 ===== */}
      {/* ============================================ */}
      {loginHistoryDialog && (
        <Modal onClose={() => setLoginHistoryDialog(false)}>
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">最近登錄記錄</h3>
                <p className="text-xs text-gray-500 mt-0.5">共 {historyTotal} 條記錄 · 如發現異常請立即修改密碼</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadLoginHistory(historyPage)} disabled={historyLoading}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setLoginHistoryDialog(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-2.5 max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Spinner /> <span className="ml-2 text-sm">載入中...</span>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">暫無登錄記錄</div>
            ) : (
              loginHistory.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${log.status === 'blocked' ? 'bg-red-50' : 'bg-green-50'}`}>
                    {log.status === 'blocked' ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-gray-800">{log.action}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${log.status === 'blocked' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {log.status === 'blocked' ? '已攔截' : '成功'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{log.ip}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{log.location}</span>
                      <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{log.device}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(log.time)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* 分頁 */}
          {historyTotal > 10 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11.5px] text-gray-400">第 {historyPage} 頁</span>
              <div className="flex items-center gap-2">
                <button onClick={() => loadLoginHistory(Math.max(1, historyPage - 1))} disabled={historyPage === 1 || historyLoading}
                  className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">上一頁</button>
                <button onClick={() => loadLoginHistory(historyPage + 1)} disabled={historyLoading}
                  className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">下一頁</button>
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={() => setLoginHistoryDialog(false)}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:shadow-lg transition-all">關閉</button>
          </div>
        </Modal>
      )}

      {/* ============================================ */}
      {/* ===== 彈窗：安全評分詳情 ===== */}
      {/* ============================================ */}
      {securityScoreDialog && (
        <Modal onClose={() => setSecurityScoreDialog(false)}>
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">安全評分詳情</h3>
              <button onClick={() => setSecurityScoreDialog(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {/* 大評分圈 */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={`${(securityScore ? securityScore.score : 0) / 100 * 326.7} 326.7`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{securityScore?.score ?? '—'}</span>
                  <span className="text-[11px] text-gray-400">/ 100</span>
                </div>
              </div>
            </div>

            {/* 檢查項目 */}
            <div className="space-y-2">
              {securityScore?.checks.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${c.passed ? 'bg-green-50' : 'bg-amber-50'}`}>
                    {c.passed ? <Check className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-gray-800">{c.name}</div>
                    <div className="text-[11.5px] text-gray-400">{c.detail}</div>
                  </div>
                  <span className={`text-[11px] font-medium ${c.passed ? 'text-green-600' : 'text-amber-600'}`}>
                    {c.passed ? '通過' : '建議'}
                  </span>
                </div>
              ))}
              {scoreLoading && (
                <div className="flex items-center justify-center py-6 text-gray-400">
                  <Spinner /> <span className="ml-2 text-sm">載入中...</span>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={() => setSecurityScoreDialog(false)}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:shadow-lg transition-all">關閉</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Heart icon for stats
function Heart({className=''}:{className?:string}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#EC4899"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
