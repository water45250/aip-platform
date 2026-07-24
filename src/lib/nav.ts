import {
  Home, Lightbulb, FileText, Mic, MonitorPlay, GraduationCap, Eye, Bot,
  Send, Image, FileBox, Clock, History, User, Receipt,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface NavSection {
  header?: string
  items: NavItem[]
}

// 創作中心導航（個人 IP 視頻課程製作平臺）
// 聲音克隆（CosyVoice2）後為分叉點：並行兩條獨立路徑，生成內容完全不同、互不切換
//   路徑A 數字人視頻（對接 RunningHub digital_customize 純雲端 API，主打口播/IP課，服務端零 GPU）
//   路徑B 影片生成（短影音成片引擎，方案待定）
// 兩路匯合於 智能剪輯 → 成品預覽
// 7 個核心模塊有真實頁面；其餘菜單項以 PlaceholderPage 兜底，避免 404 死鏈。
export const navSections: NavSection[] = [
  { items: [{ label: '工作臺', path: '/dashboard', icon: Home }] },
  {
    header: '創作中心',
    items: [
      { label: '選題挖掘', path: '/topic-mining', icon: Lightbulb },
      { label: '腳本創作', path: '/script-creation', icon: FileText },
      { label: '聲音克隆', path: '/voice-clone', icon: Mic },
      { label: '數字人視頻', path: '/digital-human', icon: Bot },
      { label: '影片生成', path: '/video-generation', icon: MonitorPlay },
      { label: '課程工坊', path: '/course-workshop', icon: GraduationCap },
      { label: '成品預覽', path: '/final-preview', icon: Eye },
    ],
  },
  {
    header: '發布與營運',
    items: [
      { label: '素材管理', path: '/material-management', icon: FileBox },
      { label: '一鍵發布', path: '/publish', icon: Send },
      { label: '圖集發布', path: '/image-publish', icon: Image },
      { label: '草稿箱', path: '/draft-box', icon: Clock },
      { label: '發布歷史', path: '/publish-history', icon: History },
    ],
  },
  {
    header: '賬號與費用',
    items: [
      { label: '賬號管理', path: '/account', icon: User },
      { label: '訂單計費', path: '/billing', icon: Receipt },
    ],
  },
]
