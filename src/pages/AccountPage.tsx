import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  ChevronLeft, Camera, User, Lock, Shield,
  Monitor, Clock, Crown, ArrowRight, Plus, Link2,
  TrendingUp, FileVideo, Play, Phone,
  Users as UsersIcon,
  Settings, Bell,
} from 'lucide-react'

// ============ Tab 定義 ============
const TABS = [
  { key: 'profile', label: '帳號資��', icon: User },
  { key: 'security', label: '安全設置', icon: Lock },
  { key: 'prefs',    label: '我的偏好',   icon: Settings },
  { key: 'notify',   label: '通知設置',   icon: Bell },
  { key: 'bind',     label: '綁定管理',   icon: Link2 },
] as const
type TabKey = typeof TABS[number]['key']

// ============ 綁定賬號數據 ============
interface BindAccount {
  id: string
  platform: string
  icon: ReactNode;
  status: 'bound' | 'unbound'
  account?: string
  color?: string
}

const BIND_ACCOUNTS: BindAccount[] = [
  {
    id: 'wechat', platform: '微信',
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#07C160"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.18A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.18 1.17 1.17 0 01-1.162-1.18c0-.651.52-1.18 1.162-1.18zm5.34 2.67c-4.402 0-8.001 2.79-8.001 6.229s3.6 6.228 8.001 6.228c.86 0 1.687-.122 2.463-.35a.88.88 0 01.72.098l1.627.951a.28.28 0 00.143.047c.138 0 .25-.114.25-.253 0-.066-.027-.13-.043-.192l-.334-1.264a.502.502 0 01.182-.567C21.774 17.888 23 16.09 23 14.089c0-3.44-3.6-6.229-8.002-6.229zm-3.06 3.37c.55 0 .996.454.996 1.014a1.005 1.005 0 01-.996 1.014 1.005 1.005 0 01-.996-1.014c0-.56.446-1.014.996-1.014zm6.12 0c.55 0 .996.454.996 1.014a1.005 1.005 0 01-.996 1.014 1.005 1.005 0 01-.996-1.014c0-.56.446-1.014.996-1.014z"/></svg>,
    status: 'bound', account: '創作者888', color: '#07C160',
  },
  {
    id: 'phone', platform: '手機號',
    icon: <Phone className="w-5 h-5 text-blue-500"/>, status: 'bound',
    account: '138****8888', color: '#3B82F6',
  },
  {
    id: 'google', platform: 'Google',
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
    status: 'unbound', color: '#4285F4',
  },
  {
    id: 'apple', platform: 'Apple ID',
    icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#000"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.83-3.12 1.87-.2.87-2.05 11.18zM15.61 4.68c.71-1.03 1.27-2.41 1.09-3.82-1.18.05-2.54.81-3.33 1.89-.73.98-1.27 2.39-1.05 3.7 1.27.1 2.57-.7 3.29-1.77z"/></svg>,
    status: 'unbound', color: '#000000',
  },
  {
    id: 'douyin', platform: '抖音',
    icon: <span className="text-[#FE2C55] font-bold text-sm">♪</span>,
    status: 'bound', account: '創作者888', color: '#FE2C55',
  },
]

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  // Profile state
  const [bio, setBio] = useState('用AI創造價值，分享知識與靈感 ✨')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

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
                (activeTab === tab.key
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700')}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== Tab Content ===== */}

        {/* --- 賬號信息（默認視圖） --- */}
        {(activeTab === 'profile' || activeTab === 'security' || activeTab === 'bind') && (
          <>
            {/* 上排：個人資料 + 賬號安全 */}
            <div className="grid grid-cols-12 gap-5">
              {/* 左：個人資料 */}
              <div className="col-span-7 rounded-xl bg-white border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-800">個人資料</h3>
                  <button className="text-[12.5px] text-violet-600 border border-violet-200 rounded-lg px-3.5 py-1.5 hover:bg-violet-50 font-medium">編輯資料</button>
                </div>

                <div className="flex items-start gap-6">
                  {/* 頭像 */}
                  <div className="relative group shrink-0">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-200 to-cyan-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                      {/* 模擬頭像 */}
                      <div className="w-full h-full bg-cover bg-center"
                        style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Crect fill='%23ddd6fe'/%3E%3Ccircle cx='56' cy='42' r='20' fill='%23a78bfa'/%3E%3Cellipse cx='56' cy='90' rx='30' ry='24' fill='%23a78bfa'/%3E%3C/svg%3E")`}}
                      />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg hover:bg-violet-700 transition-all opacity-0 group-hover:opacity-100">
                      <Camera className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* 信息字段 */}
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
                <h3 className="text-[15px] font-bold text-gray-800">帳號安全</h3>

                {[
                  { icon: Lock, title: '登錄密碼', desc: '建議定期更換密碼，保障帳號安全', action: '修改密碼' },
                  { icon: Shield, title: '兩步驗證', desc: '開啟後，登錄時需要額外驗證驗證碒', action: '', toggle: true },
                  { icon: Monitor, title: '登錄設備管理', desc: '管理您當前帳號的登錄設備', action: '查看設備' },
                  { icon: Clock, title: '最近登錄記錄', desc: '查看帳號最近的登錄活動', action: '查看記錄' },
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
                          <button onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                            className={`w-10 h-5.5 rounded-full transition-colors relative ${twoFactorEnabled?'bg-violet-500':'bg-gray-300'}`}>
                            <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-[2px] transition-all shadow ${twoFactorEnabled?'left-[22px]':'left-[2px]'}`}/>
                          </button>
                        ) : item.action ? (
                          <button className="text-[12px] text-violet-600 border border-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-50 whitespace-nowrap">
                            {item.action}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 下排：賬號統計 + 套餐資源使用 */}
            <div className="grid grid-cols-12 gap-5">
              {/* 賬號統計 */}
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

              {/* 套餐與資源使用 */}
              <div className="col-span-5 rounded-xl bg-white border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-800">套餐與資源使用</h3>
                  <button className="text-[12px] text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5">查看詳情 <ArrowRight className="w-3.5 h-3.5"/></button>
                </div>

                {/* 會員卡片 */}
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

                {/* 額度進度條 */}
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
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                          style={{width:`${displayPct}%`}} />
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            </div>

            {/* 底部：賬號綁定 */}
            <div className="rounded-xl bg-white border border-gray-100 p-6 space-y-4">
              <h3 className="text-[15px] font-bold text-gray-800">帳號綁定</h3>
              <div className="grid grid-cols-5 gap-4">
                {BIND_ACCOUNTS.map(acc => (
                  <div key={acc.id} className={
                    'border-2 rounded-xl p-4 text-center transition-all ' +
                    (acc.status === 'bound'
                      ? 'border-green-200 bg-green-50/30 hover:border-green-300'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200')
                  }>
                    <div className="flex justify-center mb-2">{acc.icon}</div>
                    <div className="text-[13px] font-semibold text-gray-800">{acc.platform}</div>
                    <div className={
                      'text-[11.5px] mt-1 ' + (acc.status === 'bound' ? 'text-green-600' : 'text-gray-400')
                    }>{acc.status === 'bound' ? '已綁定' : '未綁定'}</div>
                    {acc.account && <div className="text-[11px] text-gray-500 truncate mt-0.5">{acc.account}</div>}
                    {acc.status === 'unbound' ? (
                      <button className="mt-2 text-[11.5px] text-violet-600 border border-violet-200 rounded-lg px-3 py-1 hover:bg-violet-50">綁定</button>
                    ) : null}
                  </div>
                ))}
                {/* 綁定更多 */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center flex flex-col items-center justify-center hover:border-violet-300 cursor-pointer transition-all">
                  <Plus className="w-6 h-6 text-gray-300 mb-1"/>
                  <div className="text-[12.5px] text-violet-600 font-medium">綁定更多</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- 我的偏好（獨立 tab） --- */}
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

        {/* --- 通知設置（獨立 tab） --- */}
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
