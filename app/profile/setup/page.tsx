'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import {
  Github, Star, GitFork, Globe, Loader2, CheckCircle2,
  ChevronRight, Code2, User, ExternalLink, Sparkles
} from 'lucide-react'

type GHRepo = {
  name: string
  description: string
  stars: number
  language: string
  url: string
  forks: number
}

type GHData = {
  login: string
  name: string
  avatar_url: string
  bio: string
  followers: number
  public_repos: number
  languages: string[]
  top_repos: GHRepo[]
  total_stars: number
  github_url: string
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF', CSS: '#563d7c',
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const [githubUrl, setGithubUrl] = useState('')
  const [ghData, setGhData] = useState<GHData | null>(null)
  const [bio, setBio] = useState('')
  const [portfolioLink, setPortfolioLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'preview'>('form')

  // Auto-detect GitHub from OAuth
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const uname = user.user_metadata?.user_name || user.user_metadata?.preferred_username
      if (uname) setGithubUrl(`https://github.com/${uname}`)
    })
  }, [router])

  const extractUsername = (url: string) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`)
      return u.pathname.replace(/^\//, '').split('/')[0]
    } catch {
      return url.replace(/^.*github\.com\//, '').split('/')[0]
    }
  }

  const handleFetch = async () => {
    const username = extractUsername(githubUrl)
    if (!username) { setError('Enter a valid GitHub URL or username.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/github-profile?username=${username}`)
      if (!res.ok) throw new Error('GitHub user not found')
      const data = await res.json()
      setGhData(data)
      setBio(data.bio || '')
      setStep('preview')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch GitHub data')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!ghData) return
    setPublishing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: dbError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: ghData.name,
      role: 'student',
      avatar_url: ghData.avatar_url,
      bio,
      github_url: ghData.github_url,
      skills: ghData.languages,
      portfolio_links: portfolioLink.trim() ? [portfolioLink.trim()] : [],
      published: true,
    })

    if (dbError) { setError('Publish failed. Try again.'); setPublishing(false); return }
    router.push('/projects')
  }

  return (
    <div className="min-h-screen" style={{ background: '#09090b', color: '#fafafa' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #27272a' }} className="px-6 py-4 flex items-center justify-between sticky top-0 z-10" css-bg="#09090b">
        <div style={{ background: '#09090b' }} className="px-6 py-0 flex items-center justify-between w-full">
          <Link href="/" className="text-xl font-serif font-medium" style={{ color: '#fafafa' }}>
            forge.
          </Link>
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#71717a' }}>
            Developer Onboarding
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <div className="max-w-lg mx-auto">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                  style={{ background: '#F5A623', color: '#09090b' }}>1</div>
                <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#71717a' }}>
                  Proof of Work
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif font-medium leading-tight mb-4" style={{ color: '#fafafa' }}>
                Your code speaks.<br />Let it.
              </h1>
              <p className="text-sm font-mono leading-relaxed" style={{ color: '#71717a' }}>
                Connect your GitHub. We'll auto-generate your Talent Card — no resume writing, no cover letters.
              </p>
            </div>

            <div className="space-y-5">
              {/* GitHub URL */}
              <div>
                <label className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-2" style={{ color: '#71717a' }}>
                  <Github size={12} /> GitHub Profile URL
                </label>
                <div className="flex" style={{ border: '1px solid #27272a' }}>
                  <input
                    id="github-url-input"
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    style={{ background: '#09090b', color: '#fafafa' }}
                    className="flex-1 px-4 py-3 text-sm font-mono placeholder:text-zinc-600 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  />
                  <button
                    id="fetch-github-btn"
                    onClick={handleFetch}
                    disabled={loading || !githubUrl.trim()}
                    style={{ background: '#F5A623', color: '#09090b' }}
                    className="px-5 py-3 text-sm font-mono font-medium flex items-center gap-2 disabled:opacity-40 transition-opacity"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    {loading ? 'Fetching' : 'Fetch'}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs font-mono" style={{ color: '#f87171' }}>{error}</p>
              )}

              {/* What we pull */}
              <div className="p-4" style={{ background: '#18181b', border: '1px solid #27272a' }}>
                <p className="text-xs font-mono mb-3" style={{ color: '#71717a' }}>We automatically pull:</p>
                <div className="space-y-2">
                  {[
                    ['Top repositories by stars', Star],
                    ['Primary programming languages', Code2],
                    ['Public profile & bio', User],
                  ].map(([label, Icon]) => (
                    // @ts-expect-error - dynamic icon
                    <div key={String(label)} className="flex items-center gap-2">
                      {/* @ts-expect-error */}
                      <Icon size={12} style={{ color: '#F5A623' }} />
                      <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>{String(label)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && ghData && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                  <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#71717a' }}>
                    Portfolio Generated
                  </span>
                </div>
                <h1 className="text-3xl font-serif font-medium" style={{ color: '#fafafa' }}>
                  Looking sharp, {ghData.name.split(' ')[0]}.
                </h1>
              </div>
              <button onClick={() => setStep('form')}
                className="text-xs font-mono transition-colors hover:text-white"
                style={{ color: '#71717a' }}>
                ← Edit
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* LEFT: Talent Card */}
              <div>
                <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: '#71717a' }}>
                  Your Talent Card
                </p>

                {/* THE CARD */}
                <div className="relative p-6 sm:p-8 overflow-hidden"
                  style={{ background: '#0c0c0e', border: '1px solid #27272a' }}>
                  {/* Subtle corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10"
                    style={{ background: 'radial-gradient(circle at top right, #F5A623, transparent)' }} />

                  <div className="flex items-start gap-4 mb-6">
                    <img src={ghData.avatar_url} alt={ghData.name}
                      className="w-14 h-14 object-cover"
                      style={{ border: '1px solid #27272a' }} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-serif font-medium" style={{ color: '#fafafa' }}>
                        {ghData.name}
                      </h2>
                      <a href={ghData.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-mono mt-1 transition-colors hover:text-amber-400"
                        style={{ color: '#71717a' }}>
                        <Github size={10} /> @{ghData.login}
                      </a>
                      <div className="flex items-center gap-4 mt-2 text-xs font-mono" style={{ color: '#71717a' }}>
                        <span>{ghData.followers} followers</span>
                        <span>{ghData.public_repos} repos</span>
                        <span className="flex items-center gap-1">
                          <Star size={10} style={{ color: '#F5A623' }} /> {ghData.total_stars}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio editable */}
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Add a short bio…"
                    rows={2}
                    className="w-full text-xs font-mono leading-relaxed bg-transparent resize-none focus:outline-none mb-5"
                    style={{ color: '#a1a1aa', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}
                  />

                  {/* Languages */}
                  <div className="mb-5">
                    <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: '#52525b' }}>
                      Stack
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ghData.languages.slice(0, 6).map(lang => (
                        <span key={lang} className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1"
                          style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa' }}>
                          <span className="w-2 h-2 rounded-full"
                            style={{ background: LANG_COLORS[lang] || '#71717a' }} />
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top Repos */}
                  <div>
                    <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: '#52525b' }}>
                      Work
                    </p>
                    <div className="space-y-2">
                      {ghData.top_repos.slice(0, 3).map(repo => (
                        <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-start justify-between p-3 transition-colors group"
                          style={{ background: '#18181b', border: '1px solid #27272a' }}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-medium" style={{ color: '#fafafa' }}>
                                {repo.name}
                              </span>
                              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: '#71717a' }} />
                            </div>
                            {repo.description && (
                              <p className="text-xs font-mono mt-0.5 truncate" style={{ color: '#71717a' }}>
                                {repo.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            {repo.language && (
                              <span className="text-xs font-mono" style={{ color: '#52525b' }}>{repo.language}</span>
                            )}
                            <span className="flex items-center gap-1 text-xs font-mono" style={{ color: '#71717a' }}>
                              <Star size={10} /> {repo.stars}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="mt-6 pt-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid #27272a' }}>
                    <div className="flex items-center gap-1 text-xs font-mono" style={{ color: '#F5A623' }}>
                      <Sparkles size={10} />
                      <span>Forge Verified</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#52525b' }}>forge.dev/@{ghData.login}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Publish settings */}
              <div className="space-y-5">
                <p className="text-xs font-mono tracking-widest uppercase" style={{ color: '#71717a' }}>
                  Final Details
                </p>

                <div>
                  <label className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-2"
                    style={{ color: '#71717a' }}>
                    <Globe size={12} /> Live Project Link
                  </label>
                  <input
                    id="portfolio-link-input"
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://your-project.vercel.app"
                    className="w-full px-4 py-3 text-sm font-mono placeholder:text-zinc-700 focus:outline-none transition-colors"
                    style={{ background: '#09090b', border: '1px solid #27272a', color: '#fafafa' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#F5A623' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#27272a' }}
                  />
                </div>

                {/* Stats overview */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Repos', val: ghData.public_repos },
                    { label: 'Stars', val: ghData.total_stars },
                    { label: 'Followers', val: ghData.followers },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-3 text-center"
                      style={{ background: '#18181b', border: '1px solid #27272a' }}>
                      <div className="text-lg font-serif font-medium" style={{ color: '#fafafa' }}>{val}</div>
                      <div className="text-xs font-mono" style={{ color: '#71717a' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Checklist */}
                <div className="p-4 space-y-2" style={{ background: '#18181b', border: '1px solid #27272a' }}>
                  {[
                    { label: 'GitHub repos fetched', done: true },
                    { label: 'Languages detected', done: ghData.languages.length > 0 },
                    { label: 'Bio written', done: bio.trim().length > 0 },
                    { label: 'Live link added', done: portfolioLink.trim().length > 0 },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center`}
                        style={{ background: done ? '#22c55e20' : '#27272a', border: `1px solid ${done ? '#22c55e' : '#3f3f46'}` }}>
                        {done && <CheckCircle2 size={10} style={{ color: '#22c55e' }} />}
                      </div>
                      <span className="text-xs font-mono" style={{ color: done ? '#a1a1aa' : '#52525b' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {error && <p className="text-xs font-mono" style={{ color: '#f87171' }}>{error}</p>}

                <button
                  id="publish-profile-btn"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full py-4 text-sm font-mono font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: '#fafafa', color: '#09090b' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F5A623' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fafafa' }}
                >
                  <Sparkles size={14} />
                  {publishing ? 'Publishing…' : 'Publish My Talent Card'}
                </button>
                <p className="text-xs font-mono text-center" style={{ color: '#52525b' }}>
                  Goes live instantly. Clients discover you by stack match.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
