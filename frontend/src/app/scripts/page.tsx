"use client"

import { useState } from "react"
import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Button } from "@/components/Button"
import axios from "axios"

export default function ScriptsPage() {
  const [scriptType, setScriptType] = useState("javascript")
  const [scriptContent, setScriptContent] = useState("return new Date().toISOString();")
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const examples = {
    javascript: {
      timestamp: "return new Date().toISOString();",
      uuid: `return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});`,
      signature: `var timestamp = Date.now();
var nonce = Math.random().toString(36).substring(7);
return 'signature_' + timestamp + '_' + nonce;`
    },
    python: {
      timestamp: `from datetime import datetime
result = datetime.now().isoformat()`,
      random: `import random
result = str(random.randint(1000, 9999))`
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await axios.post("http://localhost:8000/api/admin/scripts/test", {
        script_type: scriptType,
        script_content: scriptContent
      })
      setResult(response.data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.response?.data?.detail || error.message
      })
    } finally {
      setTesting(false)
    }
  }

  const loadExample = (exampleKey: string) => {
    const example = (examples as any)[scriptType][exampleKey]
    if (example) {
      setScriptContent(example)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">脚本测试</h1>
          <p className="mt-2 text-gray-600">测试JavaScript和Python脚本执行</p>
        </div>

        {/* 脚本编辑器 */}
        <Card>
          <CardHeader>
            <CardTitle>脚本编辑器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 脚本类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  脚本类型
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setScriptType("javascript")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      scriptType === "javascript"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setScriptType("python")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      scriptType === "python"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              {/* 示例选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  加载示例
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys((examples as any)[scriptType]).map((key) => (
                    <button
                      key={key}
                      onClick={() => loadExample(key)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* 脚本编辑区 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  脚本内容
                </label>
                <textarea
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder={
                    scriptType === "javascript"
                      ? "// JavaScript代码\nreturn new Date().toISOString();"
                      : "# Python代码\nfrom datetime import datetime\nresult = datetime.now().isoformat()"
                  }
                />
              </div>

              {/* 测试按钮 */}
              <div>
                <Button
                  onClick={handleTest}
                  disabled={testing || !scriptContent}
                >
                  {testing ? "测试中..." : "🧪 测试脚本"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>
                {result.success ? "✅ 测试成功" : "❌ 测试失败"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div>
                  <div className="text-sm text-gray-600 mb-2">执行结果：</div>
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                    {result.result}
                  </pre>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-red-600 mb-2">错误信息：</div>
                  <pre className="bg-red-50 p-4 rounded text-sm overflow-x-auto text-red-800">
                    {result.error}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-semibold text-gray-900 mb-2">JavaScript 脚本</div>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>使用 <code className="bg-gray-100 px-1">return</code> 返回结果</li>
                  <li>支持标准JavaScript语法和内置对象</li>
                  <li>脚本超时时间: 1000ms</li>
                  <li>可用于动态生成时间戳、UUID、签名等</li>
                </ul>
              </div>
              
              <div>
                <div className="font-semibold text-gray-900 mb-2">Python 脚本</div>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>使用 <code className="bg-gray-100 px-1">result</code> 变量存储结果</li>
                  <li>在受限环境中运行（RestrictedPython）</li>
                  <li>支持部分标准库（datetime, random等）</li>
                  <li>不支持文件操作、网络请求等危险操作</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-gray-900 mb-2">应用场景</div>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>动态请求头生成（时间戳、签名）</li>
                  <li>生成唯一标识符（UUID、随机数）</li>
                  <li>计算签名和哈希值</li>
                  <li>格式化日期时间</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="font-semibold text-yellow-800 mb-1">⚠️ 安全提示</div>
                <div className="text-yellow-700 text-xs">
                  脚本在沙箱环境中执行，但仍需谨慎使用。避免执行来自不可信来源的脚本。
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
