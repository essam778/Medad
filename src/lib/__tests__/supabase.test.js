import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Supabase client', () => {
  it('should have auth methods', () => {
    expect(supabase.auth.signInWithPassword).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
    expect(supabase.auth.getSession).toBeDefined()
    expect(supabase.auth.onAuthStateChange).toBeDefined()
    expect(supabase.auth.signUp).toBeDefined()
  })

  it('should have from method', () => {
    expect(typeof supabase.from).toBe('function')
  })

  it('from should return chainable query builder', () => {
    const q = supabase.from('posts')
    expect(typeof q.select).toBe('function')
    expect(typeof q.eq).toBe('function')
    expect(typeof q.order).toBe('function')
    expect(typeof q.range).toBe('function')
    expect(typeof q.limit).toBe('function')
    expect(typeof q.maybeSingle).toBe('function')
    expect(typeof q.single).toBe('function')
    expect(typeof q.insert).toBe('function')
    expect(typeof q.update).toBe('function')
    expect(typeof q.delete).toBe('function')
  })

  it('should support storage operations', () => {
    expect(typeof supabase.storage.from).toBe('function')
  })

  it('should support realtime channels', () => {
    expect(typeof supabase.channel).toBe('function')
    expect(typeof supabase.removeChannel).toBe('function')
  })

  it('should support RPC calls', () => {
    expect(typeof supabase.rpc).toBe('function')
  })

  it('chain should support query building', async () => {
    const result = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at')
      .range(0, 9)

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('count')
  })

  it('single() should return data/error shape', async () => {
    const result = await supabase.from('posts').select().eq('id', '1').single()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })

  it('maybeSingle() should return data/error shape', async () => {
    const result = await supabase.from('posts').select().eq('id', '1').maybeSingle()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })

  it('insert chain should support select().single()', async () => {
    const result = await supabase.from('posts').insert({ title: 'Test' }).select().single()
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
  })
})
