'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import {
  Search, Filter, DollarSign, Clock, Users, ChevronRight,
  Loader2, Sparkles, X, Code2, Briefcase
} from 'lucide-react'

type Project = {
  id: string
  created_at: string
  title: string
  description: string
  budget: any // Handled as string or number
  timeline: string
  tech_stack: string[]
  skills_required: string[]
  status: string
  client_id: string
  profiles: { full_name: string; avatar_url: string }
}

const TECH_FILTERS = ['All', 'React', 'Next.js', 'Node.js', 'Python', 'TypeScript', 'AI/ML', 'Mobile', 'Design', 'WordPress']
const BUDGET_RANGES = [
  { label: 'Any Budget', min: 0, max: Infinity },
  { label: 'Under $500', min: 0, max: 500 },
  { label: '$500 – $2,000', min: 500, max: 2000 },
  { label: '$2,000 – $5,000', min: 2000, max: 5000 },
  { label: '$5,000+', min: 5000, max: Infinity },
]

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function BrowseProjectsPage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('All')
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[0])
  const [showFilters, setShowFilters] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, profiles(full_name, avatar_url)')
          .order('created_at', { ascending: false })

        if (error) {
          console.error("Projects Fetch Error:", error)
          setErrorMessage(error.message || JSON.stringify(error))
        } else {
          setProjects(data || [])
        }
      } catch (err: any) {
        console.error("Unexpected Error:", err)
        setErrorMessage(err.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = projects.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tech_stack?.some(t => t.toLowerCase().includes(search.toLowerCase()))

    const matchTech = techFilter === 'All' ||
      p.tech_stack?.some(t => t.toLowerCase().includes(techFilter.toLowerCase())) ||
      p.skills_required?.some(s => s.toLowerCase().includes(techFilter.toLowerCase()))

    const matchBudget = !p.budget || (p.budget >= budgetRange.min && p.budget < budgetRange.max)

    return matchSearch && matchTech && matchBudget
  })

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <div className="border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b] z-10">
        <Link href="/" className="text-xl font-serif font-medium text-[#fafafa]">forge.</Link>
        <div className="flex items-center gap-4">
          <Link href="/talent" className="text-sm font-mono text-[#a1a1aa] hover:text-[#fafafa] transition-colors">Browse Talent</Link>
          <Link href="/post-project" className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] text-[#0D0D0D] text-sm font-mono font-medium hover:bg-[#E09510] transition-colors">
            <Sparkles size={13} /> Post a Project
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b border-[#27272a] px-6 py-10 bg-[#09090b]">
        <div className="max-w-4xl mx-auto">
          {errorMessage && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-mono animate-in fade-in slide-in-from-top-4">
              <p className="font-bold mb-1">Database Error:</p>
              <p>{errorMessage}</p>
              <p className="mt-2 text-[10px] opacity-70">Tip: Check if you have run the latest SQL migrations in Supabase.</p>
            </div>
          )}
          <p className="text-xs font-mono text-[#F5A623] uppercase tracking-widest mb-3">Open Projects</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#fafafa] mb-3">
            Find your next project.
          </h1>
          <p className="text-sm font-mono text-[#71717a] mb-6">
            {projects.length} open project{projects.length !== 1 ? 's' : ''} waiting for proposals.
          </p>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, skill, or keyword..."
                className="w-full pl-10 pr-4 py-3 bg-[#18181b] border border-[#27272a] text-sm font-mono text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-[#F5A623] transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa]">
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border text-sm font-mono transition-colors ${
                showFilters ? 'border-[#F5A623] text-[#F5A623] bg-[#F5A623]/10' : 'border-[#27272a] text-[#a1a1aa] hover:border-[#a1a1aa]'
              }`}
            >
              <Filter size={13} /> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 p-5 bg-[#18181b] border border-[#27272a] space-y-4">
            <div>
              <p className="text-xs font-mono text-[#71717a] uppercase tracking-widest mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {TECH_FILTERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTechFilter(t)}
                    className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                      techFilter === t
                        ? 'bg-[#F5A623] text-[#0D0D0D] border-[#F5A623]'
                        : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#a1a1aa] hover:text-[#fafafa]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-[#71717a] uppercase tracking-widest mb-2">Budget Range</p>
              <div className="flex flex-wrap gap-2">
                {BUDGET_RANGES.map(r => (
                  <button
                    key={r.label}
                    onClick={() => setBudgetRange(r)}
                    className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                      budgetRange.label === r.label
                        ? 'bg-[#F5A623] text-[#0D0D0D] border-[#F5A623]'
                        : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#a1a1aa] hover:text-[#fafafa]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filters summary */}
        {(techFilter !== 'All' || budgetRange.label !== 'Any Budget') && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono text-[#71717a]">Filtering by:</span>
            {techFilter !== 'All' && (
              <span className="text-xs font-mono px-2 py-0.5 bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623]">{techFilter}</span>
            )}
            {budgetRange.label !== 'Any Budget' && (
              <span className="text-xs font-mono px-2 py-0.5 bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623]">{budgetRange.label}</span>
            )}
            <button onClick={() => { setTechFilter('All'); setBudgetRange(BUDGET_RANGES[0]) }} className="text-xs font-mono text-[#52525b] hover:text-[#a1a1aa] ml-2">Clear all</button>
          </div>
        )}

        {/* Results count */}
        <p className="text-xs font-mono text-[#52525b] mb-5">
          Showing {filtered.length} of {projects.length} projects
        </p>

        {/* Loading */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 size={28} className="animate-spin text-[#F5A623]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center border border-[#27272a] border-dashed">
            <Briefcase size={32} className="mx-auto text-[#3f3f46] mb-4" />
            <p className="text-sm font-mono text-[#71717a]">No projects match your filters.</p>
            <button onClick={() => { setSearch(''); setTechFilter('All'); setBudgetRange(BUDGET_RANGES[0]) }}
              className="mt-3 text-xs font-mono text-[#F5A623] hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block bg-[#18181b] border border-[#27272a] hover:border-[#F5A623] transition-all p-5 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Client */}
                    <div className="flex items-center gap-2 mb-2">
                      {project.profiles?.avatar_url
                        ? <img src={project.profiles.avatar_url} className="w-5 h-5 rounded-full" />
                        : <div className="w-5 h-5 rounded-full bg-[#27272a]" />
                      }
                      <span className="text-xs font-mono text-[#52525b]">{project.profiles?.full_name || 'Client'}</span>
                      <span className="text-xs font-mono text-[#3f3f46]">·</span>
                      <span className="text-xs font-mono text-[#52525b]">{timeAgo(project.created_at)}</span>
                    </div>

                    <h3 className="text-base font-serif font-medium text-[#fafafa] group-hover:text-[#F5A623] transition-colors mb-2 truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs font-mono text-[#71717a] line-clamp-2 mb-3">{project.description}</p>

                    <div className="flex items-center gap-4 text-xs font-mono text-[#52525b]">
                      {project.budget && (
                        <span className="flex items-center gap-1 text-[#22c55e]">
                          <DollarSign size={11} />{project.budget}
                        </span>
                      )}
                      {project.timeline && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />{project.timeline}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                        project.status === 'open' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                        project.status === 'in_progress' ? 'text-blue-500 border-blue-500/30 bg-blue-500/10' :
                        'text-[#71717a] border-[#27272a] bg-[#18181b]'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-[#3f3f46] group-hover:text-[#F5A623] shrink-0 mt-1 transition-colors" />
                </div>

                {project.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#27272a]">
                    {project.tech_stack.slice(0, 6).map(t => (
                      <span key={t} className="text-xs font-mono px-2 py-0.5 bg-[#09090b] border border-[#27272a] text-[#a1a1aa]">{t}</span>
                    ))}
                    {project.tech_stack.length > 6 && (
                      <span className="text-xs font-mono px-2 py-0.5 text-[#52525b]">+{project.tech_stack.length - 6} more</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
