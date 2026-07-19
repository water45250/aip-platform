// ============================================================
// AIP Platform API Client
// ============================================================
// 支援真實 API 調用與 Mock 降級，便於前後端分離開發

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// ---------- helpers ----------
async function request<T>(
  path: string,
  options: RequestInit & { mock?: T } = {},
): Promise<{ code: number; data: T; msg?: string }> {
  try {
    const url = `${API_BASE}${path}`
    const token = localStorage.getItem('aip_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    }
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    // 網路錯誤時降級到 mock
    if (options.mock !== undefined) {
      console.warn(`[API] ${path} 請求失敗，使用 Mock 數據:`, (err as Error).message)
      return { code: 200, data: options.mock }
    }
    throw err
  }
}

// ---------- types ----------
export interface Device {
  id: number
  device: string
  type: 'laptop' | 'phone' | 'tablet' | 'desktop'
  os: string
  browser: string
  ip: string
  location: string
  lastActive: string
  current: boolean
}

export interface LoginRecord {
  id: number
  action: string
  ip: string
  location: string
  device: string
  time: string
  status: 'success' | 'blocked' | 'failed'
}

export interface TwoFactorStatus {
  enabled: boolean
  method: 'app' | 'sms' | 'email'
  backupCodesRemaining: number
  lastChanged: string
}

// ============================================================
// 帳號安全 API
// ============================================================
export const securityApi = {
  // --- 修改密碼 ---
  changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    return request('/security/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
      mock: { success: true, message: '密碼修改成功' },
    })
  },

  // --- 兩步驗證 ---
  getTwoFactorStatus() {
    const mock: TwoFactorStatus = {
      enabled: localStorage.getItem('aip_2fa_enabled') === 'true',
      method: 'app',
      backupCodesRemaining: 5,
      lastChanged: '2025-01-10',
    }
    return request<TwoFactorStatus>('/security/two-factor', { mock })
  },

  toggleTwoFactor(enable: boolean) {
    localStorage.setItem('aip_2fa_enabled', String(enable))
    return request('/security/two-factor/toggle', {
      method: 'POST',
      body: JSON.stringify({ enable }),
      mock: { success: true, enabled: enable },
    })
  },

  // --- 登錄設備 ---
  getDevices() {
    const mock: Device[] = [
      { id: 1, device: 'MacBook Pro 16"', type: 'laptop', os: 'macOS 14.5', browser: 'Chrome 125', ip: '192.168.1.100', location: '台北, 台灣', lastActive: new Date().toISOString().replace('T', ' ').slice(0, 16), current: true },
      { id: 2, device: 'iPhone 15 Pro', type: 'phone', os: 'iOS 18.1', browser: 'Safari', ip: '10.0.0.52', location: '台北, 台灣', lastActive: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 16), current: false },
      { id: 3, device: 'iPad Air', type: 'tablet', os: 'iPadOS 18.1', browser: 'Safari', ip: '10.0.0.78', location: '台北, 台灣', lastActive: new Date(Date.now() - 86400000).toISOString().replace('T', ' ').slice(0, 16), current: false },
      { id: 4, device: 'Windows PC', type: 'desktop', os: 'Windows 11', browser: 'Edge 122', ip: '203.0.113.45', location: '北京, 中國', lastActive: new Date(Date.now() - 432000000).toISOString().replace('T', ' ').slice(0, 16), current: false },
    ]
    return request<Device[]>('/security/devices', { mock })
  },

  removeDevice(deviceId: number) {
    return request(`/security/devices/${deviceId}`, {
      method: 'DELETE',
      mock: { success: true, removedId: deviceId },
    })
  },

  // --- 登錄記錄 ---
  getLoginHistory(page = 1, pageSize = 10) {
    const mock: { items: LoginRecord[]; total: number } = {
      items: [
        { id: 1, action: '密碼登錄', ip: '192.168.1.100', location: '台北, 台灣', device: 'MacBook Pro', time: new Date().toISOString().replace('T', ' ').slice(0, 16), status: 'success' },
        { id: 2, action: '微信掃碼登錄', ip: '10.0.0.52', location: '台北, 台灣', device: 'iPhone 15 Pro', time: new Date(Date.now() - 7200000).toISOString().replace('T', ' ').slice(0, 16), status: 'success' },
        { id: 3, action: '密碼登錄', ip: '203.0.113.45', location: '北京, 中國', device: 'Windows PC', time: new Date(Date.now() - 432000000).toISOString().replace('T', ' ').slice(0, 16), status: 'success' },
        { id: 4, action: '密碼登錄', ip: '198.51.100.22', location: '曼谷, 泰國', device: 'Unknown Device', time: new Date(Date.now() - 604800000).toISOString().replace('T', ' ').slice(0, 16), status: 'blocked' },
        { id: 5, action: 'Google 登錄', ip: '10.0.0.78', location: '台北, 台灣', device: 'iPad Air', time: new Date(Date.now() - 691200000).toISOString().replace('T', ' ').slice(0, 16), status: 'success' },
        { id: 6, action: '密碼登錄', ip: '192.168.1.100', location: '台北, 台灣', device: 'MacBook Pro', time: new Date(Date.now() - 864000000).toISOString().replace('T', ' ').slice(0, 16), status: 'success' },
      ],
      total: 23,
    }
    return request<{ items: LoginRecord[]; total: number }>(
      `/security/login-history?page=${page}&pageSize=${pageSize}`,
      { mock },
    )
  },

  // --- 安全評分 ---
  getSecurityScore() {
    const mock = {
      score: 85,
      maxScore: 100,
      checks: [
        { name: '密碼強度', passed: true, detail: '強密碼已設置' },
        { name: '兩步驗證', passed: localStorage.getItem('aip_2fa_enabled') === 'true', detail: '建議開啟' },
        { name: '異常登錄監控', passed: true, detail: '未檢測到異常' },
        { name: '設備管理', passed: true, detail: '4 台設備已註冊' },
        { name: '最近密碼更改', passed: true, detail: '30 天內更改過' },
      ],
    }
    return request<typeof mock>('/security/score', { mock })
  },
}

// ============================================================
// 工具函數
// ============================================================
export function formatRelativeTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : '+08:00'))
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : '+08:00'))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
