'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase, Star, Clock, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, TrendingUp,
  Github, User, ArrowRight, Zap, MessageCircle, Send
} from 'lucide-react'

type Bid = {
  id: string
  status: string
  cover_letter: string
  proposed_budget: string
  created_at: string
  projects: {
    id: string
    title: string
    description: string
    budget: number
    timeline: string
    tech_stack: string[]
    status: string
    client_id: string
  }
}

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  client: { full_name: string; avatar_url: string }
}

type Profile = {
  id: string
  full_name: string
  avatar_url: string
  role: string
  bio: string
  skills: string[]
  github_url: string
  published: boolean
  average_rating: number
  total_reviews: number
}

const BID_STATUS = {
  pending: { label: 'Awaiting Response', color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
  accepted: { label: '✓ Accepted', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  rejected: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

export default function FreelancerDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // Chat state: keyed by project_id
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({})
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({})
  const [openChat, setOpenChat] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const stats = {
    totalBids: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    active: bids.filter(b => b.status === 'accepted' && b.projects?.status === 'in_progress').length,
    completed: bids.filter(b => b.status === 'accepted' && b.projects?.status === 'completed').length,
  }

  useEffect(() => {
    async function load() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) { 
          router.push('/auth/login')
          return 
        }
        setUser(authData.user)

        const [profileRes, bidsRes, reviewsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', authData.user.id).single(),
          supabase.from('bids').select('*, projects(*)').eq('student_id', authData.user.id).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*, client:profiles!client_id(full_name, avatar_url)').eq('freelancer_id', authData.user.id)
        ])

        if (profileRes.data?.role === 'client') {
          router.push('/dashboard/client')
          return
        }

        setProfile(profileRes.data)
        const bidsData = bidsRes.data || []
        setBids(bidsData)
        setReviews(reviewsRes.data || [])

        // Load messages for all active jobs
        const activeProjIds = bidsData
          .filter((b: any) => b.status === 'accepted' && b.projects?.status === 'in_progress')
          .map((b: any) => b.projects?.id)
          .filter(Boolean)

        if (activeProjIds.length > 0) {
          const messagesMap: Record<string, any[]> = {}
          await Promise.all(activeProjIds.map(async (pid: string) => {
            const { data } = await supabase
              .from('project_messages')
              .select('*, sender:profiles!sender_id(full_name, avatar_url)')
              .eq('project_id', pid)
              .order('created_at', { ascending: true })
            messagesMap[pid] = data || []
          }))
          setChatMessages(messagesMap)

          // Subscribe to realtime for all active projects
          activeProjIds.forEach((pid: string) => {
            supabase.channel(`dash_chat_${pid}`)
              .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'project_messages',
                filter: `project_id=eq.${pid}`
              }, async (payload) => {
                const { data: newMsg } = await supabase
                  .from('project_messages')
                  .select('*, sender:profiles!sender_id(full_name, avatar_url)')
                  .eq('id', payload.new.id)
                  .single()
                if (newMsg) {
                  setChatMessages(prev => ({
                    ...prev,
                    [pid]: [...(prev[pid] || []), newMsg]
                  }))
                }
              }).subscribe()
          })
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err)
        alert("Connection failed. Check if your Supabase project is active.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sendMessage = async (projectId: string) => {
    const content = (chatInputs[projectId] || '').trim()
    if (!content || !user) return
    setChatInputs(prev => ({ ...prev, [projectId]: '' }))
    await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: user.id,
      content
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#F5A623]" />
    </div>
  )

  const activeBids = bids.filter(b => b.status === 'accepted' && b.projects?.status === 'in_progress')
  const pendingBids = bids.filter(b => b.status === 'pending')
  const otherBids = bids.filter(b => b.status === 'rejected' || (b.status === 'accepted' && b.projects?.status === 'completed'))

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <div className="border-b border-[#27272a] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif font-medium text-[#fafafa]">forge.</Link>
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-sm font-mono text-[#a1a1aa] hover:text-[#fafafa] transition-colors">Browse Projects</Link>
          <Link href="/talent" className="text-sm font-mono text-[#a1a1aa] hover:text-[#fafafa] transition-colors">Explore Talent</Link>
          {profile?.avatar_url && <img src={profile.avatar_url} className="w-8 h-8 rounded-full border border-[#3f3f46]" />}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT: Profile sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile card */}
            <div className="bg-[#18181b] border border-[#27272a] p-6">
              <div className="flex items-center gap-4 mb-4">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-14 h-14 rounded-full border-2 border-[#3f3f46]" />
                  : <div className="w-14 h-14 rounded-full bg-[#27272a] flex items-center justify-center"><User size={20} className="text-[#71717a]" /></div>
                }
                <div>
                  <p className="font-serif font-medium text-[#fafafa]">{profile?.full_name || 'Freelancer'}</p>
                  <p className="text-xs font-mono text-[#71717a]">Freelancer</p>
                  {profile?.average_rating && profile.average_rating > 0 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} fill="#F5A623" className="text-[#F5A623]" />
                      <span className="text-xs font-mono text-[#F5A623]">{profile.average_rating.toFixed(1)}</span>
                      <span className="text-xs font-mono text-[#52525b]">({profile.total_reviews})</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {!profile?.published && (
                <div className="p-3 bg-[#F5A623]/10 border border-[#F5A623]/30 mb-4">
                  <p className="text-xs font-mono text-[#F5A623]">⚠ Profile not published yet. Clients can't see you.</p>
                </div>
              )}

              <p className="text-xs font-mono text-[#71717a] mb-4 line-clamp-3">{profile?.bio || 'No bio added yet.'}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile?.skills?.slice(0, 6).map(s => (
                  <span key={s} className="text-xs font-mono px-2 py-0.5 bg-[#09090b] border border-[#27272a] text-[#a1a1aa]">{s}</span>
                ))}
              </div>

              <div className="space-y-2">
                <Link href={`/profile/${profile?.id}`} className="flex items-center justify-between p-2.5 border border-[#27272a] hover:border-[#F5A623] transition-colors group">
                  <span className="text-xs font-mono text-[#a1a1aa] group-hover:text-[#F5A623]">View Public Profile</span>
                  <ArrowRight size={12} className="text-[#52525b] group-hover:text-[#F5A623]" />
                </Link>
                <Link href="/profile/setup" className="flex items-center justify-between p-2.5 border border-[#27272a] hover:border-[#F5A623] transition-colors group">
                  <span className="text-xs font-mono text-[#a1a1aa] group-hover:text-[#F5A623]">Edit Profile</span>
                  <ArrowRight size={12} className="text-[#52525b] group-hover:text-[#F5A623]" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[#18181b] border border-[#27272a] p-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Total Bids', value: stats.totalBids, color: '#a1a1aa' },
                { label: 'Pending', value: stats.pending, color: '#F5A623' },
                { label: 'Active Jobs', value: stats.active, color: '#22c55e' },
                { label: 'Completed', value: stats.completed, color: '#818cf8' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xs font-mono text-[#52525b] mb-1">{s.label}</p>
                  <p className="text-2xl font-serif font-medium" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="bg-[#18181b] border border-[#27272a] p-5">
              <p className="text-xs font-mono text-[#71717a] uppercase tracking-widest mb-3">Quick Actions</p>
              <div className="space-y-2">
                <Link href="/projects" className="flex items-center gap-2 p-2.5 border border-[#27272a] hover:border-[#F5A623] text-xs font-mono text-[#a1a1aa] hover:text-[#F5A623] transition-colors">
                  <Briefcase size={12} /> Browse Open Projects
                </Link>
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" className="flex items-center gap-2 p-2.5 border border-[#27272a] hover:border-[#F5A623] text-xs font-mono text-[#a1a1aa] hover:text-[#F5A623] transition-colors">
                    <Github size={12} /> View GitHub Profile
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome */}
            <div>
              <p className="text-sm font-mono text-[#a1a1aa] mb-1">Freelancer Dashboard</p>
              <h1 className="text-2xl font-serif font-medium text-[#fafafa]">
                Hey {profile?.full_name?.split(' ')[0] || 'there'} 👋
              </h1>
            </div>

            {/* Active Jobs with Inline Chat */}
            {activeBids.length > 0 && (
              <section>
                <h2 className="text-sm font-mono text-[#a1a1aa] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap size={12} className="text-[#22c55e]" /> Active Jobs ({activeBids.length})
                </h2>
                <div className="space-y-4">
                  {activeBids.map(bid => {
                    const pid = bid.projects?.id
                    const msgs = chatMessages[pid] || []
                    const isOpen = openChat === pid
                    return (
                      <div key={bid.id} className="bg-[#18181b] border border-[#22c55e]/40 overflow-hidden">
                        {/* Project Header */}
                        <div className="p-5 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30">✓ ACCEPTED</span>
                            </div>
                            <h3 className="font-serif font-medium text-[#fafafa] text-lg mb-1">{bid.projects?.title}</h3>
                            <p className="text-xs font-mono text-[#71717a] line-clamp-1">{bid.projects?.description}</p>
                            <p className="text-xs font-mono text-[#52525b] mt-2">Your Bid: <span className="text-[#fafafa]">{bid.proposed_budget}</span></p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Link
                              href={`/projects/${pid}/dashboard`}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#22c55e] text-[#09090b] text-xs font-mono font-bold hover:bg-[#16a34a] transition-colors"
                            >
                              <ChevronRight size={12} /> Workspace
                            </Link>
                            <button
                              onClick={() => setOpenChat(isOpen ? null : pid)}
                              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border transition-colors ${
                                isOpen ? 'border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10' : 'border-[#27272a] text-[#a1a1aa] hover:border-[#F5A623] hover:text-[#F5A623]'
                              }`}
                            >
                              <MessageCircle size={12} />
                              Chat {msgs.length > 0 && `(${msgs.length})`}
                            </button>
                          </div>
                        </div>

                        {/* Inline Chat Panel */}
                        {isOpen && (
                          <div className="border-t border-[#27272a]">
                            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-[#09090b]">
                              {msgs.length === 0 ? (
                                <p className="text-[10px] font-mono text-[#52525b] text-center mt-8 uppercase tracking-widest">No messages yet. Say hi!</p>
                              ) : (
                                msgs.map((msg: any) => {
                                  const isMe = msg.sender_id === user?.id
                                  return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                      <div className={`max-w-[80%] px-3 py-2 text-xs font-mono ${
                                        isMe ? 'bg-[#27272a] text-[#fafafa]' : 'bg-[#18181b] border border-[#27272a] text-[#a1a1aa]'
                                      }`}>
                                        {msg.content}
                                      </div>
                                      <span className="text-[9px] font-mono text-[#52525b] mt-0.5">
                                        {isMe ? 'You' : msg.sender?.full_name} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  )
                                })
                              )}
                              <div ref={chatEndRef} />
                            </div>
                            <form
                              onSubmit={(e) => { e.preventDefault(); sendMessage(pid) }}
                              className="flex gap-0 border-t border-[#27272a]"
                            >
                              <input
                                type="text"
                                value={chatInputs[pid] || ''}
                                onChange={(e) => setChatInputs(prev => ({ ...prev, [pid]: e.target.value }))}
                                placeholder="Message client..."
                                className="flex-1 bg-[#18181b] px-4 py-3 text-sm font-mono text-[#fafafa] placeholder-[#52525b] outline-none border-none"
                              />
                              <button
                                type="submit"
                                className="px-4 py-3 bg-[#F5A623] text-[#09090b] hover:bg-[#E09510] transition-colors"
                              >
                                <Send size={14} />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Pending Bids */}
            {pendingBids.length > 0 && (
              <section>
                <h2 className="text-sm font-mono text-[#a1a1aa] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={12} className="text-[#F5A623]" /> Pending Proposals ({pendingBids.length})
                </h2>
                <div className="space-y-3">
                  {pendingBids.map(bid => (
                    <div key={bid.id} className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-serif font-medium text-[#fafafa] mb-1 truncate">{bid.projects?.title}</h3>
                          <p className="text-xs font-mono text-[#71717a] line-clamp-1">{bid.cover_letter}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 border" style={{ color: BID_STATUS.pending.color, borderColor: BID_STATUS.pending.color, background: BID_STATUS.pending.bg }}>
                            {BID_STATUS.pending.label}
                          </span>
                          {bid.proposed_budget && <span className="text-xs font-mono text-[#52525b]">${bid.proposed_budget}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other Bids (Rejected or Closed) */}
            {otherBids.length > 0 && (
              <section>
                <h2 className="text-sm font-mono text-[#a1a1aa] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={12} className="text-[#71717a]" /> Archived / Closed ({otherBids.length})
                </h2>
                <div className="space-y-3">
                  {otherBids.map(bid => (
                    <div key={bid.id} className="bg-[#18181b] border border-[#27272a] p-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-serif font-medium text-[#fafafa] mb-1 truncate">{bid.projects?.title || 'Project Unavailable'}</h3>
                          <p className="text-xs font-mono text-[#52525b]">Status: {bid.status === 'rejected' ? 'Declined' : 'Closed'}</p>
                        </div>
                        {bid.status === 'accepted' && bid.projects?.status === 'completed' && (
                          <Link href={`/projects/${bid.projects.id}/dashboard`} className="text-[10px] font-mono text-[#F5A623] hover:underline">
                            View Work
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {bids.length === 0 && (
              <div className="py-24 text-center border border-[#27272a] border-dashed">
                <Briefcase size={32} className="mx-auto text-[#3f3f46] mb-4" />
                <p className="text-sm font-mono text-[#71717a] mb-4">You haven't bid on any projects yet.</p>
                <Link href="/projects" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] text-[#0D0D0D] text-sm font-mono font-medium hover:bg-[#E09510] transition-colors">
                  Browse Open Projects <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
