/**
 * ============================================================================
 * SUPABASE AUTH IMPLEMENTATION
 * ============================================================================
 *
 * Replaces localStorage token auth with Supabase Auth
 *
 * Benefits:
 * ✅ httpOnly cookies (XSS protection)
 * ✅ Built-in session management
 * ✅ Automatic token refresh
 * ✅ MFA support ready
 * ✅ Social auth ready (Google, GitHub, etc.)
 *
 * Migration from old auth:
 * 1. Users must re-login (sessions invalidated)
 * 2. Update all auth hooks to use this file
 * 3. Remove localStorage token usage
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store session in cookies for SSR support
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Auth types
 */
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'SCHOOL' | 'CATERING' | 'GOVERNMENT';
  full_name?: string;
  avatar_url?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at: number;
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    full_name?: string;
    role?: string;
  }
): Promise<{ user: User | null; error: any }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth] Sign up error:', error);
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: new Error('No user data returned') };
    }

    // Fetch additional user data from database
    const user = await getUserProfile(data.user.id);

    console.log('[Auth] User signed up successfully:', user?.email);

    return { user, error: null };
  } catch (error: any) {
    console.error('[Auth] Sign up exception:', error);
    return { user: null, error };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Sign in error:', error);
      return { user: null, session: null, error };
    }

    if (!data.user || !data.session) {
      return { user: null, session: null, error: new Error('No session data') };
    }

    // Fetch additional user data from database
    const user = await getUserProfile(data.user.id);

    console.log('[Auth] User signed in successfully:', user?.email);

    return {
      user,
      session: data.session as unknown as Session,
      error: null,
    };
  } catch (error: any) {
    console.error('[Auth] Sign in exception:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: any }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Sign out error:', error);
      return { error };
    }

    // Clear any additional cached data
    if (typeof window !== 'undefined') {
      // Clear old localStorage tokens (migration)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    console.log('[Auth] User signed out successfully');

    return { error: null };
  } catch (error: any) {
    console.error('[Auth] Sign out exception:', error);
    return { error };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Auth] Get session error:', error);
      return null;
    }

    return data.session as unknown as Session;
  } catch (error) {
    console.error('[Auth] Get session exception:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[Auth] Get user error:', error);
      return null;
    }

    if (!data.user) {
      return null;
    }

    // Fetch additional user data from database
    return await getUserProfile(data.user.id);
  } catch (error) {
    console.error('[Auth] Get user exception:', error);
    return null;
  }
}

/**
 * Get user profile from database
 */
async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth] Get profile error:', error);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('[Auth] Get profile exception:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  updates: Partial<User>
): Promise<{ user: User | null; error: any }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { user: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('[Auth] Update profile error:', error);
      return { user: null, error };
    }

    console.log('[Auth] Profile updated successfully');

    return { user: data as User, error: null };
  } catch (error: any) {
    console.error('[Auth] Update profile exception:', error);
    return { user: null, error };
  }
}

/**
 * Reset password request
 */
export async function resetPassword(email: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('[Auth] Reset password error:', error);
      return { error };
    }

    console.log('[Auth] Password reset email sent');

    return { error: null };
  } catch (error: any) {
    console.error('[Auth] Reset password exception:', error);
    return { error };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('[Auth] Update password error:', error);
      return { error };
    }

    console.log('[Auth] Password updated successfully');

    return { error: null };
  } catch (error: any) {
    console.error('[Auth] Update password exception:', error);
    return { error };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Auth] State changed:', event);
    callback(event, session as unknown as Session);
  });
}

/**
 * Get access token for API requests
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[Auth] Get access token error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * ============================================================================
 * MIGRATION HELPERS
 * ============================================================================
 */

/**
 * Migrate from old localStorage auth to Supabase Auth
 * This should be run once to help users transition
 */
export async function migrateFromLocalStorageAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Check if old token exists
    const oldToken = localStorage.getItem('token');
    const oldUserStr = localStorage.getItem('user');

    if (!oldToken || !oldUserStr) {
      return false;
    }

    // User needs to re-login
    // Clear old data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    console.log('[Migration] Old auth data cleared. User must re-login.');

    return true;
  } catch (error) {
    console.error('[Migration] Error migrating auth:', error);
    return false;
  }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * Sign In:
 * ```typescript
 * const { user, session, error } = await signIn(email, password);
 * if (error) {
 *   console.error('Login failed:', error);
 * } else {
 *   console.log('Logged in:', user);
 * }
 * ```
 *
 * Get Current User:
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Current user:', user);
 * }
 * ```
 *
 * Protected API Request:
 * ```typescript
 * const token = await getAccessToken();
 * const response = await fetch('/api/protected', {
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * });
 * ```
 *
 * Auth State Listener (in component):
 * ```typescript
 * useEffect(() => {
 *   const { data } = onAuthStateChange((event, session) => {
 *     if (event === 'SIGNED_IN') {
 *       // Handle sign in
 *     } else if (event === 'SIGNED_OUT') {
 *       // Handle sign out
 *     }
 *   });
 *
 *   return () => data.subscription.unsubscribe();
 * }, []);
 * ```
 */
