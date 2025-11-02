"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import { upstreamsApi, Upstream } from "@/lib/api"

export default function UpstreamsPage() {
  const [upstreams, setUpstreams] = useState<Upstream[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUpstream, setEditingUpstream] = useState<Upstream | null>(null)

  useEffect(() => {
    loadUpstreams()
  }, [])

  const loadUpstreams = async () => {
    try {
      const response = await upstreamsApi.list()
      setUpstreams(response.data)
      setLoading(false)
    } catch (error) {
      console.error("加载上游列表失败:", error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个上游API吗？")) return
    
    try {
      await upstreamsApi.delete(id)
      loadUpstreams()
    } catch (error) {
      console.error("删除失败:", error)
      alert("删除失败")
    }
  }

  const handleEdit = (upstream: Upstream) => {
    setEditingUpstream(upstream)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      name: formData.get("name") as string,
      base_url: formData.get("base_url") as string,
      description: formData.get("description") as string,
      timeout: parseInt(formData.get("timeout") as string) || 30,
      retry_count: parseInt(formData.get("retry_count") as string) || 1,
      is_enabled: formData.get("is_enabled") === "on",
    }

    try {
      if (editingUpstream) {
        await upstreamsApi.update(editingUpstream.id, data)
      } else {
        await upstreamsApi.create(data)
      }
      setShowForm(false)
      setEditingUpstream(null)
      loadUpstreams()
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
            <h1 className="text-3xl font-bold text-gray-900">上游API管理</h1>
            <p className="mt-2 text-gray-600">管理API代理目标配置</p>
          </div>
          <Button onClick={() => {
            setEditingUpstream(null)
            setShowForm(true)
          }}>
            + 新增上游
          </Button>
        </div>

        {/* 创建/编辑表单 */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingUpstream ? "编辑上游" : "新增上游"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名称 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingUpstream?.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例如: openai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      基础URL *
                    </label>
                    <input
                      type="url"
                      name="base_url"
                      defaultValue={editingUpstream?.base_url}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://api.openai.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingUpstream?.description || ""}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="简短描述这个上游API的用途"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      超时时间（秒）
                    </label>
                    <input
                      type="number"
                      name="timeout"
                      defaultValue={editingUpstream?.timeout || 30}
                      min="1"
                      max="300"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      重试次数
                    </label>
                    <input
                      type="number"
                      name="retry_count"
                      defaultValue={editingUpstream?.retry_count || 1}
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_enabled"
                    defaultChecked={editingUpstream?.is_enabled !== false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    启用此上游
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit">
                    {editingUpstream ? "更新" : "创建"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingUpstream(null)
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

        {/* 上游列表 */}
        <div className="grid grid-cols-1 gap-6">
          {upstreams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500 mb-4">还没有配置上游API</div>
                <Button onClick={() => setShowForm(true)}>
                  创建第一个上游
                </Button>
              </CardContent>
            </Card>
          ) : (
            upstreams.map((upstream) => (
              <Card key={upstream.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {upstream.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                            upstream.is_enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {upstream.is_enabled ? "启用" : "禁用"}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{upstream.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">URL:</span>{" "}
                          <code className="text-blue-600">{upstream.base_url}</code>
                        </div>
                        <div>
                          <span className="font-medium">超时:</span> {upstream.timeout}秒
                        </div>
                        <div>
                          <span className="font-medium">重试:</span> {upstream.retry_count}次
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-400">
                        创建时间: {new Date(upstream.created_at).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => handleEdit(upstream)}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        编辑
                      </Button>
                      <Button
                        onClick={() => handleDelete(upstream.id)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
