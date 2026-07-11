import { NavLink, Outlet } from 'react-router-dom'
import { Sparkles, Crown, HelpCircle, Bell, Gift, ChevronDown } from 'lucide-react'
import { navSections } from '../lib/nav'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50/80 overflow-hidden">
      {/* 左側側邊欄 */}
      <aside className="w-[220px] bg-[#1a1a2e] flex-shrink-0 flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">AIP</div>
              <div className="text-[10px] text-gray-400/80 -mt-0.5">超級個體 AI 創作平台</div>
            </div>
          </div>
        </div>

        {/* 選單（真實路由跳轉） */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {navSections.map((section, si) => (
            <div key={si} className="space-y-0.5">
              {section.header && (
                <div className="px-3 py-2 text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                  {section.header}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ' +
                      (isActive
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')
                    }
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </div>

        {/* 底部：會員 + 幫助 */}
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl p-3 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-semibold">尊享會員</span>
            </div>
            <div className="text-[10px] text-amber-400/70 mb-2.5">有效期：2025-12-31</div>
            <button className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all">
              續費升級
            </button>
          </div>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-400 hover:text-gray-200 text-sm transition-all rounded-lg hover:bg-white/5">
            <HelpCircle className="w-[18px] h-[18px]" />
            <span>幫助中心</span>
          </button>
        </div>
      </aside>

      {/* 右側主內容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部導航欄 */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
              早上好，創作者 <span className="text-lg">👋</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              歡迎使用 AIP 超級個體 AI 創作平台，今天又是高效創作的一天！
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-all">
              <Gift className="w-3.5 h-3.5" />
              邀請好友送會員
            </button>
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                創
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 leading-tight">創作者888</div>
                <div className="text-[10px] text-amber-600 font-medium leading-tight">尊享會員</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* 路由出口 */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
