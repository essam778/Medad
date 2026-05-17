import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotificationStore } from '@/stores/notification.store'
import { useUIStore } from '@/stores/ui.store'

export const defaultResolve = { data: [], error: null, count: 0 }

export function mkThenableChain(resolveValue) {
  const p = Promise.resolve(resolveValue)
  p.select = () => p
  p.eq = () => p
  p.neq = () => p
  p.in = () => p
  p.is = () => p
  p.order = () => p
  p.limit = () => p
  p.contains = () => p
  p.overlaps = () => p
  p.or = () => p
  p.filter = () => p
  p.range = () => p
  p.single = () => p
  p.maybeSingle = () => p
  p.insert = () => p
  p.update = () => p
  p.delete = () => p
  p.upsert = () => p
  p.gte = () => p
  return p
}

function mkDeleteChain() {
  return {
    eq: () => Promise.resolve({ data: null, error: null }),
  }
}

function mkUpdateChain() {
  return {
    eq: () => Promise.resolve({ data: null, error: null }),
    select: () => ({
      single: () => Promise.resolve({ data: null, error: null }),
    }),
  }
}

export function mkChain() {
  const chain = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    contains: () => chain,
    overlaps: () => chain,
    or: () => chain,
    filter: () => chain,
    range: () => mkThenableChain(defaultResolve),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: undefined,
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: () => mkUpdateChain(),
    delete: () => mkDeleteChain(),
    upsert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
  return chain
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

export function Wrapper({ client, children }) {
  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}

export function resetStores() {
  useNotificationStore.setState({ notifications: [], unreadCount: 0 })
  useUIStore.setState({
    modals: { search: false, auth: false, notice: false, deleteConfirm: false },
    noticeContent: { title: '', message: '', variant: 'info' },
    mobileMenuOpen: false,
  })
}
