'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase, Users, Star, Clock, Plus, ChevronRight,
  TrendingUp, CheckCircle2, AlertCircle, Loader2,
  Eye, DollarSign, MessageCircle, Send, Search
} from 'lucide-react'

type Project = {
  id: string
  title: string
  description: string
  budget: number
  timeline: string
  tech_stack: string[]
  status: string
  created_at: string
  bid_count?: number
}

type Profile = {
  full_name: string
  avatar_url: string
  role: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  in_progress: { label: 'In Progress', color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
  completed: { label: 'Completed', color: '#a1a1aa', bg: 'rgba(161,161,170,0.1)' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

export default function ClientDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all')
  const [search, setSearch] = useState('')

  // Chat state keyed by project_id
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({})
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({})
  const [openChat, setOpenChat] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const stats = {
    total: projects.length,
    open: projects.filter(p => p.status === 'open').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const [profileRes, projectsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single(),
        supabase.from('projects').select('*, bids(count)').eq('client_id', user.id).order('created_at', { ascending: false })
      ])

      if (profileRes.data?.role !== 'client') {
        router.push('/dashboard/freelancer')
        return
      }

      setProfile(profileRes.data)
      const projData = (projectsRes.data || []).map((p: any) => ({
        ...p,
        bid_count: p.bids?.[0]?.count ?? 0
      }))
      setProjects(projData)

      // Load chat for in-progress projects
      const activeProjIds = projData
        .filter((p: any) => p.status === 'in_progress')
        .map((p: any) => p.id)

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

        activeProjIds.forEach((pid: string) => {
          supabase.channel(`client_chat_${pid}`)
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

      setLoading(false)
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

  const filtered = projects.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#F5A623]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <div className="border-b border-[#27272a] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif font-medium text-[#fafafa]">forge.</Link>
        <div className="flex items-center gap-4">
          <Link href="/talent" className="text-sm font-mono text-[#a1a1aa] hover:text-[#fafafa] transition-colors">Browse Talent</Link>
          <Link href="/post-project" className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-[#0D0D0D] text-sm font-mono font-medium hover:bg-[#E09510] transition-colors">
            <Plus size={14} /> Post Project
          </Link>
          {profile?.avatar_url && <img src={profile.avatar_url} className="w-8 h-8 rounded-full border border-[#3f3f46]" />}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-sm font-mono text-[#a1a1aa] mb-1">Client Dashboard</p>
          <h1 className="text-3xl font-serif font-medium text-[#fafafa]">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Client'} 👋
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Projects', value: stats.total, icon: Briefcase, color: '#a1a1aa' },
            { label: 'Open (Hiring)', value: stats.open, icon: AlertCircle, color: '#22c55e' },
            { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: '#F5A623' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: '#818cf8' },
          ].map(s => (
            <div key={s.label} className="bg-[#18181b] border border-[#27272a] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono text-[#71717a]">{s.label}</p>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <p className="text-3xl font-serif font-medium" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 pr-4 py-2 bg-[#18181b] border border-[#27272a] text-sm font-mono text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#F5A623] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'open', 'in_progress', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-mono transition-colors border ${
                  filter === f
                    ? 'bg-[#F5A623] text-[#0D0D0D] border-[#F5A623]'
                    : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Projects list */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center border border-[#27272a] border-dashed">
            <Briefcase size={32} className="mx-auto text-[#3f3f46] mb-4" />
            <p className="text-sm font-mono text-[#71717a] mb-4">
              {projects.length === 0 ? "You haven't posted any projects yet." : "No projects match your filter."}
            </p>
            {projects.length === 0 && (
              <Link href="/post-project" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] text-[#0D0D0D] text-sm font-mono font-medium hover:bg-[#E09510] transition-colors">
                <Plus size={14} /> Post Your First Project
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(project => {
              const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG.open
              return (
                <div key={project.id} className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-base font-serif font-medium text-[#fafafa] truncate">{project.title}</h3>
                        <span
                          className="text-xs font-mono px-2 py-0.5 border"
                          style={{ color: sc.color, borderColor: sc.color, background: sc.bg }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-[#71717a] line-clamp-2 mb-3">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs font-mono text-[#52525b]">
                        {project.budget && <span className="flex items-center gap-1"><DollarSign size={11} />${project.budget}</span>}
                        {project.timeline && <span className="flex items-center gap-1"><Clock size={11} />{project.timeline}</span>}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${project.bid_count && project.bid_count > 0 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' : 'text-[#52525b]'}`}>
                          <Users size={11} />{project.bid_count} {project.bid_count === 1 ? 'Proposal' : 'Proposals'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-xs font-mono text-[#fafafa] transition-colors"
                      >
                        <Eye size={12} /> View Bids
                      </Link>
                      {project.status === 'in_progress' && (
                          <>
                            <Link
                              href={`/projects/${project.id}/dashboard`}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#F5A623] text-[#0D0D0D] text-xs font-mono font-medium hover:bg-[#E09510] transition-colors"
                            >
                              <ChevronRight size={12} /> Dashboard
                            </Link>
                            <button
                              onClick={() => setOpenChat(openChat === project.id ? null : project.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border transition-colors ${
                                openChat === project.id ? 'border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10' : 'border-[#27272a] text-[#a1a1aa] hover:border-[#F5A623] hover:text-[#F5A623]'
                              }`}
                            >
                              <MessageCircle size={12} /> Chat
                              {(chatMessages[project.id]?.length || 0) > 0 && (
                                <span className="ml-1 text-[9px] bg-[#F5A623] text-[#09090b] px-1 rounded-full">{chatMessages[project.id].length}</span>
                              )}
                            </button>
                          </>
                        )}
                    </div>
                  </div>

                  {project.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#27272a]">
                      {project.tech_stack.slice(0, 5).map(t => (
                        <span key={t} className="text-xs font-mono px-2 py-0.5 bg-[#09090b] border border-[#27272a] text-[#a1a1aa]">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Inline Chat for In-Progress projects */}
                  {project.status === 'in_progress' && openChat === project.id && (
                    <div className="mt-4 border border-[#27272a] overflow-hidden">
                      <div className="px-4 py-2 bg-[#1c1c1f] border-b border-[#27272a]">
                        <p className="text-[10px] font-mono text-[#a1a1aa] uppercase tracking-widest">💬 Chat with Freelancer</p>
                      </div>
                      <div className="h-52 overflow-y-auto p-3 space-y-3 bg-[#09090b]">
                        {(chatMessages[project.id] || []).length === 0 ? (
                          <p className="text-[10px] font-mono text-[#52525b] text-center mt-8 uppercase tracking-widest">No messages yet. Start the conversation.</p>
                        ) : (
                          (chatMessages[project.id] || []).map((msg: any) => {
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
                        onSubmit={(e) => { e.preventDefault(); sendMessage(project.id) }}
                        className="flex border-t border-[#27272a]"
                      >
                        <input
                          type="text"
                          value={chatInputs[project.id] || ''}
                          onChange={(e) => setChatInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                          placeholder="Message freelancer..."
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
        )}
      </div>
    </div>
  )
}
