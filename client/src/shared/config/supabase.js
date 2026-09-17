import { createClient } from '@supabase/supabase-js'

function readEnv(key) {
  const viteEnv = import.meta?.env
  if (viteEnv && Object.prototype.hasOwnProperty.call(viteEnv, key)) return viteEnv[key]
  if (typeof process !== 'undefined' && process.env && Object.prototype.hasOwnProperty.call(process.env, key)) return process.env[key]
  return undefined
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL') || ''
const supabaseKey = readEnv('VITE_SUPABASE_ANON_KEY') || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function ensureAnonymousAuth() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('[Supabase] 获取会话失败:', error)
    throw error
  }
  
  if (session?.user) {
    return session.user
  }
  
  const { data, error: signInError } = await supabase.auth.signInAnonymously()
  
  if (signInError) {
    console.error('[Supabase] 匿名登录失败:', signInError)
    throw signInError
  }
  
  return data.user
}

export function getCurrentUser() {
  return supabase.auth.getUser()
}
