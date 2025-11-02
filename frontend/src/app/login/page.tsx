"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import apiClient from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await apiClient.post("/api/admin/auth/login", {
        username,
        password
      })

      const { access_token } = response.data
      
      // 保存Token
      localStorage.setItem("token", access_token)
      
      // 设置默认请求头
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      
      // 跳转到首页
      router.push("/dashboard")
    } catch (err: any) {
      console.error("登录失败:", err)
      setError(err.response?.data?.detail || "登录失败，请检查用户名和密码")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 API Gateway Pro
          </h1>
          <p className="text-gray-600">管理员登录</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "登录中..." : "登录"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium">首次使用？</p>
                <p>请先调用API初始化管理员账户：</p>
                <code className="block p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                  curl -X POST "http://localhost:8000/api/admin/auth/init-admin?username=admin&password=admin123"
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>默认账户：admin / admin123</p>
          <p className="mt-2">登录后请及时修改密码</p>
        </div>
      </div>
    </div>
  )
}
