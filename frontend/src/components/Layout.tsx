"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

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
]

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

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
            </div>
          </div>
        </div>
      </header>

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
