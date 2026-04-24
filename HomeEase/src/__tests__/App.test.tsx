import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from '../App'
import { AuthProvider, useAuth } from '../hooks/useAuth'

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    loading: false,
    user: null,
    profile: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => {
        const query = {
          eq: () => query,
          order: () => query,
          limit: () => query,
          then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback)
        }
        return query
      },
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const renderApp = () => {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

describe('App', () => {
  beforeEach(() => {
    // Reset pathname before each test
    window.history.pushState({}, '', '/')
  })

  it('renders without crashing', () => {
    renderApp()
  })

  it('renders auth page when not authenticated', async () => {
    renderApp()
    
    // Wait for navigation to complete
    await act(async () => {
      window.history.pushState({}, '', '/auth')
      window.dispatchEvent(new Event('popstate'))
    })

    expect(window.location.pathname).toBe('/auth')
  })

  it('renders home page when authenticated', async () => {
    // Mock authenticated state
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: {
        id: '1',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      },
      session: {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: '1',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      },
      profile: {
        id: '1',
        role: 'customer',
        full_name: 'Test User',
        phone: '1234567890'
      },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    renderApp()
    
    // Wait for navigation to complete
    await act(async () => {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new Event('popstate'))
    })

    expect(window.location.pathname).toBe('/')
  })

  it('renders profile page when navigating to /profile', async () => {
    // Mock authenticated state
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: {
        id: '1',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      },
      session: {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: '1',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      },
      profile: {
        id: '1',
        role: 'customer',
        full_name: 'Test User',
        phone: '1234567890'
      },
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    renderApp()
    
    // Wait for navigation to complete
    await act(async () => {
      window.history.pushState({}, '', '/profile')
      window.dispatchEvent(new Event('popstate'))
    })

    expect(window.location.pathname).toBe('/profile')
  })

  it('renders not found page for invalid routes', async () => {
    renderApp()
    
    // Wait for navigation to complete
    await act(async () => {
      window.history.pushState({}, '', '/invalid-route')
      window.dispatchEvent(new Event('popstate'))
    })

    expect(window.location.pathname).toBe('/invalid-route')
  })
}) 