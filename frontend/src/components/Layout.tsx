"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { authService, User } from "@/lib/auth"

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "仪表板", href: "/dashboard", icon: "📊" },
  { name: "上游API", href: "/upstreams", icon: "🌐" },
  { name: "密钥管理", href: "/keys", icon: "🔑" },
  { name: "请求头配置", href: "/headers", icon: "📝" },
  { name: "规则配置", href: "/rules", icon: "⚙️" },
  { name: "请求日志", href: "/logs", icon: "📋" },
  { name: "脚本测试", href: "/scripts", icon: "🧪" },
]

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authEnabled, setAuthEnabled] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // 初始化Token
      authService.initToken()
      
      // 检查认证是否启用
      const enabled = await authService.checkAuthStatus()
      setAuthEnabled(enabled)
      
      if (enabled) {
        // 如果启用认证，获取当前用户
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        } else if (pathname !== "/login") {
          // 如果没有登录且不在登录页，跳转到登录页
          router.push("/login")
        }
      }
    }
    
    checkAuth()
  }, [pathname, router])

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl">🚀</span>
                <span className="text-xl font-bold text-gray-900">
                  API Gateway Pro
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">v1.1.0</span>
              {authEnabled && user && (
                <>
                  <span className="text-sm text-gray-700">👤 {user.username}</span>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    修改密码
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    退出登录
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <PasswordChangeModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false)
            alert("密码修改成功！")
          }}
        />
      )}

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

interface PasswordChangeModalProps {
  onClose: () => void
  onSuccess: () => void
}

function PasswordChangeModal({ onClose, onSuccess }: PasswordChangeModalProps) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致")
      return
    }

    if (newPassword.length < 6) {
      setError("新密码长度至少为6个字符")
      return
    }

    setLoading(true)
    try {
      await authService.changePassword(oldPassword, newPassword)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || "修改密码失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">修改密码</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原密码
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新密码
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              确认新密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "修改中..." : "确认修改"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
