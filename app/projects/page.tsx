'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, Clock, DollarSign, Layers,
  CheckCircle2, Loader2, Sparkles, Users, ExternalLink
} from 'lucide-react'

type Milestone = { title: string; description: string; duration: string }

type Project = {
  id: string
  created_at: string
  title: string
  description: string
  budget: number
  milestones: Milestone[]
  status: string
  client_id: string
}

type Bid = {
  id: string
  project_id: string
  student_id: string
  proposal_text: string
  bid_amount: number
  status: string
  created_at: string
  profiles?: { full_name: string; avatar_url: string; github_url: string; skills: string[] }
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── BID MODAL ──────────────────────────────────────────────────────────────
function BidModal({
  project, onClose, onSubmit, loading,
}: {
  project: Project
  onClose: () => void
  onSubmit: (proposal: string, amount: number) => void
  loading: boolean
}) {
  const [proposal, setProposal] = useState('')
  const [amount, setAmount] = useState(project.budget ? Math.round(project.budget * 0.9) : 500)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-lg bg-white border-2 border-[#8A8A8A] z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-[#8A8A8A] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-serif font-medium text-[#0D0D0D]">Apply to Project</h3>
            <p className="text-xs font-sans text-[#8A8A8A] mt-0.5 truncate max-w-xs">{project.title}</p>
          </div>
          <button onClick={onClose} className="text-[#8A8A8A] hover:text-[#0D0D0D] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Proposal */}
          <div>
            <label className="block text-xs font-sans text-[#8A8A8A] tracking-widest uppercase mb-2">
              Your Proposal (Optional)
            </label>
            <textarea
              id="proposal-input"
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="One sentence about why you're the right fit…"
              rows={3}
              className="w-full px-4 py-3 border-2 border-[#8A8A8A] font-sans text-sm text-[#0D0D0D] placeholder-[#8A8A8A] resize-none focus:outline-none focus:border-[#0D0D0D] transition-colors"
            />
            <p className="mt-1 text-xs font-sans text-[#8A8A8A]">
              Your Talent Card — GitHub repos, stack, and bio — is attached automatically.
            </p>
          </div>

          {/* Bid amount */}
          <div>
            <label className="block text-xs font-sans text-[#8A8A8A] tracking-widest uppercase mb-2">
              Your Bid Amount ($)
            </label>
            <div className="flex items-center border-2 border-[#8A8A8A] focus-within:border-[#0D0D0D] transition-colors">
              <span className="px-4 py-3 text-sm font-sans text-[#8A8A8A] border-r-2 border-[#8A8A8A]">$</span>
              <input
                id="bid-amount-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 px-4 py-3 font-sans text-sm text-[#0D0D0D] bg-white focus:outline-none"
              />
            </div>
            {project.budget && (
              <p className="mt-1 text-xs font-sans text-[#8A8A8A]">
                Client budget: ${project.budget.toLocaleString()}
              </p>
            )}
          </div>

          <button
            id="submit-bid-btn"
            onClick={() => onSubmit(proposal, amount)}
            disabled={loading}
            className="w-full py-4 flex items-center justify-center gap-2 font-sans text-sm font-medium transition-all"
            style={{ background: '#0D0D0D', color: '#fafafa' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Submitting…' : 'Send My Talent Card + Bid'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── CLIENT BIDS VIEW ────────────────────────────────────────────────────────
function ClientBidsPanel({
  project, onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bids')
      .select('*, profiles(full_name, avatar_url, github_url, skills)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBids((data as Bid[]) || []); setLoading(false) })

    const channel = supabase
      .channel(`bids:${project.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids',
        filter: `project_id=eq.${project.id}` }, (p) => {
        setBids(prev => [p.new as Bid, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [project.id])

  const acceptBid = async (bid: Bid) => {
    setAccepting(bid.id)
    const supabase = createClient()
    await Promise.all([
      supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id),
      supabase.from('bids').update({ status: 'rejected' })
        .eq('project_id', project.id).neq('id', bid.id),
      supabase.from('projects').update({ status: 'in-progress' }).eq('id', project.id),
    ])
    setBids(prev => prev.map(b =>
      b.id === bid.id ? { ...b, status: 'accepted' } :
      { ...b, status: b.status === 'pending' ? 'rejected' : b.status }
    ))
    setAccepting(null)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/50"
        onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md h-full bg-white border-l-2 border-[#8A8A8A] overflow-y-auto z-10"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      >
        <div className="px-6 py-4 border-b-2 border-[#8A8A8A] flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 className="text-sm font-serif font-medium text-[#0D0D0D]">Incoming Bids</h3>
            <p className="text-xs font-sans text-[#8A8A8A]">{project.title}</p>
          </div>
          <button onClick={onClose} className="text-[#8A8A8A] hover:text-[#0D0D0D]">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#8A8A8A]" size={20} />
            </div>
          )}

          {!loading && bids.length === 0 && (
            <div className="text-center py-12">
              <Users size={24} className="mx-auto mb-3 text-[#8A8A8A]" />
              <p className="text-sm font-sans text-[#8A8A8A]">No bids yet.</p>
              <p className="text-xs font-sans text-[#8A8A8A] mt-1">Developers will apply shortly.</p>
            </div>
          )}

          <AnimatePresence>
            {bids.map((bid) => (
              <motion.div key={bid.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="border-2 p-4 transition-colors"
                style={{
                  borderColor: bid.status === 'accepted' ? '#22c55e' :
                    bid.status === 'rejected' ? '#8A8A8A' : '#8A8A8A'
                }}
              >
                {/* Bidder */}
                <div className="flex items-start gap-3 mb-3">
                  {bid.profiles?.avatar_url && (
                    <img src={bid.profiles.avatar_url} alt="" className="w-9 h-9 object-cover border border-[#8A8A8A]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-serif font-medium text-[#0D0D0D]">
                        {bid.profiles?.full_name || 'Developer'}
                      </span>
                      {bid.status === 'accepted' && (
                        <span className="flex items-center gap-1 text-xs font-sans text-green-600">
                          <CheckCircle2 size={10} /> Accepted
                        </span>
                      )}
                      {bid.status === 'rejected' && (
                        <span className="text-xs font-sans text-[#8A8A8A]">Rejected</span>
                      )}
                    </div>
                    {bid.profiles?.github_url && (
                      <a href={bid.profiles.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">
                        <ExternalLink size={10} /> GitHub Profile
                      </a>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {bid.profiles?.skills?.length ? (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bid.profiles.skills.slice(0, 4).map(s => (
                      <span key={s} className="text-xs font-sans px-2 py-0.5 bg-[#F5F4F0] border border-[#8A8A8A]">{s}</span>
                    ))}
                  </div>
                ) : null}

                {/* Proposal */}
                {bid.proposal_text && (
                  <p className="text-xs font-sans text-[#8A8A8A] mb-3 leading-relaxed italic">
                    &ldquo;{bid.proposal_text}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-medium text-[#0D0D0D]">
                    ${bid.bid_amount?.toLocaleString()}
                  </span>
                  {bid.status === 'pending' && (
                    <button
                      id={`accept-bid-${bid.id}`}
                      onClick={() => acceptBid(bid)}
                      disabled={accepting === bid.id}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-medium transition-all disabled:opacity-50"
                      style={{ background: '#0D0D0D', color: '#fafafa' }}
                    >
                      {accepting === bid.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                      Accept
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── MAIN FEED ───────────────────────────────────────────────────────────────
function ProjectsFeed() {
  const searchParams = useSearchParams()
  const justPosted = searchParams.get('posted')

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [myBids, setMyBids] = useState<Set<string>>(new Set())
  const [bidProject, setBidProject] = useState<Project | null>(null)
  const [bidsProject, setBidsProject] = useState<Project | null>(null)
  const [bidLoading, setBidLoading] = useState(false)
  const [newId, setNewId] = useState<string | null>(justPosted)

  const fetchProjects = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects').select('*').eq('status', 'open')
      .order('created_at', { ascending: false }).limit(20)
    if (data) setProjects(data as Project[])
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ id: user.id })
        supabase.from('bids').select('project_id').eq('student_id', user.id)
          .then(({ data }) => setMyBids(new Set((data || []).map((b: { project_id: string }) => b.project_id))))
      }
    })
    fetchProjects()

    const channel = supabase.channel('realtime:projects')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, (p) => {
        const proj = p.new as Project
        setProjects(prev => [proj, ...prev])
        setNewId(proj.id)
        setTimeout(() => setNewId(null), 5000)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchProjects])

  const submitBid = async (proposal: string, amount: number) => {
    if (!bidProject || !user) return
    setBidLoading(true)
    const supabase = createClient()
    await supabase.from('bids').insert({
      project_id: bidProject.id, student_id: user.id,
      proposal_text: proposal, bid_amount: amount, status: 'pending',
    })
    setMyBids(prev => new Set([...prev, bidProject.id]))
    setBidLoading(false)
    setBidProject(null)
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Navbar */}
      <div className="border-b-2 border-[#8A8A8A] px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-40">
        <Link href="/" className="text-xl font-serif font-medium text-[#0D0D0D]">forge.</Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-sans text-[#8A8A8A]">Live</span>
          </div>
          <Link href="/post-project"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-medium transition-all"
            style={{ background: '#F5A623', color: '#0D0D0D' }}>
            <Sparkles size={12} /> Post a Project
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium text-[#0D0D0D]">Open Projects</h1>
            <p className="text-sm font-sans text-[#8A8A8A] mt-1">AI-scoped. Clear milestones. Real budgets.</p>
          </div>
          <span className="text-xs font-sans text-[#8A8A8A]">{projects.length} open</span>
        </div>

        {/* Posted confirmation */}
        <AnimatePresence>
          {justPosted && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 px-5 py-4 border-2 border-[#F5A623] bg-white flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#F5A623]" />
              <span className="text-sm font-sans text-[#0D0D0D]">
                <strong>Your project is live.</strong> Developers will apply soon.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border-2 border-[#8A8A8A] p-6 bg-white animate-pulse">
                <div className="h-5 bg-[#F5F4F0] w-2/3 mb-3 rounded" />
                <div className="h-3 bg-[#F5F4F0] w-full mb-2 rounded" />
                <div className="h-3 bg-[#F5F4F0] w-4/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-16 border-2 border-[#8A8A8A] bg-white">
            <p className="text-sm font-sans text-[#8A8A8A] mb-4">No open projects yet.</p>
            <Link href="/post-project"
              className="px-6 py-3 text-sm font-sans font-medium transition-all"
              style={{ background: '#F5A623', color: '#0D0D0D' }}>
              Post the First Project →
            </Link>
          </div>
        )}

        {/* Project cards */}
        <motion.div className="space-y-4" layout>
          <AnimatePresence initial={false}>
            {projects.map((project) => {
              const isNew = newId === project.id
              const isOwner = user?.id === project.client_id
              const hasBid = myBids.has(project.id)

              return (
                <motion.div key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                  className="border-2 p-6 bg-white transition-colors duration-300"
                  style={{ borderColor: isNew ? '#F5A623' : '#8A8A8A' }}
                >
                  {isNew && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
                      <span className="text-xs font-sans text-[#F5A623]">Just posted</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-lg font-serif font-medium text-[#0D0D0D] leading-snug">{project.title}</h2>
                    <span className="text-xs font-sans text-[#8A8A8A] shrink-0 mt-0.5">
                      {timeAgo(project.created_at)}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm font-sans text-[#8A8A8A] mb-4 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-5 mb-4 text-xs font-sans text-[#8A8A8A]">
                    {project.budget && (
                      <span className="flex items-center gap-1.5">
                        <DollarSign size={11} /> ${project.budget.toLocaleString()}
                      </span>
                    )}
                    {project.milestones?.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Layers size={11} /> {project.milestones.length} milestones
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> {timeAgo(project.created_at)}
                    </span>
                  </div>

                  {/* Milestones preview */}
                  {project.milestones?.length > 0 && (
                    <div className="mb-5 border border-[#8A8A8A] divide-y divide-[#8A8A8A]">
                      {project.milestones.slice(0, 2).map((m, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                          <div className="w-4 h-4 border border-[#8A8A8A] flex items-center justify-center shrink-0">
                            <span className="text-xs font-sans">{i + 1}</span>
                          </div>
                          <span className="text-xs font-sans text-[#0D0D0D] flex-1 truncate">{m.title}</span>
                          <span className="text-xs font-sans text-[#8A8A8A] shrink-0">{m.duration}</span>
                        </div>
                      ))}
                      {project.milestones.length > 2 && (
                        <div className="px-4 py-2 text-xs font-sans text-[#8A8A8A]">
                          +{project.milestones.length - 2} more milestones
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {isOwner ? (
                      <button
                        id={`view-bids-${project.id}`}
                        onClick={() => setBidsProject(project)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#0D0D0D] text-xs font-sans font-medium text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white transition-all"
                      >
                        <Users size={12} /> View Bids
                      </button>
                    ) : hasBid ? (
                      <div className="flex-1 flex items-center gap-2 py-3 text-xs font-sans text-green-600">
                        <CheckCircle2 size={12} /> Talent Card sent
                      </div>
                    ) : user ? (
                      <button
                        id={`apply-btn-${project.id}`}
                        onClick={() => setBidProject(project)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 border-2 text-xs font-sans font-medium transition-all"
                        style={{ borderColor: '#0D0D0D', color: '#0D0D0D' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#0D0D0D'; e.currentTarget.style.color = '#fafafa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#0D0D0D' }}
                      >
                        <ChevronRight size={12} /> Apply — Send Talent Card
                      </button>
                    ) : (
                      <Link href="/auth/login"
                        className="flex-1 flex items-center justify-center py-3 border-2 border-[#8A8A8A] text-xs font-sans text-[#8A8A8A] hover:border-[#0D0D0D] hover:text-[#0D0D0D] transition-all">
                        Sign in to Apply
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bid Modal */}
      <AnimatePresence>
        {bidProject && (
          <BidModal
            project={bidProject}
            onClose={() => setBidProject(null)}
            onSubmit={submitBid}
            loading={bidLoading}
          />
        )}
      </AnimatePresence>

      {/* Client Bids Panel */}
      <AnimatePresence>
        {bidsProject && (
          <ClientBidsPanel
            project={bidsProject}
            onClose={() => setBidsProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProjectsPage() {
  return <Suspense><ProjectsFeed /></Suspense>
}
