'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [project, setProject] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedBudget, setProposedBudget] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profileData)
      }

      // Fetch Project
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*, client:profiles!client_id(full_name, avatar_url, role, bio, location, average_rating, total_reviews, created_at)')
        .eq('id', id)
        .single()
        
      if (projError) {
        console.error(projError)
        setLoading(false)
        return
      }
      setProject(projData)

      // Fetch Bids
      if (user) {
        // If owner, fetch all bids. If freelancer, fetch only their bid.
        let bidQuery = supabase
          .from('bids')
          .select('*, profiles!student_id(full_name, avatar_url, skills, average_rating, total_reviews)')
          .eq('project_id', id)
        
        if (projData.client_id !== user.id) {
          bidQuery = bidQuery.eq('student_id', user.id)
        }
        
        const { data: bidsData, error: bidError } = await bidQuery
        if (bidError) {
          const details = Object.entries(bidError).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' | ');
          console.error("Detailed Bids Fetch Error:", details)
        }
        if (bidsData) setBids(bidsData)
      }
      
      setLoading(false)
    }
    loadData()
  }, [id])

  const submitBid = async () => {
    if (!coverLetter || !proposedBudget) return
    setSubmitting(true)
    const supabase = createClient()
    const { error: bidError } = await supabase.from('bids').insert({
      project_id: id,
      student_id: user.id,
      cover_letter: coverLetter,
      proposed_budget: proposedBudget
    })
    
    if (bidError) {
      console.error("Bid Submission Error:", bidError)
      alert(`Failed to send proposal: ${bidError.message}`)
      setSubmitting(false)
      return
    }
    
    // Refresh bids
    const { data } = await supabase.from('bids').select('*').eq('project_id', id).eq('student_id', user.id)
    if (data) setBids(data)
    setSubmitting(false)
  }

  const rejectBid = async (bidId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('bids').update({ status: 'rejected' }).eq('id', bidId)
    if (!error) {
      setBids(prev => prev.filter(b => b.id !== bidId))
    }
  }

  const acceptBid = async (bid: any) => {
    const supabase = createClient()
    // 1. Accept Bid
    await supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id)
    // 2. Reject others
    await supabase.from('bids').update({ status: 'rejected' }).eq('project_id', id).neq('id', bid.id)
    
    // 3. Mark project in progress
    await supabase.from('projects').update({ status: 'in_progress' }).eq('id', id)

    // 4. Initialize milestones table from project.milestones JSON
    if (project.milestones && Array.isArray(project.milestones)) {
      const milestonesToInsert = project.milestones.map((m: any) => ({
        project_id: id,
        title: m.title,
        description: m.description,
        status: 'pending'
      }))
      await supabase.from('milestones').insert(milestonesToInsert)
    }
    
    router.push(`/projects/${id}/dashboard`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F5A623]" size={32} />
      </div>
    )
  }

  if (!project) return <div className="text-white p-8">Project not found</div>

  const isOwner = user?.id === project.client_id
  const hasBid = bids.some(b => b.student_id === user?.id)
  const acceptedBid = bids.find(b => b.status === 'accepted')
  
  if (acceptedBid || project.status === 'in_progress' || project.status === 'completed') {
    // If project is already active, direct users to the dashboard instead
    if (isOwner || acceptedBid?.student_id === user?.id) {
       router.push(`/projects/${id}/dashboard`)
       return null
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      <div className="border-b border-[#27272a] px-6 py-4 sticky top-0 bg-[#09090b] z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/projects" className="flex items-center gap-2 text-sm font-mono text-[#71717a] hover:text-[#F5A623] transition-colors">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <span className="text-xs font-mono tracking-widest text-[#F5A623] uppercase">Project Details</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border font-mono ${
                project.status === 'open' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                project.status === 'in_progress' ? 'text-blue-500 border-blue-500/30 bg-blue-500/10' :
                'text-[#71717a] border-[#27272a] bg-[#18181b]'
              }`}>
                {project.status}
              </span>
              <h1 className="text-3xl font-serif">{project.title}</h1>
            </div>
            
            <div className="flex items-center gap-6 py-4 border-y border-[#27272a]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-1">Budget</p>
                <p className="text-sm font-mono text-[#F5A623]">{project.budget || 'Negotiable'}</p>
              </div>
              <div className="w-px h-8 bg-[#27272a]" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-1">Timeline</p>
                <p className="text-sm font-mono">{project.timeline || 'TBD'}</p>
              </div>
              <div className="w-px h-8 bg-[#27272a]" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#71717a] mb-1">Client</p>
                <p className="text-sm font-mono">{project.client?.full_name || 'Anonymous'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-mono tracking-widest uppercase text-[#71717a]">Description</h3>
            <div className="p-6 bg-[#18181b] border border-[#27272a] font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {project.description}
            </div>
          </div>

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div>
              <h3 className="text-xs font-mono tracking-widest uppercase text-[#71717a] mb-4">Required Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech: string) => (
                  <span key={tech} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#a1a1aa] hover:border-[#F5A623] transition-colors cursor-default">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.milestones && project.milestones.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-mono tracking-widest uppercase text-[#71717a]">Project Milestones</h3>
              <div className="border border-[#27272a] divide-y divide-[#27272a]">
                {project.milestones.map((m: any, i: number) => (
                  <div key={i} className="p-4 flex gap-4 bg-[#18181b]/50">
                    <div className="w-6 h-6 border border-[#F5A623] text-[#F5A623] flex items-center justify-center shrink-0 text-[10px] font-mono">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-[10px] font-mono text-[#71717a]">{m.duration}</p>
                      </div>
                      <p className="text-xs font-mono text-[#71717a]">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* CLIENT VIEW: See Bids */}
          {isOwner && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif border-b border-[#27272a] pb-2">Proposals Received</h3>
              {bids.length === 0 ? (
                <p className="text-sm font-mono text-[#71717a]">No bids yet.</p>
              ) : (
                bids.map(bid => (
                  <div key={bid.id} className="p-5 bg-[#18181b] border border-[#27272a] space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#27272a] rounded-full overflow-hidden border border-[#3f3f46]">
                          {bid.profiles?.avatar_url && <img src={bid.profiles.avatar_url} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{bid.profiles?.full_name}</div>
                          <div className="text-[10px] font-mono text-[#F5A623] flex items-center gap-1">
                            <span>★ {bid.profiles?.average_rating || '5.0'}</span>
                            <span className="text-[#52525b]">({bid.profiles?.total_reviews || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href={`/profile/${bid.student_id}`}
                        className="text-[10px] font-mono text-[#71717a] hover:text-[#F5A623] border border-[#27272a] px-2 py-1 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>

                    {bid.profiles?.skills && bid.profiles.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {bid.profiles.skills.slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] font-mono px-2 py-0.5 bg-[#09090b] text-[#a1a1aa] border border-[#27272a]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-4 bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#a1a1aa] italic leading-relaxed">
                      "{bid.cover_letter}"
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-mono text-[#fafafa] font-bold">
                        {bid.proposed_budget}
                      </div>
                      <div className="flex flex-1 gap-2">
                        <button 
                          onClick={() => rejectBid(bid.id)}
                          className="px-3 py-2.5 border border-red-500/30 text-red-500 text-xs font-mono hover:bg-red-500/10 transition-all"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => acceptBid(bid)}
                          className="flex-1 py-2.5 bg-[#F5A623] text-[#09090b] text-xs font-mono font-bold hover:bg-[#E09510] transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} /> Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FREELANCER VIEW: Submit Bid */}
          {!isOwner && user && profile?.role === 'student' && !hasBid && (
            <div className="p-6 bg-[#18181b] border border-[#27272a] space-y-4">
              <h3 className="text-lg font-serif">Submit Proposal</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-[#71717a] mb-1">Proposed Budget</label>
                  <input 
                    type="text" 
                    value={proposedBudget}
                    onChange={e => setProposedBudget(e.target.value)}
                    placeholder="$500" 
                    className="w-full bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#71717a] mb-1">Cover Letter</label>
                  <textarea 
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    rows={4} 
                    className="w-full bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none" 
                    placeholder="Why are you the best fit for this project?"
                  />
                </div>
                <button 
                  onClick={submitBid}
                  disabled={submitting || !coverLetter || !proposedBudget}
                  className="w-full py-3 bg-[#F5A623] text-[#09090b] text-sm font-mono font-bold hover:bg-[#E09510] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    'Send Proposal'
                  )}
                </button>
              </div>
            </div>
          )}

          {!isOwner && hasBid && (
            <div className="p-6 bg-[#18181b] border border-[#F5A623] text-center space-y-2">
              <CheckCircle className="mx-auto text-[#F5A623]" size={24} />
              <h3 className="font-serif text-lg">Proposal Submitted</h3>
              <p className="text-xs font-mono text-[#71717a]">Waiting for client response...</p>
            </div>
          )}

          {/* ABOUT THE CLIENT */}
          <div className="p-6 bg-[#18181b] border border-[#27272a] space-y-6">
            <h3 className="text-xs font-mono tracking-widest uppercase text-[#71717a]">About the Client</h3>
            <div className="flex items-center gap-4">
              {project.client?.avatar_url ? (
                <img src={project.client.avatar_url} className="w-12 h-12 rounded-full border border-[#27272a] object-cover" />
              ) : (
                <div className="w-12 h-12 bg-[#27272a] flex items-center justify-center font-serif text-xl border border-[#3f3f46]">
                  {project.client?.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{project.client?.full_name}</p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#F5A623]">
                  <span>★ {project.client?.average_rating || '5.0'}</span>
                  <span className="text-[#52525b]">({project.client?.total_reviews || 0} reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {project.client?.location && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
                  <span className="text-[#52525b]">Location:</span> {project.client.location}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
                <span className="text-[#52525b]">Member since:</span> {new Date(project.client?.created_at).toLocaleDateString()}
              </div>
            </div>

            {project.client?.bio && (
              <p className="text-xs font-mono text-[#71717a] italic leading-relaxed border-t border-[#27272a] pt-4">
                "{project.client.bio}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
