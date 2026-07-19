// ============================================================
// AIP Platform 身份驗證工具
// ============================================================
// 基於 localStorage 中的 token 判斷登錄狀態，作為路由守衛的依據。
// 真實後端接入時，只需在登錄成功後調用 setToken(realToken)，
// 其餘邏輯（api.ts 的 Bearer 注入、路由守衛）無需改動。

const TOKEN_KEY = 'aip_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    // 同時清理與登錄態相關的本地標記
    localStorage.removeItem('aip_2fa_enabled')
  } catch {
    /* ignore */
  }
}

/** 是否已登錄：判斷 localStorage 中是否存在有效 token */
export function isAuthenticated(): boolean {
  return !!getToken()
}

/** 生成前端 mock 登錄 token（後端接入後可移除） */
export function generateMockToken(email?: string): string {
  const payload = btoa(unescape(encodeURIComponent(`${email || 'user'}::${Date.now()}`)))
  return `aip_${payload}`
}
