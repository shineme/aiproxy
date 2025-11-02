"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import { headersApi, upstreamsApi, HeaderConfig, Upstream } from "@/lib/api"

export default function HeadersPage() {
  const [headers, setHeaders] = useState<HeaderConfig[]>([])
  const [upstreams, setUpstreams] = useState<Upstream[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingHeader, setEditingHeader] = useState<HeaderConfig | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [headersRes, upstreamsRes] = await Promise.all([
        headersApi.list(),
        upstreamsApi.list()
      ])
      setHeaders(headersRes.data)
      setUpstreams(upstreamsRes.data)
      setLoading(false)
    } catch (error) {
      console.error("加载数据失败:", error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个请求头配置吗？")) return
    
    try {
      await headersApi.delete(id)
      loadData()
    } catch (error) {
      console.error("删除失败:", error)
      alert("删除失败")
    }
  }

  const handleEdit = (header: HeaderConfig) => {
    setEditingHeader(header)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      upstream_id: parseInt(formData.get("upstream_id") as string),
      header_name: formData.get("header_name") as string,
      value_type: formData.get("value_type") as string,
      static_value: formData.get("static_value") as string || null,
      script_content: formData.get("script_content") as string || null,
      is_enabled: formData.get("is_enabled") === "on",
    }

    try {
      if (editingHeader) {
        await headersApi.update(editingHeader.id, data)
      } else {
        await headersApi.create(data)
      }
      setShowForm(false)
      setEditingHeader(null)
      loadData()
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败")
    }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">请求头配置</h1>
            <p className="mt-2 text-gray-600">为代理请求添加自定义请求头</p>
          </div>
          <Button onClick={() => {
            setEditingHeader(null)
            setShowForm(true)
          }}>
            + 新增配置
          </Button>
        </div>

        {/* 创建/编辑表单 */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingHeader ? "编辑请求头" : "新增请求头"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      上游API *
                    </label>
                    <select
                      name="upstream_id"
                      defaultValue={editingHeader?.upstream_id}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">选择上游</option>
                      {upstreams.map(upstream => (
                        <option key={upstream.id} value={upstream.id}>
                          {upstream.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      请求头名称 *
                    </label>
                    <input
                      type="text"
                      name="header_name"
                      defaultValue={editingHeader?.header_name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例如: X-Custom-Header"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    值类型
                  </label>
                  <select
                    name="value_type"
                    defaultValue={editingHeader?.value_type || "static"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="static">静态值</option>
                    <option value="javascript">JavaScript脚本</option>
                    <option value="python">Python脚本</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    静态值
                  </label>
                  <input
                    type="text"
                    name="static_value"
                    defaultValue={editingHeader?.static_value || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="静态值或留空使用脚本"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    脚本内容
                  </label>
                  <textarea
                    name="script_content"
                    defaultValue={editingHeader?.script_content || ""}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="// 例如 JavaScript: 
return new Date().toISOString();"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    defaultChecked={editingHeader?.is_enabled !== false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    启用此配置
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit">
                    {editingHeader ? "更新" : "创建"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingHeader(null)
                    }}
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 配置列表 */}
        <Card>
          <CardHeader>
            <CardTitle>请求头配置列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      请求头名称
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      上游
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      类型
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      值/脚本
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      状态
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {headers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        还没有配置请求头
                      </td>
                    </tr>
                  ) : (
                    headers.map((header) => {
                      const upstream = upstreams.find(u => u.id === header.upstream_id)
                      const valueTypeMap: { [key: string]: string } = {
                        static: "静态",
                        javascript: "JS脚本",
                        python: "Python脚本"
                      }
                      
                      return (
                        <tr key={header.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <code className="text-sm font-mono text-blue-600">
                              {header.header_name}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {upstream?.name || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {valueTypeMap[header.value_type] || header.value_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {header.value_type === "static" 
                                ? header.static_value
                                : "脚本执行"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                              header.is_enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {header.is_enabled ? "启用" : "禁用"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(header)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(header.id)}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-gray-900">静态值</div>
                <div className="text-gray-600 mt-1">
                  直接设置固定的请求头值，适用于固定token、API版本号等场景
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">JavaScript脚本</div>
                <div className="text-gray-600 mt-1">
                  通过JS脚本动态生成值，例如: <code className="bg-gray-100 px-1">return new Date().toISOString()</code>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Python脚本</div>
                <div className="text-gray-600 mt-1">
                  通过Python脚本动态生成值（需要启用Python脚本功能）
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
