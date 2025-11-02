"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import { rulesApi, upstreamsApi, Rule, Upstream } from "@/lib/api"

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [upstreams, setUpstreams] = useState<Upstream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [rulesRes, upstreamsRes] = await Promise.all([
        rulesApi.list(),
        upstreamsApi.list()
      ])
      setRules(rulesRes.data)
      setUpstreams(upstreamsRes.data)
      setLoading(false)
    } catch (error) {
      console.error("加载数据失败:", error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个规则吗？")) return
    
    try {
      await rulesApi.delete(id)
      loadData()
    } catch (error) {
      console.error("删除失败:", error)
      alert("删除失败")
    }
  }

  const getConditionSummary = (conditions: any): string => {
    if (!conditions) return "未知条件"
    
    if (conditions.type === "status_code") {
      return `状态码 ${conditions.operator} ${conditions.value}`
    } else if (conditions.type === "response_body") {
      return `响应体包含: ${conditions.value}`
    } else if (conditions.type === "composite") {
      return `组合条件 (${conditions.logic})`
    }
    
    return conditions.type || "未知条件"
  }

  const getActionsSummary = (actions: string[]): string => {
    const actionMap: { [key: string]: string } = {
      disable_key: "禁用密钥",
      ban_key: "封禁密钥",
      alert: "发送告警",
      log: "记录日志"
    }
    
    return actions.map(a => actionMap[a] || a).join(", ")
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
            <h1 className="text-3xl font-bold text-gray-900">规则配置</h1>
            <p className="mt-2 text-gray-600">配置自动失效检测和处理规则</p>
          </div>
          <Button onClick={() => alert("规则创建功能开发中")}>
            + 新增规则
          </Button>
        </div>

        {/* 规则列表 */}
        <div className="grid grid-cols-1 gap-6">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500 mb-4">还没有配置规则</div>
                <Button onClick={() => alert("规则创建功能开发中")}>
                  创建第一个规则
                </Button>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => {
              const upstream = upstreams.find(u => u.id === rule.upstream_id)
              
              return (
                <Card key={rule.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {rule.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                              rule.is_enabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {rule.is_enabled ? "启用" : "禁用"}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="mt-2 text-gray-600">{rule.description}</p>
                        )}
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="font-medium text-gray-700 min-w-20">上游:</span>
                            <span className="text-gray-900">{upstream?.name || "-"}</span>
                          </div>
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="font-medium text-gray-700 min-w-20">条件:</span>
                            <span className="text-gray-900">{getConditionSummary(rule.conditions)}</span>
                          </div>
                          <div className="flex items-start space-x-2 text-sm">
                            <span className="font-medium text-gray-700 min-w-20">动作:</span>
                            <span className="text-gray-900">{getActionsSummary(rule.actions)}</span>
                          </div>
                          {rule.trigger_threshold > 1 && (
                            <div className="flex items-start space-x-2 text-sm">
                              <span className="font-medium text-gray-700 min-w-20">阈值:</span>
                              <span className="text-gray-900">触发 {rule.trigger_threshold} 次后执行</span>
                            </div>
                          )}
                          {rule.auto_enable_delay_hours && (
                            <div className="flex items-start space-x-2 text-sm">
                              <span className="font-medium text-gray-700 min-w-20">自动恢复:</span>
                              <span className="text-gray-900">{rule.auto_enable_delay_hours} 小时后自动启用</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 text-xs text-gray-400">
                          创建时间: {new Date(rule.created_at).toLocaleString("zh-CN")}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => alert("编辑功能开发中")}
                          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                          编辑
                        </Button>
                        <Button
                          onClick={() => handleDelete(rule.id)}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* 规则示例 */}
        <Card>
          <CardHeader>
            <CardTitle>常用规则示例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">检测配额用尽</div>
                <div className="text-gray-600 mt-1">条件: HTTP 429 或响应体包含 "quota exceeded"</div>
                <div className="text-gray-600">动作: 禁用密钥, 24小时后自动恢复</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">检测认证失败</div>
                <div className="text-gray-600 mt-1">条件: HTTP 401 或 403</div>
                <div className="text-gray-600">动作: 封禁密钥, 发送告警</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">检测慢请求</div>
                <div className="text-gray-600 mt-1">条件: 延迟 > 5000ms, 连续3次</div>
                <div className="text-gray-600">动作: 记录日志, 发送告警</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
