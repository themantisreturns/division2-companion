import { supabase } from './supabase.js'

export async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Could not load user profile:', error)
    throw error
  }

  return data
}

export async function saveUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Could not save user profile:', error)
    throw error
  }

  return data
}