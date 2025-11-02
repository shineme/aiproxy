"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { logsApi, upstreamsApi } from "@/lib/api"
import { RequestLog, Upstream } from "@/types"

export default function LogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([])
  const [upstreams, setUpstreams] = useState<Upstream[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUpstream, setSelectedUpstream] = useState<number | undefined>()
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null)
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    loadUpstreams()
    loadLogs()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [selectedUpstream, limit])

  const loadUpstreams = async () => {
    try {
      const res = await upstreamsApi.list()
      setUpstreams(res.data)
    } catch (error) {
      console.error("加载上游API失败:", error)
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params: any = { limit }
      if (selectedUpstream) {
        params.upstream_id = selectedUpstream
      }
      const res = await logsApi.list(params)
      setLogs(res.data)
    } catch (error) {
      console.error("加载日志失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (statusCode: number | null | undefined) => {
    if (!statusCode) return "bg-gray-100 text-gray-800"
    if (statusCode >= 200 && statusCode < 300) return "bg-green-100 text-green-800"
    if (statusCode >= 400 && statusCode < 500) return "bg-yellow-100 text-yellow-800"
    if (statusCode >= 500) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
      PATCH: "bg-purple-100 text-purple-800",
    }
    return colors[method] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getUpstreamName = (upstreamId: number) => {
    const upstream = upstreams.find(u => u.id === upstreamId)
    return upstream?.name || `ID: ${upstreamId}`
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">请求日志</h1>
          <p className="mt-2 text-gray-600">查看和分析代理请求记录</p>
        </div>

        {/* 筛选器 */}
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上游API
                </label>
                <select
                  value={selectedUpstream || ""}
                  onChange={(e) => setSelectedUpstream(e.target.value ? Number(e.target.value) : undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {upstreams.map((upstream) => (
                    <option key={upstream.id} value={upstream.id}>
                      {upstream.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  显示数量
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>

              <button
                onClick={loadLogs}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                刷新
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 日志列表 */}
        <Card>
          <CardHeader>
            <CardTitle>请求记录 ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无日志记录
                <p className="text-sm mt-2">通过代理发送请求后，日志将在这里显示</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        时间
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        上游
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        方法
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        路径
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        状态
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        延迟
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        IP
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {getUpstreamName(log.upstream_id)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getMethodColor(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-mono max-w-xs truncate">
                          {log.path}
                        </td>
                        <td className="py-3 px-4">
                          {log.status_code ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(log.status_code)}`}>
                              {log.status_code}
                            </span>
                          ) : log.error_message ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              错误
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {log.latency_ms ? `${log.latency_ms}ms` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {log.client_ip || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 详情模态框 */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">请求详情</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">时间：</span>
                      <span className="text-gray-900">{formatDate(selectedLog.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">上游API：</span>
                      <span className="text-gray-900">{getUpstreamName(selectedLog.upstream_id)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">方法：</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getMethodColor(selectedLog.method)}`}>
                        {selectedLog.method}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">状态码：</span>
                      {selectedLog.status_code ? (
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedLog.status_code)}`}>
                          {selectedLog.status_code}
                        </span>
                      ) : (
                        <span className="text-gray-400 ml-2">N/A</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600">延迟：</span>
                      <span className="text-gray-900">{selectedLog.latency_ms ? `${selectedLog.latency_ms}ms` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">客户端IP：</span>
                      <span className="text-gray-900 font-mono">{selectedLog.client_ip || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">路径：</span>
                      <span className="text-gray-900 font-mono break-all">{selectedLog.path}</span>
                    </div>
                  </div>
                </div>

                {/* 错误信息 */}
                {selectedLog.error_message && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">错误信息</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm font-mono">{selectedLog.error_message}</p>
                    </div>
                  </div>
                )}

                {/* 请求头 */}
                {selectedLog.request_headers && Object.keys(selectedLog.request_headers).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">请求头</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedLog.request_headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 请求体 */}
                {selectedLog.request_body && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">请求体</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
                        {selectedLog.request_body}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 响应头 */}
                {selectedLog.response_headers && Object.keys(selectedLog.response_headers).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">响应头</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedLog.response_headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 响应体 */}
                {selectedLog.response_body && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">响应体</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
                        {selectedLog.response_body}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 触发规则 */}
                {selectedLog.triggered_rules && selectedLog.triggered_rules.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">触发的规则</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.triggered_rules.map((ruleId) => (
                        <span
                          key={ruleId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                        >
                          规则 #{ruleId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
