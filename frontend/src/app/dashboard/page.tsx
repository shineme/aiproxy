"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { dashboardApi, logsApi } from "@/lib/api"

interface Stats {
  today_requests: number
  success_rate: number
  active_keys: number
  total_keys: number
  average_latency_ms: number
}

interface RecentRequest {
  id: number
  method: string
  path: string
  status_code: number | null
  latency_ms: number | null
  created_at: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000) // 每10秒刷新
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, realtimeRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.realtime(10)
      ])
      setStats(statsRes.data)
      setRecentRequests(realtimeRes.data.recent_requests)
      setLoading(false)
    } catch (error) {
      console.error("加载数据失败:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode) return "bg-gray-100 text-gray-800"
    if (statusCode >= 200 && statusCode < 300) return "bg-green-100 text-green-800"
    if (statusCode >= 400 && statusCode < 500) return "bg-yellow-100 text-yellow-800"
    if (statusCode >= 500) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
          <p className="mt-2 text-gray-600">系统总览与关键指标</p>
        </div>

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                今日请求
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.today_requests.toLocaleString() || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">次</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                成功率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.success_rate.toFixed(1) || 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {stats && stats.success_rate >= 95 ? "✅ 良好" : "⚠️ 需关注"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                活跃密钥
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.active_keys || 0} / {stats?.total_keys || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">个</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                平均延迟
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.average_latency_ms.toFixed(0) || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">毫秒</p>
            </CardContent>
          </Card>
        </div>

        {/* 最近请求 */}
        <Card>
          <CardHeader>
            <CardTitle>最近请求</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      方法
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      路径
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      状态码
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      延迟
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        暂无请求记录
                      </td>
                    </tr>
                  ) : (
                    recentRequests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {req.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                          {req.path.length > 50 ? req.path.substring(0, 50) + "..." : req.path}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(req.status_code)}`}>
                            {req.status_code || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {req.latency_ms ? `${req.latency_ms}ms` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleString("zh-CN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/upstreams"
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-2xl">🌐</span>
                <div>
                  <div className="font-medium text-gray-900">新增上游API</div>
                  <div className="text-sm text-gray-500">配置代理目标</div>
                </div>
              </a>
              <a
                href="/keys"
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-2xl">🔑</span>
                <div>
                  <div className="font-medium text-gray-900">添加密钥</div>
                  <div className="text-sm text-gray-500">管理API密钥</div>
                </div>
              </a>
              <a
                href="/logs"
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-2xl">📋</span>
                <div>
                  <div className="font-medium text-gray-900">查看日志</div>
                  <div className="text-sm text-gray-500">请求记录查询</div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
