'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth state changes in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setSigningOut(false)
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('') ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-2 border-[#8A8A8A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-lg sm:text-xl font-serif font-medium text-[#0D0D0D]">
            forge.
          </Link>
        </div>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8 lg:gap-12 absolute left-1/2 transform -translate-x-1/2">
          <Link href="#talent" className="text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
            Talent
          </Link>
          <Link href="#features" className="text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
            Features
          </Link>
          <Link href="#how" className="text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
            How It Works
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <div className="w-24 h-8 bg-[#F5F4F0] animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-4">
              {/* Logged-in Quick Actions */}
              <div className="hidden md:flex items-center gap-4 mr-2 border-r-2 border-[#8A8A8A] pr-4">
                <Link href="/projects" className="text-xs font-sans font-medium text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
                  Job Board
                </Link>
                <Link href="/post-project" className="px-4 py-2 bg-[#F5A623] text-[#0D0D0D] font-sans text-xs font-medium border-2 border-[#F5A623] hover:bg-[#0D0D0D] hover:text-[#F5A623] transition-all duration-200">
                  Post Project
                </Link>
              </div>

              {/* Avatar & Sign Out */}
              <div className="flex items-center gap-3">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name ?? 'User'}
                    className="w-8 h-8 rounded-full border-2 border-[#8A8A8A] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#F5A623] border-2 border-[#8A8A8A] flex items-center justify-center text-xs font-sans font-medium text-[#0D0D0D]">
                    {initials}
                  </div>
                )}
                <span className="text-xs font-sans text-[#0D0D0D] hidden sm:inline max-w-[100px] truncate">
                  {user.user_metadata?.full_name ?? user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-xs font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors disabled:opacity-50"
                >
                  {signingOut ? 'Sign out' : 'Sign Out'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors hidden sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/auth/login"
                className="px-4 sm:px-6 py-2 border-2 border-[#F5A623] text-[#F5A623] font-sans text-xs sm:text-sm font-medium hover:bg-[#F5A623] hover:text-[#0D0D0D] transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
