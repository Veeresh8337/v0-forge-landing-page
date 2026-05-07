'use client'

import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useState } from 'react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.9 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.1 16.2 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 10.7z" fill="#FF3D00"/>
      <path d="M24 45c5.5 0 10.5-1.9 14.4-5l-6.6-5.6C29.8 35.9 27 37 24 37c-5.7 0-10.6-3.9-11.8-9.2l-7 5.4C8.1 40.5 15.4 45 24 45z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.8 2.7-2.6 5-5 6.5l6.6 5.6C41.3 37.2 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [activeTab, setActiveTab] = useState<'student' | 'client'>('student')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    const next = activeTab === 'client' ? '/post-project' : '/profile/setup'
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b-2 border-[#8A8A8A] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif font-medium text-[#0D0D0D]">forge.</Link>
        <span className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase">Join the Platform</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Tab switcher */}
          <div className="flex border-2 border-[#8A8A8A] mb-8">
            <button
              id="tab-student"
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-3 text-sm font-sans font-medium transition-all duration-200 ${
                activeTab === 'student' ? 'bg-[#0D0D0D] text-white' : 'bg-white text-[#8A8A8A] hover:text-[#0D0D0D]'
              }`}
            >
              I&apos;m a Developer
            </button>
            <button
              id="tab-client"
              onClick={() => setActiveTab('client')}
              className={`flex-1 py-3 text-sm font-sans font-medium border-l-2 border-[#8A8A8A] transition-all duration-200 ${
                activeTab === 'client' ? 'bg-[#F5A623] text-[#0D0D0D]' : 'bg-white text-[#8A8A8A] hover:text-[#0D0D0D]'
              }`}
            >
              I&apos;m a Client
            </button>
          </div>

          {/* Card */}
          <div className="border-2 border-[#8A8A8A] p-8 sm:p-10 bg-white">

            {/* Icon + Heading */}
            <div className="mb-8">
              <div className={`w-8 h-8 mb-5 ${activeTab === 'client' ? 'bg-[#F5A623]' : 'bg-[#0D0D0D]'}`} />
              <h1 className="text-3xl font-serif font-medium text-[#0D0D0D] mb-2">
                {activeTab === 'student' ? 'Join as Developer' : 'Post a Project'}
              </h1>
              <p className="text-sm font-sans text-[#8A8A8A] leading-relaxed">
                {activeTab === 'student'
                  ? "Sign in with Google. We'll build your portfolio automatically."
                  : 'Sign in with Google. Describe your idea — AI scopes the rest.'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 border-2 border-red-400 bg-red-50">
                <p className="text-xs font-sans text-red-600">Authentication failed. Please try again.</p>
              </div>
            )}

            {/* Google button */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-[#0D0D0D] text-[#0D0D0D] font-sans text-sm font-medium hover:bg-[#0D0D0D] hover:text-white transition-all duration-200 group disabled:opacity-50"
            >
              <GoogleIcon />
              <span>{loading ? 'Redirecting…' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="flex-1 border-t border-[#8A8A8A]" />
              <span className="text-xs font-sans text-[#8A8A8A]">secure · instant · free</span>
              <div className="flex-1 border-t border-[#8A8A8A]" />
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {(activeTab === 'student'
                ? [['Auto Portfolio', 'From GitHub'], ['One-Click Bid', 'No cover letter'], ['Real Projects', 'Paid work']]
                : [['AI Scoping', 'Instant brief'], ['Vetted Talent', 'No noise'], ['Milestones', 'Safe payments']]
              ).map(([label, sub]) => (
                <div key={label}>
                  <div className="text-xs font-sans font-medium text-[#0D0D0D]">{label}</div>
                  <div className="text-xs font-sans text-[#8A8A8A]">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs font-sans text-[#8A8A8A] text-center">
            By joining, you agree to Forge&apos;s{' '}
            <Link href="/terms" className="underline hover:text-[#F5A623] transition-colors">Terms</Link>
            {' & '}
            <Link href="/privacy" className="underline hover:text-[#F5A623] transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
