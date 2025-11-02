"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import { keysApi, upstreamsApi, APIKey, Upstream } from "@/lib/api"

export default function KeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [upstreams, setUpstreams] = useState<Upstream[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingKey, setEditingKey] = useState<APIKey | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [keysRes, upstreamsRes] = await Promise.all([
        keysApi.list(),
        upstreamsApi.list()
      ])
      setKeys(keysRes.data)
      setUpstreams(upstreamsRes.data)
      setLoading(false)
    } catch (error) {
      console.error("加载数据失败:", error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个密钥吗？")) return
    
    try {
      await keysApi.delete(id)
      loadData()
    } catch (error) {
      console.error("删除失败:", error)
      alert("删除失败")
    }
  }

  const handleEdit = (key: APIKey) => {
    setEditingKey(key)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      upstream_id: parseInt(formData.get("upstream_id") as string),
      name: formData.get("name") as string,
      key_value: formData.get("key_value") as string,
      location: formData.get("location") as string,
      param_name: formData.get("param_name") as string,
      value_prefix: formData.get("value_prefix") as string || "",
      enable_quota: formData.get("enable_quota") === "on",
      quota_total: parseInt(formData.get("quota_total") as string) || null,
      auto_disable_on_failure: formData.get("auto_disable_on_failure") === "on",
      auto_enable_delay_hours: parseInt(formData.get("auto_enable_delay_hours") as string) || null,
    }

    try {
      if (editingKey) {
        await keysApi.update(editingKey.id, data)
      } else {
        await keysApi.create(data)
      }
      setShowForm(false)
      setEditingKey(null)
      loadData()
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "disabled":
        return "bg-yellow-100 text-yellow-800"
      case "banned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "活跃"
      case "disabled":
        return "禁用"
      case "banned":
        return "封禁"
      default:
        return status
    }
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return key
    return key.substring(0, 4) + "****" + key.substring(key.length - 4)
  }

  const filteredKeys = keys.filter(key => {
    if (filterStatus === "all") return true
    return key.status === filterStatus
  })

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
            <h1 className="text-3xl font-bold text-gray-900">密钥管理</h1>
            <p className="mt-2 text-gray-600">管理上游API的密钥池</p>
          </div>
          <Button onClick={() => {
            setEditingKey(null)
            setShowForm(true)
          }}>
            + 添加密钥
          </Button>
        </div>

        {/* 筛选器 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            全部 ({keys.length})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === "active"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            活跃 ({keys.filter(k => k.status === "active").length})
          </button>
          <button
            onClick={() => setFilterStatus("disabled")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === "disabled"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            禁用 ({keys.filter(k => k.status === "disabled").length})
          </button>
          <button
            onClick={() => setFilterStatus("banned")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filterStatus === "banned"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            封禁 ({keys.filter(k => k.status === "banned").length})
          </button>
        </div>

        {/* 创建/编辑表单 */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingKey ? "编辑密钥" : "添加密钥"}</CardTitle>
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
                      defaultValue={editingKey?.upstream_id}
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
                      密钥名称
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingKey?.name || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="可选的密钥标识"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密钥值 *
                  </label>
                  <input
                    type="text"
                    name="key_value"
                    defaultValue={editingKey?.key_value}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      密钥位置
                    </label>
                    <select
                      name="location"
                      defaultValue={editingKey?.location || "header"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query</option>
                      <option value="body">Body</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      参数名称
                    </label>
                    <input
                      type="text"
                      name="param_name"
                      defaultValue={editingKey?.param_name || "Authorization"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      值前缀
                    </label>
                    <input
                      type="text"
                      name="value_prefix"
                      defaultValue={editingKey?.value_prefix || "Bearer "}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Bearer "
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      name="enable_quota"
                      defaultChecked={editingKey?.enable_quota}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      启用配额限制
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        配额总量
                      </label>
                      <input
                        type="number"
                        name="quota_total"
                        defaultValue={editingKey?.quota_total || ""}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例如: 1000"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      name="auto_disable_on_failure"
                      defaultChecked={editingKey?.auto_disable_on_failure !== false}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      失败时自动禁用
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        自动启用延迟（小时）
                      </label>
                      <input
                        type="number"
                        name="auto_enable_delay_hours"
                        defaultValue={editingKey?.auto_enable_delay_hours || ""}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例如: 24"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit">
                    {editingKey ? "更新" : "创建"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingKey(null)
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

        {/* 密钥列表 */}
        <Card>
          <CardHeader>
            <CardTitle>密钥列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      名称/密钥
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      上游
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      状态
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      配额
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      最后使用
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        {filterStatus === "all" ? "还没有添加密钥" : `没有${getStatusText(filterStatus)}的密钥`}
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((key) => {
                      const upstream = upstreams.find(u => u.id === key.upstream_id)
                      const quotaPercent = key.enable_quota && key.quota_total
                        ? (key.quota_used / key.quota_total) * 100
                        : 0
                      
                      return (
                        <tr key={key.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              {key.name || "未命名"}
                            </div>
                            <code className="text-xs text-gray-500">
                              {maskKey(key.key_value)}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {upstream?.name || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(key.status)}`}>
                              {getStatusText(key.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {key.enable_quota ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {key.quota_used} / {key.quota_total}
                                </div>
                                <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
                                  <div
                                    className={`h-2 rounded-full ${
                                      quotaPercent >= 90 ? "bg-red-500" :
                                      quotaPercent >= 70 ? "bg-yellow-500" :
                                      "bg-green-500"
                                    }`}
                                    style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">无限制</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {key.last_used_at
                              ? new Date(key.last_used_at).toLocaleString("zh-CN")
                              : "从未使用"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(key)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(key.id)}
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
      </div>
    </Layout>
  )
}
