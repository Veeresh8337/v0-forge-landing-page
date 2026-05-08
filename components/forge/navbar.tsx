'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut, LayoutDashboard, Briefcase, User as UserIcon, Sparkles } from 'lucide-react'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
          setProfile(data)
        })
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
          setProfile(data)
        })
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setSigningOut(false)
    setIsOpen(false)
    window.location.href = '/'
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('') ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LEFT: Logo & Platform Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-xl font-serif font-bold text-[#0D0D0D] tracking-tight">
            forge.
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            {/* Show Talent link only to Clients or Guests */}
            {(!profile || profile.role === 'client') && (
              <Link href="/talent" className="text-[13px] font-sans font-medium text-[#666] hover:text-[#0D0D0D] transition-colors">
                Talent
              </Link>
            )}
            
            {/* Show Browse Projects to Freelancers, Job Board to Clients/Guests */}
            <Link href="/projects" className="text-[13px] font-sans font-medium text-[#666] hover:text-[#0D0D0D] transition-colors">
              {profile?.role === 'student' ? 'Browse Projects' : 'Job Board'}
            </Link>

            {user && (
              <Link href="/dashboard" className="text-[13px] font-sans font-medium text-[#666] hover:text-[#0D0D0D] transition-colors">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-5">
          {loading ? (
            <div className="w-20 h-8 bg-[#F5F4F0] animate-pulse rounded-full" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link href="/post-project" className="hidden sm:flex items-center gap-2 px-5 py-2 bg-[#0D0D0D] text-white text-[12px] font-sans font-semibold rounded-full hover:bg-[#333] transition-all">
                <Sparkles size={14} /> Post Project
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 group p-1 pr-2 rounded-full hover:bg-[#F5F4F0] transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-[#E5E5E5] object-cover" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center text-[11px] font-bold text-[#0D0D0D] border border-[#E09510]">
                      {initials}
                    </div>
                  )}
                  <ChevronDown size={14} className={`text-[#8A8A8A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E5E5] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                      <div className="px-4 py-2 border-b border-[#F5F4F0] mb-2">
                        <p className="text-xs font-semibold text-[#0D0D0D] truncate">{user.user_metadata?.full_name || user.email}</p>
                        <p className="text-[10px] text-[#8A8A8A] truncate">{user.email}</p>
                      </div>
                      
                      <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#666] hover:bg-[#F5F4F0] hover:text-[#0D0D0D] transition-colors">
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link href="/projects" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#666] hover:bg-[#F5F4F0] hover:text-[#0D0D0D] transition-colors">
                        <Briefcase size={15} /> My Projects
                      </Link>
                      <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#666] hover:bg-[#F5F4F0] hover:text-[#0D0D0D] transition-colors">
                        <UserIcon size={15} /> Profile Settings
                      </Link>
                      
                      <button 
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 border-t border-[#F5F4F0] transition-colors"
                      >
                        <LogOut size={15} /> {signingOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/auth/login" className="text-sm font-sans font-medium text-[#666] hover:text-[#0D0D0D] transition-colors">Sign In</Link>
              <Link href="/auth/login" className="px-6 py-2.5 bg-[#F5A623] text-[#0D0D0D] text-sm font-sans font-bold rounded-full hover:bg-[#E09510] transition-all shadow-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

