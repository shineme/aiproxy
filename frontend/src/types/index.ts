export interface Upstream {
  id: number
  name: string
  base_url: string
  description?: string
  proxy_path_prefix: string
  timeout: number
  retry_count: number
  connection_pool_size: number
  log_request_body: boolean
  log_response_body: boolean
  tags: string[]
  is_enabled: boolean
  created_at: string
  updated_at?: string
}

export enum KeyStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
  BANNED = "banned"
}

export enum KeyLocation {
  HEADER = "header",
  QUERY = "query",
  BODY = "body"
}

export interface APIKey {
  id: number
  upstream_id: number
  name?: string
  key_value: string
  location: KeyLocation
  param_name: string
  value_prefix?: string
  status: KeyStatus
  enable_quota: boolean
  quota_total?: number
  quota_used: number
  quota_reset_at?: string
  auto_disable_on_failure: boolean
  auto_enable_delay_hours?: number
  auto_enable_at?: string
  last_used_at?: string
  created_at: string
  updated_at?: string
}

export enum ValueType {
  STATIC = "static",
  JAVASCRIPT = "javascript",
  PYTHON = "python"
}

export interface HeaderConfig {
  id: number
  upstream_id: number
  header_name: string
  value_type: ValueType
  static_value?: string
  script_content?: string
  priority: number
  timeout_ms: number
  fallback_strategy: string
  fallback_value?: string
  is_enabled: boolean
  created_at: string
  updated_at?: string
}

export interface Rule {
  id: number
  upstream_id: number
  name: string
  description?: string
  conditions: Record<string, any>
  actions: string[]
  auto_enable_delay_hours?: number
  trigger_threshold: number
  time_window_seconds?: number
  cooldown_seconds: number
  priority: number
  is_enabled: boolean
  created_at: string
  updated_at?: string
}

export interface RequestLog {
  id: number
  upstream_id: number
  api_key_id?: number
  method: string
  path: string
  request_headers?: Record<string, any>
  request_body?: string
  status_code?: number
  response_headers?: Record<string, any>
  response_body?: string
  latency_ms?: number
  client_ip?: string
  error_message?: string
  triggered_rules: number[]
  created_at: string
}

export interface DashboardStats {
  today_requests: number
  success_rate: number
  active_keys: number
  total_keys: number
  average_latency_ms: number
}
