'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ArrowLeft, CheckCircle, Plus, Upload, Star } from 'lucide-react'

export default function ProjectDashboardPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [project, setProject] = useState<any>(null)
  const [bid, setBid] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // New Milestone Form (Client)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('')
  
  // Submit Work (Freelancer)
  const [submitLink, setSubmitLink] = useState('')
  const [workDescription, setWorkDescription] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  // Chat
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Payment (Client)
  const [paymentLink, setPaymentLink] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  // Review (Client)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [finishing, setFinishing] = useState(false)

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    // Fetch Project
    const { data: projData, error: projError } = await supabase
      .from('projects')
      .select('*, client:profiles!client_id(full_name)')
      .eq('id', id)
      .single()
      
    if (projError) return
    setProject(projData)

    // Fetch Accepted Bid
    const { data: bidData } = await supabase
      .from('bids')
      .select('*, student:profiles!student_id(full_name, avatar_url)')
      .eq('project_id', id)
      .eq('status', 'accepted')
      .single()
      
    setBid(bidData)

    // Fetch Milestones
    const { data: msData } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
      
    setMilestones(msData || [])

    // Fetch Messages
    const { data: msgData } = await supabase
      .from('project_messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url)')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    
    setMessages(msgData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    // Realtime subscription for messages
    const supabase = createClient()
    const channel = supabase
      .channel(`project_chat_${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${id}`
      }, async (payload) => {
        // Fetch full message with sender info
        const { data: newMsg } = await supabase
          .from('project_messages')
          .select('*, sender:profiles!sender_id(full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single()
        
        if (newMsg) {
          setMessages(prev => [...prev, newMsg])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return
    setSendingMessage(true)
    const supabase = createClient()
    const { error } = await supabase.from('project_messages').insert({
      project_id: id,
      sender_id: user.id,
      content: newMessage.trim()
    })
    if (!error) setNewMessage('')
    setSendingMessage(false)
  }

  const addMilestone = async () => {
    if (!newMilestoneTitle) return
    const supabase = createClient()
    await supabase.from('milestones').insert({
      project_id: id,
      title: newMilestoneTitle,
      description: newMilestoneDesc,
      status: 'pending'
    })
    setNewMilestoneTitle('')
    setNewMilestoneDesc('')
    loadData()
  }

  const submitMilestoneWork = async (msId: string) => {
    if (!submitLink || !workDescription) return
    const supabase = createClient()
    await supabase.from('milestones').update({
      status: 'review',
      submitted_work: submitLink,
      work_description: workDescription
    }).eq('id', msId)
    setSubmitLink('')
    setWorkDescription('')
    setSubmittingId(null)
    loadData()
  }

  const updateMilestoneStatus = async (msId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('milestones').update({
      status: newStatus
    }).eq('id', msId)
    loadData()
  }

  const approveAndPayMilestone = async (msId: string) => {
    if (!paymentLink || !amountPaid) {
      alert("Please provide payment link and amount paid.")
      return
    }
    const supabase = createClient()
    await supabase.from('milestones').update({
      status: 'completed',
      payment_link: paymentLink,
      amount_paid: amountPaid
    }).eq('id', msId)
    setPaymentLink('')
    setAmountPaid('')
    loadData()
  }

  const completionPercentage = milestones.length > 0 
    ? Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100) 
    : 0

  const finishProject = async () => {
    if (!rating || !reviewText) return
    setFinishing(true)
    const supabase = createClient()
    
    // 1. Add review
    await supabase.from('reviews').insert({
      project_id: id,
      freelancer_id: bid.student_id,
      client_id: user.id,
      rating: rating,
      comment: reviewText
    })

    // 2. Mark project complete
    await supabase.from('projects').update({ status: 'completed' }).eq('id', id)
    
    router.push(`/profile/${bid.student_id}`) // Redirect to freelancer profile to see review
  }

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-[#F5A623]" size={32} /></div>
  if (!project || !bid) return <div className="text-white p-8">Project or Accepted Bid not found</div>

  const isOwner = user?.id === project.client_id
  const isFreelancer = user?.id === bid.student_id
  const allMilestonesCompleted = milestones.length > 0 && milestones.every(m => m.status === 'completed')

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] pb-20">
      <div className="border-b border-[#27272a] px-6 py-4 sticky top-0 bg-[#09090b] z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/profile" className="flex items-center gap-2 text-sm font-mono text-[#71717a] hover:text-[#F5A623] transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span className="text-xs font-mono tracking-widest text-[#F5A623] uppercase">Project Workspace</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12 border-b border-[#27272a] pb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif mb-2">{project.title}</h1>
              <p className="text-sm font-mono text-[#a1a1aa] max-w-2xl">{project.description}</p>
            </div>
            <div className="px-3 py-1 bg-[#27272a] border border-[#3f3f46] text-xs font-mono uppercase text-[#F5A623]">
              {project.status.replace('_', ' ')}
            </div>
          </div>
          
          <div className="mt-8 space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">Project Completion</span>
              <span className="text-sm font-mono text-[#F5A623]">{completionPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#18181b] border border-[#27272a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#F5A623] to-[#E09510] transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-6 text-[10px] font-mono text-[#71717a] uppercase tracking-wider">
            <span>Client: <span className="text-[#fafafa]">{project.client?.full_name}</span></span>
            <span>Freelancer: <span className="text-[#fafafa]">{bid.student?.full_name}</span></span>
            <span>Agreed Budget: <span className="text-[#fafafa]">{bid.proposed_budget}</span></span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Milestones List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-serif">Project Milestones</h2>

            {milestones.length === 0 ? (
              <div className="p-8 border border-[#27272a] border-dashed text-center text-[#71717a] font-mono text-sm">
                No milestones added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((ms, index) => (
                  <div key={ms.id} className={`p-6 border ${ms.status === 'completed' ? 'border-[#22c55e]/50 bg-[#22c55e]/5' : ms.status === 'review' ? 'border-[#F5A623]/50 bg-[#F5A623]/5' : 'border-[#27272a] bg-[#18181b]'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-mono text-[#71717a] mb-1">Milestone {index + 1}</div>
                        <h3 className="text-lg font-serif">{ms.title}</h3>
                        {ms.description && <p className="text-sm font-mono text-[#a1a1aa] mt-2">{ms.description}</p>}
                      </div>
                      <select 
                        value={ms.status}
                        onChange={(e) => updateMilestoneStatus(ms.id, e.target.value)}
                        disabled={ms.status === 'completed' || (!isFreelancer && !isOwner)}
                        className={`text-[10px] font-mono tracking-widest uppercase px-2 py-1 bg-[#09090b] border outline-none transition-colors ${
                          ms.status === 'completed' ? 'border-[#22c55e] text-[#22c55e]' :
                          ms.status === 'review' ? 'border-[#F5A623] text-[#F5A623]' :
                          'border-[#27272a] text-[#71717a]'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed" disabled={!isOwner}>Completed</option>
                      </select>
                    </div>

                    {/* Freelancer Action: Submit Work */}
                    {isFreelancer && ms.status === 'pending' && submittingId !== ms.id && (
                      <button onClick={() => setSubmittingId(ms.id)} className="text-sm font-mono text-[#F5A623] hover:underline">
                        + Submit Work
                      </button>
                    )}

                    {isFreelancer && submittingId === ms.id && (
                      <div className="mt-4 p-4 border border-[#27272a] bg-[#09090b] space-y-3">
                        <textarea 
                          value={workDescription}
                          onChange={(e) => setWorkDescription(e.target.value)}
                          placeholder="Describe exactly what you have done in this milestone..." 
                          rows={3}
                          className="w-full bg-[#18181b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                        />
                        <div className="flex gap-2">
                          <input 
                            type="url" 
                            value={submitLink}
                            onChange={(e) => setSubmitLink(e.target.value)}
                            placeholder="Link to deliverable (GitHub, Vercel, etc.)" 
                            className="flex-1 bg-[#18181b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                          />
                          <button 
                            onClick={() => submitMilestoneWork(ms.id)}
                            className="px-4 py-2 bg-[#F5A623] text-[#09090b] text-xs font-mono font-medium hover:opacity-90"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show Submitted Work */}
                    {(ms.status === 'review' || ms.status === 'completed') && (ms.submitted_work || ms.work_description) && (
                      <div className="mt-4 space-y-3">
                        {ms.work_description && (
                          <div className="p-3 bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#a1a1aa] leading-relaxed italic">
                            "{ms.work_description}"
                          </div>
                        )}
                        {ms.submitted_work && (
                          <div className="p-3 bg-[#09090b] border border-[#27272a] text-sm font-mono break-all flex items-center justify-between">
                            <div className="flex-1">
                              <span className="text-[#71717a]">Deliverable:</span>{' '}
                              <a href={ms.submitted_work} target="_blank" className="text-[#F5A623] hover:underline">{ms.submitted_work}</a>
                            </div>
                            <Upload size={14} className="text-[#71717a]" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show Payment Info (Completed Only) */}
                    {ms.status === 'completed' && ms.payment_link && (
                      <div className="mt-3 p-3 bg-[#22c55e]/5 border border-[#22c55e]/30 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-[#22c55e]">
                          <CheckCircle size={14} />
                          <span>Paid {ms.amount_paid}</span>
                        </div>
                        <a href={ms.payment_link} target="_blank" className="text-[#71717a] hover:text-[#fafafa] underline">View Receipt</a>
                      </div>
                    )}

                    {/* Client Action: Approve & Pay */}
                    {isOwner && ms.status === 'review' && (
                      <div className="mt-4 p-4 border border-dashed border-[#F5A623]/30 bg-[#F5A623]/5 space-y-3">
                        <p className="text-xs font-mono text-[#F5A623] uppercase tracking-wider font-bold">Release Payment to Complete Milestone</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="Amount (e.g. $500)" 
                            className="bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                          />
                          <input 
                            type="url" 
                            value={paymentLink}
                            onChange={(e) => setPaymentLink(e.target.value)}
                            placeholder="Payment/Stripe Receipt Link" 
                            className="bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => approveAndPayMilestone(ms.id)}
                          className="w-full py-2.5 bg-[#22c55e] text-[#09090b] text-xs font-mono font-bold hover:opacity-90 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Confirm Payment & Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* REAL-TIME CHAT */}
            <div className="flex flex-col h-[500px] bg-[#18181b] border border-[#27272a]">
              <div className="p-4 border-b border-[#27272a] bg-[#1c1c1f]">
                <h3 className="text-sm font-serif font-medium flex items-center gap-2">
                  <Plus size={16} className="text-[#F5A623]" /> Project Chat
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-[10px] font-mono text-[#52525b] text-center mt-10 uppercase tracking-widest">No messages yet. Start the conversation.</p>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === user?.id
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 text-xs font-mono rounded-sm ${isMe ? 'bg-[#27272a] text-[#fafafa]' : 'bg-[#09090b] border border-[#27272a] text-[#a1a1aa]'}`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-mono text-[#52525b] mt-1">
                          {isMe ? 'You' : msg.sender?.full_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-[#27272a] bg-[#1c1c1f]">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1 bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-[#F5A623] text-[#09090b] text-xs font-mono font-bold hover:bg-[#E09510] disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Actions (Keep existing ones) */}
            {isOwner && project.status !== 'completed' && (
              <div className="p-6 bg-[#18181b] border border-[#27272a] space-y-4">
                <h3 className="text-lg font-serif flex items-center gap-2"><Plus size={18} /> Add Milestone</h3>
                <div>
                  <input 
                    type="text" 
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="Milestone Title" 
                    className="w-full mb-2 bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                  />
                  <textarea 
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    placeholder="Description / Requirements" 
                    rows={2}
                    className="w-full bg-[#09090b] border border-[#27272a] p-2 text-sm font-mono focus:border-[#F5A623] outline-none"
                  />
                </div>
                <button 
                  onClick={addMilestone}
                  disabled={!newMilestoneTitle}
                  className="w-full py-2 border border-[#F5A623] text-[#F5A623] text-sm font-mono hover:bg-[#F5A623] hover:text-[#09090b] transition disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            )}

            {/* Complete Project Workflow (Client Only) */}
            {isOwner && project.status !== 'completed' && allMilestonesCompleted && (
              <div className="p-6 border border-[#22c55e] bg-[#22c55e]/10 space-y-4 animate-fade-up">
                <h3 className="text-lg font-serif text-[#22c55e]">All Milestones Done!</h3>
                <p className="text-xs font-mono text-[#a1a1aa]">You can now finalize the project and leave a review for the freelancer.</p>
                
                <div className="pt-4 border-t border-[#22c55e]/20 space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#71717a] mb-2">Rating (1-5)</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(num => (
                        <button key={num} onClick={() => setRating(num)} className={`p-1 ${rating >= num ? 'text-[#F5A623]' : 'text-[#3f3f46]'}`}>
                          <Star size={20} fill={rating >= num ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#71717a] mb-2">Public Review</label>
                    <textarea 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience working with them..." 
                      rows={3}
                      className="w-full bg-[#09090b] border border-[#22c55e]/50 p-2 text-sm font-mono focus:border-[#22c55e] outline-none"
                    />
                  </div>
                  <button 
                    onClick={finishProject}
                    disabled={finishing || !reviewText}
                    className="w-full py-2 bg-[#22c55e] text-[#09090b] font-mono text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {finishing ? 'Completing...' : 'Finish Project'}
                  </button>
                </div>
              </div>
            )}

            {project.status === 'completed' && (
              <div className="p-6 border border-[#27272a] bg-[#18181b] text-center">
                <CheckCircle size={32} className="mx-auto text-[#22c55e] mb-2" />
                <h3 className="text-lg font-serif">Project Completed</h3>
                <p className="text-xs font-mono text-[#71717a]">This workspace is now archived.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
