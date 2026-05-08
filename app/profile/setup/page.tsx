'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import {
  Github, Star, Globe, Loader2, CheckCircle2,
  ChevronRight, Code2, User, ExternalLink, Sparkles, MapPin, Linkedin, Video
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
  
  // States
  const [mode, setMode] = useState<'github' | 'manual'>('github')
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  // Manual Form State
  const [manualData, setManualData] = useState({
    fullName: '',
    role: 'Designer', // Default for non-tech
    bio: '',
    location: '',
    skills: '',
    linkedin: '',
    portfolio: '',
    workSample: ''
  })
  
  // Shared state
  const [bio, setBio] = useState('')
  const [portfolioLink, setPortfolioLink] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const uname = user.user_metadata?.user_name || user.user_metadata?.preferred_username
      if (uname) {
        setGithubUrl(`https://github.com/${uname}`)
      }
      setManualData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || ''
      }))
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

  const handleManualSubmit = () => {
    if (!manualData.fullName.trim() || !manualData.skills.trim()) {
      setError('Name and Skills are required.');
      return;
    }
    setError('');
    setBio(manualData.bio);
    setPortfolioLink(manualData.portfolio);
    setStep('preview');
  }

  const handlePublish = async () => {
    setPublishing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    let dbPayload = {}
    
    if (mode === 'github' && ghData) {
      dbPayload = {
        id: user.id,
        full_name: ghData.name,
        role: 'student', // Platform role
        title: ghData.languages[0] || 'Developer', // Professional title
        avatar_url: ghData.avatar_url,
        bio: bio,
        github_url: ghData.github_url,
        skills: ghData.languages,
        portfolio_links: portfolioLink.trim() ? [portfolioLink.trim()] : [],
        github_repos: ghData.top_repos,
        published: true,
      }
    } else {
      dbPayload = {
        id: user.id,
        full_name: manualData.fullName,
        role: 'student', // Always student for freelancers
        title: manualData.role, // Professional title (e.g. Video Editor)
        bio: bio,
        location: manualData.location,
        skills: manualData.skills.split(',').map(s => s.trim()).filter(Boolean),
        linkedin_url: manualData.linkedin,
        portfolio_links: portfolioLink.trim() ? [portfolioLink.trim()] : [],
        work_samples: manualData.workSample.trim() ? [manualData.workSample.trim()] : [],
        published: true,
      }
    }

    const { error: dbError } = await supabase.from('profiles').upsert(dbPayload)

    if (dbError) { 
      const details = Object.entries(dbError).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' | ');
      console.error("Full Publish Error:", dbError)
      setError(`Publish failed: ${dbError.message || details || 'Unknown DB Error'}`)
      setPublishing(false)
      return 
    }
    router.push('/projects')
  }

  return (
    <div className="min-h-screen" style={{ background: '#09090b', color: '#fafafa' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #27272a' }} className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#09090b]">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="text-xl font-serif font-medium text-[#fafafa]">
            forge.
          </Link>
          <span className="text-xs font-mono tracking-widest uppercase text-[#71717a]">
            Developer Onboarding
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <div className="max-w-lg mx-auto animate-fade-up">
            <div className="mb-10 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono bg-[#F5A623] text-[#09090b]">1</div>
                <span className="text-xs font-mono tracking-widest uppercase text-[#71717a]">
                  Proof of Work
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif font-medium leading-tight mb-4 text-[#fafafa]">
                Showcase your craft.
              </h1>
              <p className="text-sm font-mono leading-relaxed text-[#71717a]">
                Connect your GitHub or manually build your portfolio.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-4 mb-8 p-1 bg-[#18181b] border border-[#27272a] rounded-sm">
              <button 
                onClick={() => setMode('github')}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${mode === 'github' ? 'bg-[#27272a] text-[#fafafa]' : 'text-[#71717a] hover:text-[#fafafa]'}`}
              >
                Tech (GitHub)
              </button>
              <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${mode === 'manual' ? 'bg-[#27272a] text-[#fafafa]' : 'text-[#71717a] hover:text-[#fafafa]'}`}
              >
                Creative / Manual
              </button>
            </div>

            {mode === 'github' ? (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <label className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-2 text-[#71717a]">
                    <Github size={12} /> GitHub Profile URL
                  </label>
                  <div className="flex border border-[#27272a]">
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="flex-1 px-4 py-3 bg-[#09090b] text-sm font-mono text-[#fafafa] placeholder:text-zinc-600 focus:outline-none focus:border-[#F5A623] border border-transparent transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    />
                    <button
                      onClick={handleFetch}
                      disabled={loading || !githubUrl.trim()}
                      className="px-5 py-3 text-sm font-mono font-medium flex items-center gap-2 bg-[#F5A623] text-[#09090b] disabled:opacity-40 transition-opacity"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                      {loading ? 'Fetching' : 'Fetch'}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs font-mono text-[#f87171]">{error}</p>}

                <div className="p-4 bg-[#18181b] border border-[#27272a]">
                  <p className="text-xs font-mono mb-3 text-[#71717a]">We automatically pull:</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Top repositories by stars', Icon: Star },
                      { label: 'Primary programming languages', Icon: Code2 },
                      { label: 'Public profile & bio', Icon: User },
                    ].map(({ label, Icon }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon size={12} className="text-[#F5A623]" />
                        <span className="text-xs font-mono text-[#a1a1aa]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-up">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Full Name</label>
                    <input type="text" value={manualData.fullName} onChange={e => setManualData({...manualData, fullName: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Role</label>
                    <input type="text" value={manualData.role} onChange={e => setManualData({...manualData, role: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="Video Editor" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Location</label>
                  <input type="text" value={manualData.location} onChange={e => setManualData({...manualData, location: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="San Francisco, CA" />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Skills (Comma Separated)</label>
                  <input type="text" value={manualData.skills} onChange={e => setManualData({...manualData, skills: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="Premiere Pro, After Effects, Figma" />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Bio</label>
                  <textarea value={manualData.bio} onChange={e => setManualData({...manualData, bio: e.target.value})} rows={3} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="Tell clients about your experience..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">LinkedIn URL</label>
                    <input type="url" value={manualData.linkedin} onChange={e => setManualData({...manualData, linkedin: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Portfolio URL</label>
                    <input type="url" value={manualData.portfolio} onChange={e => setManualData({...manualData, portfolio: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="https://mywork.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#71717a] mb-2">Video Reel / Work Sample (YouTube/Vimeo)</label>
                  <input type="url" value={manualData.workSample} onChange={e => setManualData({...manualData, workSample: e.target.value})} className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-sm font-mono focus:border-[#F5A623] outline-none" placeholder="https://youtube.com/watch?v=..." />
                </div>

                {error && <p className="text-xs font-mono text-[#f87171]">{error}</p>}

                <button
                  onClick={handleManualSubmit}
                  className="w-full px-5 py-4 text-sm font-mono font-medium flex items-center justify-center gap-2 bg-[#F5A623] text-[#09090b] transition-opacity hover:opacity-90"
                >
                  Generate Talent Card <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-[#22c55e]" />
                  <span className="text-xs font-mono tracking-widest uppercase text-[#71717a]">
                    Portfolio Generated
                  </span>
                </div>
                <h1 className="text-3xl font-serif font-medium text-[#fafafa]">
                  Looking sharp, {mode === 'github' ? ghData?.name?.split(' ')[0] : manualData.fullName.split(' ')[0]}.
                </h1>
              </div>
              <button onClick={() => setStep('form')}
                className="text-xs font-mono transition-colors text-[#71717a] hover:text-[#fafafa]">
                ← Edit
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* LEFT: Talent Card */}
              <div>
                <p className="text-xs font-mono tracking-widest uppercase mb-3 text-[#71717a]">
                  Your Talent Card
                </p>

                <div className="relative p-6 sm:p-8 overflow-hidden bg-[#0c0c0e] border border-[#27272a]">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10"
                    style={{ background: 'radial-gradient(circle at top right, #F5A623, transparent)' }} />

                  <div className="flex items-start gap-4 mb-6">
                    {mode === 'github' && ghData?.avatar_url ? (
                      <img src={ghData.avatar_url} alt={ghData.name} className="w-14 h-14 object-cover border border-[#27272a]" />
                    ) : (
                      <div className="w-14 h-14 bg-[#27272a] border border-[#3f3f46] flex items-center justify-center font-serif text-xl">
                        {manualData.fullName[0]?.toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-serif font-medium text-[#fafafa]">
                        {mode === 'github' ? ghData?.name : manualData.fullName}
                      </h2>
                      
                      {mode === 'github' ? (
                        <a href={ghData?.github_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-mono mt-1 transition-colors text-[#71717a] hover:text-[#F5A623]">
                          <Github size={10} /> @{ghData?.login}
                        </a>
                      ) : (
                        <p className="text-xs font-mono mt-1 text-[#71717a]">{manualData.role}</p>
                      )}

                      {mode === 'github' && ghData && (
                        <div className="flex items-center gap-4 mt-2 text-xs font-mono text-[#71717a]">
                          <span>{ghData.followers} followers</span>
                          <span>{ghData.public_repos} repos</span>
                          <span className="flex items-center gap-1">
                            <Star size={10} className="text-[#F5A623]" /> {ghData.total_stars}
                          </span>
                        </div>
                      )}
                      
                      {mode === 'manual' && manualData.location && (
                        <div className="flex items-center gap-1 mt-2 text-xs font-mono text-[#71717a]">
                           <MapPin size={10} /> {manualData.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio editable */}
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Add a short bio…"
                    rows={2}
                    className="w-full text-xs font-mono leading-relaxed bg-transparent resize-none focus:outline-none mb-5 text-[#a1a1aa] border-b border-[#27272a] pb-3"
                  />

                  {/* Skills */}
                  <div className="mb-5">
                    <p className="text-xs font-mono tracking-widest uppercase mb-2 text-[#52525b]">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(mode === 'github' ? ghData?.languages : manualData.skills.split(',').map(s=>s.trim()).filter(Boolean))?.slice(0, 6).map(skill => (
                        <span key={skill} className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 bg-[#18181b] border border-[#27272a] text-[#a1a1aa]">
                          {mode === 'github' && <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[skill] || '#71717a' }} />}
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Work Samples */}
                  {mode === 'github' && ghData ? (
                    <div>
                      <p className="text-xs font-mono tracking-widest uppercase mb-3 text-[#52525b]">Work</p>
                      <div className="space-y-2">
                        {ghData.top_repos.map(repo => (
                          <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-start justify-between p-3 transition-colors group bg-[#18181b] border border-[#27272a] hover:border-[#F5A623]">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-medium text-[#fafafa]">{repo.name}</span>
                                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#71717a]" />
                              </div>
                              {repo.description && <p className="text-xs font-mono mt-0.5 truncate text-[#71717a]">{repo.description}</p>}
                            </div>
                            <div className="flex items-center gap-3 ml-4 shrink-0">
                              {repo.language && <span className="text-xs font-mono text-[#52525b]">{repo.language}</span>}
                              <span className="flex items-center gap-1 text-xs font-mono text-[#71717a]"><Star size={10} /> {repo.stars}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    manualData.workSample && (
                       <div>
                          <p className="text-xs font-mono tracking-widest uppercase mb-3 text-[#52525b]">Featured Sample</p>
                          <a href={manualData.workSample} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 transition-colors bg-[#18181b] border border-[#27272a] hover:border-[#F5A623]">
                            <Video size={16} className="text-[#F5A623]" />
                            <span className="text-xs font-mono text-[#fafafa] truncate flex-1">{manualData.workSample}</span>
                            <ExternalLink size={12} className="text-[#71717a]" />
                          </a>
                       </div>
                    )
                  )}

                  {/* Card footer */}
                  <div className="mt-6 pt-4 flex items-center justify-between border-t border-[#27272a]">
                    <div className="flex items-center gap-1 text-xs font-mono text-[#F5A623]">
                      <Sparkles size={10} />
                      <span>Forge Verified</span>
                    </div>
                    <span className="text-xs font-mono text-[#52525b]">forge.dev/{mode === 'github' ? '@'+ghData?.login : 'talent'}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Publish settings */}
              <div className="space-y-5">
                <p className="text-xs font-mono tracking-widest uppercase text-[#71717a]">Final Details</p>

                {mode === 'github' && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-2 text-[#71717a]">
                      <Globe size={12} /> Live Project Link
                    </label>
                    <input
                      type="url"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      placeholder="https://your-project.vercel.app"
                      className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] text-[#fafafa] text-sm font-mono focus:outline-none focus:border-[#F5A623] transition-colors"
                    />
                  </div>
                )}

                {/* Checklist */}
                <div className="p-4 space-y-2 bg-[#18181b] border border-[#27272a]">
                  {[
                    { label: mode === 'github' ? 'GitHub repos fetched' : 'Profile structured', done: true },
                    { label: 'Skills listed', done: (mode === 'github' ? (ghData?.languages?.length || 0) : manualData.skills.length) > 0 },
                    { label: 'Bio written', done: bio.trim().length > 0 },
                    { label: 'Portfolio linked', done: portfolioLink.trim().length > 0 },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${done ? 'bg-[#22c55e20] border-[#22c55e]' : 'bg-[#27272a] border-[#3f3f46]'}`}>
                        {done && <CheckCircle2 size={10} className="text-[#22c55e]" />}
                      </div>
                      <span className={`text-xs font-mono ${done ? 'text-[#a1a1aa]' : 'text-[#52525b]'}`}>{label}</span>
                    </div>
                  ))}
                </div>

                {error && <p className="text-xs font-mono text-[#f87171]">{error}</p>}

                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full py-4 text-sm font-mono font-medium flex items-center justify-center gap-2 transition-all bg-[#fafafa] text-[#09090b] hover:bg-[#F5A623] disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {publishing ? 'Publishing…' : 'Publish My Talent Card'}
                </button>
                <p className="text-xs font-mono text-center text-[#52525b]">
                  Goes live instantly. Clients discover you by matching needs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
