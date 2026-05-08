'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Sparkles, Loader2, X, Plus, GripVertical, ChevronRight } from 'lucide-react'

type Milestone = { title: string; description: string; duration: string }

type ScopedProject = {
  title: string
  summary: string
  tech_stack: string[]
  budget_range: string
  timeline: string
  milestones: Milestone[]
}

type Phase = 'input' | 'loading' | 'review'

async function generateScope(description: string): Promise<ScopedProject> {
  const res = await fetch('/api/scope-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Scoping failed')
  return data
}

export default function PostProjectPage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<Phase>('input')
  const [scoped, setScoped] = useState<ScopedProject | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [editTitle, setEditTitle] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editTimeline, setEditTimeline] = useState('')
  const [editTechStack, setEditTechStack] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  const handleScope = async () => {
    if (description.trim().length < 20) { setError('Please describe your project in more detail.'); return }
    setError('')
    setPhase('loading')
    try {
      const data = await generateScope(description)
      setScoped(data)
      setMilestones(data.milestones)
      setEditTitle(data.title)
      const budgetNum = data.budget_range?.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || '1000'
      setEditBudget(budgetNum)
      setEditTimeline(data.timeline || '')
      setEditTechStack((data.tech_stack || []).join(', '))
      setPhase('review')
    } catch {
      setError('AI scoping failed. Please try again.')
      setPhase('input')
    }
  }

  const updateMilestone = (i: number, field: keyof Milestone, val: string) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }

  const removeMilestone = (i: number) => {
    setMilestones(prev => prev.filter((_, idx) => idx !== i))
  }

  const addMilestone = () => {
    setMilestones(prev => [...prev, { title: '', description: '', duration: '3 days' }])
  }

  const handlePost = async () => {
    if (!scoped || milestones.length === 0) return
    setPosting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        client_id: user.id,
        title: editTitle || scoped.title,
        description,
        budget: parseFloat(editBudget) || null,
        timeline: editTimeline || scoped.timeline,
        tech_stack: editTechStack.split(',').map(s => s.trim()).filter(Boolean),
        skills_required: editTechStack.split(',').map(s => s.trim()).filter(Boolean),
        milestones,
        status: 'open',
      })
      .select()
      .single()

    if (dbError) { setError('Failed to post project. Check you are signed in as a client.'); setPosting(false); return }
    router.push(`/projects?posted=${project.id}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b-2 border-[#8A8A8A] px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <Link href="/" className="text-xl font-serif font-medium text-[#0D0D0D]">forge.</Link>
        <div className="flex items-center gap-4">
          {phase === 'review' && (
            <button onClick={() => { setPhase('input'); setScoped(null) }}
              className="text-xs font-sans text-[#8A8A8A] hover:text-[#0D0D0D] transition-colors">
              ← Back
            </button>
          )}
          <span className="text-xs font-sans text-[#8A8A8A]">
            {phase === 'input' ? 'Step 1 of 2' : phase === 'loading' ? 'Processing…' : 'Step 2 of 2'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* ── INPUT ── */}
        {phase === 'input' && (
          <div className="w-full max-w-2xl">
            <div className="mb-10">
              <h1 className="text-4xl sm:text-5xl font-serif font-medium text-[#0D0D0D] mb-4 leading-tight">
                Describe what you want to build.
              </h1>
              <p className="text-base font-sans text-[#8A8A8A]">
                Plain English only. Our AI will structure the entire project brief for you.
              </p>
            </div>

            <div className="border-2 border-[#8A8A8A] focus-within:border-[#0D0D0D] transition-colors">
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setError('') }}
                placeholder="e.g. I need a fast website for my real estate business that handles property listings and looks premium. Users should be able to search by location and price range..."
                rows={9}
                className="w-full px-6 py-5 font-sans text-base text-[#0D0D0D] placeholder-[#8A8A8A] bg-white resize-none focus:outline-none"
              />
              <div className="px-6 py-4 border-t-2 border-[#8A8A8A] flex items-center justify-between bg-[#F5F4F0]">
                <span className="text-xs font-sans text-[#8A8A8A]">{description.length} characters</span>
                <button
                  id="magic-scope-btn"
                  onClick={handleScope}
                  disabled={description.trim().length < 20}
                  className="flex items-center gap-2 px-6 py-2.5 font-sans text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#F5A623', color: '#0D0D0D' }}
                >
                  <Sparkles size={14} />
                  Magic Scope
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-xs font-sans text-red-500">{error}</p>}

            <div className="mt-10 space-y-2">
              <p className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase mb-3">Examples to try</p>
              {[
                'A property listing site with search, filters, and a contact form.',
                'An AI chatbot that answers questions about my menu and takes restaurant reservations.',
                'A SaaS dashboard to track employee timesheets with CSV export and Stripe billing.',
              ].map((idea) => (
                <button key={idea} onClick={() => setDescription(idea)}
                  className="w-full text-left px-4 py-3 border border-[#8A8A8A] text-xs font-sans text-[#8A8A8A] hover:border-[#F5A623] hover:text-[#0D0D0D] transition-all">
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <div className="w-full max-w-xl text-center">
            <div className="flex justify-center mb-8">
              <Loader2 size={40} className="animate-spin" style={{ color: '#F5A623' }} />
            </div>
            <h2 className="text-3xl font-serif font-medium text-[#0D0D0D] mb-3">Scoping your project…</h2>
            <p className="text-sm font-sans text-[#8A8A8A] mb-8">
              AI is building your professional brief, recommended stack, and milestones.
            </p>
            <div className="space-y-2 text-left max-w-xs mx-auto">
              {['Reading your requirements', 'Selecting the best tech stack', 'Creating milestone plan', 'Estimating budget'].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  <span className="text-xs font-sans text-[#8A8A8A]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REVIEW + EDIT ── */}
        {phase === 'review' && scoped && (
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase">AI Scoped</span>
              </div>

              {/* Editable title */}
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-3xl sm:text-4xl font-serif font-medium text-[#0D0D0D] bg-transparent focus:outline-none border-b-2 border-transparent focus:border-[#F5A623] w-full pb-1 transition-colors"
              />
              <p className="mt-3 text-sm font-sans text-[#8A8A8A] leading-relaxed">{scoped.summary}</p>
            </div>

            {/* Budget + Timeline + Stack */}
            <div className="grid sm:grid-cols-3 border-2 border-[#8A8A8A] mb-6">
              <div className="px-5 py-4 sm:border-r-2 border-b-2 sm:border-b-0 border-[#8A8A8A]">
                <div className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase mb-1">Budget ($)</div>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="text-sm font-sans font-medium text-[#0D0D0D] bg-transparent focus:outline-none w-full border-b border-[#8A8A8A] focus:border-[#F5A623] transition-colors"
                />
              </div>
              <div className="px-5 py-4 sm:border-r-2 border-b-2 sm:border-b-0 border-[#8A8A8A]">
                <div className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase mb-1">Timeline</div>
                <input
                  type="text"
                  value={editTimeline}
                  onChange={(e) => setEditTimeline(e.target.value)}
                  className="text-sm font-sans font-medium text-[#0D0D0D] bg-transparent focus:outline-none w-full border-b border-[#8A8A8A] focus:border-[#F5A623] transition-colors"
                />
              </div>
              <div className="px-5 py-4">
                <div className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase mb-1">Stack (CSV)</div>
                <input
                  type="text"
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  className="text-sm font-sans font-medium text-[#0D0D0D] bg-transparent focus:outline-none w-full border-b border-[#8A8A8A] focus:border-[#F5A623] transition-colors"
                />
              </div>
            </div>

            {/* Tech stack tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {editTechStack.split(',').map(tech => tech.trim()).filter(Boolean).map(tech => (
                <span key={tech} className="text-xs font-sans bg-[#F5F4F0] px-3 py-1.5 border border-[#8A8A8A]">{tech}</span>
              ))}
            </div>

            {/* MILESTONES — EDITABLE */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-sans text-[#8A8A8A] tracking-widest uppercase">
                  Milestones — Edit freely
                </span>
                <button onClick={addMilestone}
                  className="flex items-center gap-1 text-xs font-sans text-[#8A8A8A] hover:text-[#0D0D0D] transition-colors">
                  <Plus size={12} /> Add
                </button>
              </div>

              <div className="border-2 border-[#8A8A8A] divide-y-2 divide-[#8A8A8A]">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-3 px-4 py-4 group hover:bg-[#F5F4F0] transition-colors">
                    <GripVertical size={14} className="mt-1 shrink-0 text-[#8A8A8A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-6 h-6 border-2 border-[#8A8A8A] flex items-center justify-center shrink-0 mt-0.5 text-xs font-sans font-medium">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={m.title}
                        onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                        placeholder="Milestone title"
                        className="w-full text-sm font-sans font-medium text-[#0D0D0D] bg-transparent focus:outline-none border-b border-transparent focus:border-[#8A8A8A] transition-colors"
                      />
                      <input
                        value={m.description}
                        onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                        placeholder="What gets delivered"
                        className="w-full text-xs font-sans text-[#8A8A8A] bg-transparent focus:outline-none border-b border-transparent focus:border-[#8A8A8A] transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        value={m.duration}
                        onChange={(e) => updateMilestone(i, 'duration', e.target.value)}
                        className="text-xs font-sans text-[#8A8A8A] bg-transparent focus:outline-none w-14 text-right"
                      />
                      <button onClick={() => removeMilestone(i)}
                        className="text-[#8A8A8A] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="mb-4 text-xs font-sans text-red-500">{error}</p>}

            <button id="post-project-btn" onClick={handlePost} disabled={posting || milestones.length === 0}
              className="w-full py-4 flex items-center justify-center gap-2 font-sans text-base font-medium transition-all disabled:opacity-50"
              style={{ background: '#0D0D0D', color: '#fafafa' }}>
              <ChevronRight size={16} />
              {posting ? 'Posting…' : 'Post Project'}
            </button>
            <p className="mt-3 text-xs font-sans text-[#8A8A8A] text-center">
              Goes live immediately. Developers apply with their Talent Cards.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
