import "@testing-library/jest-dom";
const defaultResolve = { data: [], error: null, count: 0 };

function mkThenableChain(resolveValue) {
  const p = Promise.resolve(resolveValue);
  p.select = () => p;
  p.eq = () => p;
  p.neq = () => p;
  p.in = () => p;
  p.is = () => p;
  p.order = () => p;
  p.limit = () => p;
  p.contains = () => p;
  p.overlaps = () => p;
  p.or = () => p;
  p.filter = () => p;
  p.range = () => p;
  return p;
}

function mkChain() {
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
  };
  return chain;
}

function mkUpdateChain() {
  const upd = {
    eq: () => Promise.resolve({ data: null, error: null }),
    is: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    select: () => ({
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    }),
  };
  return upd;
}

function mkDeleteChain() {
  return {
    eq: () => Promise.resolve({ data: null, error: null }),
  };
}

vi.mock("@/lib/supabase", () => {
  const supabase = {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(function () {
      return mkChain();
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() =>
          Promise.resolve({ data: { path: "test.jpg" }, error: null }),
        ),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/test.jpg" },
        })),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      })),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn(() => Promise.resolve({})),
  };
  return {
    supabase,
    forceRefreshSession: vi.fn(),
    getProfileWithRetry: vi.fn(),
    uploadImage: vi.fn(),
    recordPostView: vi.fn(),
  };
});

const mockQueryClient = {
  invalidateQueries: vi.fn(),
  refetchQueries: vi.fn(),
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  getDefaultOptions: vi.fn(() => ({
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
    },
  })),
};

vi.mock("@tanstack/react-query", () => {
  function QueryClient() {
    return { ...mockQueryClient };
  }
  return {
    QueryClient,
    useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useInfiniteQuery: vi.fn(() => ({
      data: undefined,
      isLoading: false,
      error: null,
    })),
    useQueryClient: vi.fn(() => ({ ...mockQueryClient })),
  };
});

vi.mock("@auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: "div",
    span: "span",
    p: "p",
    button: "button",
  },
  AnimatePresence: function MockAnimatePresence({ children }) {
    return children;
  },
}));

vi.stubGlobal("import", {
  meta: {
    env: {
      VITE_SUPABASE_URL: "https://test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});

if (!window.localStorage) {
  const store = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn((key) => store[key] ?? null),
      setItem: vi.fn((key, val) => {
        store[key] = String(val);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((i) => Object.keys(store)[i] || null),
    },
    writable: true,
    configurable: true,
  });
}

if (!window.sessionStorage) {
  const store = {};
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: vi.fn((key) => store[key] ?? null),
      setItem: vi.fn((key, val) => {
        store[key] = String(val);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((i) => Object.keys(store)[i] || null),
    },
    writable: true,
    configurable: true,
  });
}
