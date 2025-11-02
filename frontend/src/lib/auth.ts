import apiClient from './api'

export interface User {
  id: number
  username: string
  is_active: boolean
}

export const authService = {
  // 检查认证是否启用
  async checkAuthStatus() {
    try {
      const response = await apiClient.get('/api/admin/auth/status')
      return response.data.enabled
    } catch (error) {
      console.error('检查认证状态失败:', error)
      return false
    }
  },

  // 登录
  async login(username: string, password: string) {
    const response = await apiClient.post('/api/admin/auth/login', {
      username,
      password
    })
    const { access_token } = response.data
    
    // 保存Token
    localStorage.setItem('token', access_token)
    
    // 设置默认请求头
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    
    return access_token
  },

  // 登出
  logout() {
    localStorage.removeItem('token')
    delete apiClient.defaults.headers.common['Authorization']
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get('/api/admin/auth/me')
      return response.data
    } catch (error) {
      return null
    }
  },

  // 修改密码
  async changePassword(oldPassword: string, newPassword: string) {
    const response = await apiClient.post('/api/admin/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    return response.data
  },

  // 初始化Token（从localStorage恢复）
  initToken() {
    const token = localStorage.getItem('token')
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  },

  // 获取Token
  getToken() {
    return localStorage.getItem('token')
  }
}
