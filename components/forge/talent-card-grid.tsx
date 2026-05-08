'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { TalentCard } from './talent-card'

type Talent = {
  id: string
  full_name?: string
  role?: string
  title?: string
  skills?: string[]
  github_url?: string
  avatar_url?: string
}

const TECH_CATEGORIES = ['Web Dev', 'AI / ML', 'Mobile', 'Backend', 'CyberSec', 'DevOps']
const NON_TECH_CATEGORIES = ['Design', 'Video Editing', 'Data Entry', 'Writing', 'Marketing', 'Virtual Assistant', 'Audio / Music']

const FALLBACK_TALENTS: Talent[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Alex Chen',
    role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    github_url: 'https://github.com/alexchen',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Jamie Rodriguez',
    role: 'Backend Engineer',
    skills: ['Go', 'Rust', 'Kubernetes', 'AWS'],
    github_url: 'https://github.com/jamierodriguez',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    full_name: 'Sam Patel',
    role: 'Frontend Specialist',
    skills: ['React', 'Next.js', 'Tailwind', 'Framer Motion'],
    github_url: 'https://github.com/sampatel',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    full_name: 'Elena Rostova',
    role: 'Machine Learning',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'CUDA'],
    github_url: 'https://github.com/erostova',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    full_name: 'Marcus Johnson',
    role: 'Mobile Developer',
    skills: ['Swift', 'Kotlin', 'React Native', 'Firebase'],
    github_url: 'https://github.com/marcusj',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    full_name: 'Sarah Lee',
    role: 'Web Developer',
    skills: ['Vue.js', 'Nuxt', 'CSS', 'Figma'],
    github_url: 'https://github.com/sarahlee',
  }
]

export function TalentCardGrid() {
  const [talents, setTalents] = useState<Talent[]>(FALLBACK_TALENTS)
  const [live, setLive] = useState(false)
  const [newEntry, setNewEntry] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  const fetchTalents = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, title, skills, github_url, avatar_url')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data && data.length > 0) {
      setTalents(data as Talent[])
      setLive(true)
    }
  }, [])

  useEffect(() => {
    fetchTalents()

    const supabase = createClient()

    const channel = supabase
      .channel('realtime:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProfile = payload.new as Talent
            setNewEntry(newProfile.full_name || 'Anonymous')
            setTimeout(() => setNewEntry(null), 3000)
            setTalents((prev) => [newProfile, ...prev])
            setLive(true)
          } else if (payload.eventType === 'UPDATE') {
            setTalents((prev) =>
              prev.map((t) => (t.id === (payload.new as Talent).id ? (payload.new as Talent) : t))
            )
          } else if (payload.eventType === 'DELETE') {
            setTalents((prev) => prev.filter((t) => t.id !== (payload.old as Talent).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTalents])

  // Simple client-side filtering based on role/skills for demonstration
  const filteredTalents = talents.filter((talent) => {
    if (activeCategory === 'All') return true
    const searchString = `${talent.role || ''} ${(talent.skills || []).join(' ')}`.toLowerCase()
    
    if (activeCategory === 'Web Dev') return searchString.includes('web') || searchString.includes('frontend') || searchString.includes('react')
    if (activeCategory === 'AI / ML') return searchString.includes('machine learning') || searchString.includes('ai') || searchString.includes('python')
    if (activeCategory === 'Mobile') return searchString.includes('mobile') || searchString.includes('swift') || searchString.includes('react native')
    if (activeCategory === 'Backend') return searchString.includes('backend') || searchString.includes('node') || searchString.includes('go') || searchString.includes('rust')
    if (activeCategory === 'Design') return searchString.includes('design') || searchString.includes('ui') || searchString.includes('ux') || searchString.includes('figma') || searchString.includes('photoshop')
    if (activeCategory === 'Video') return searchString.includes('video') || searchString.includes('edit') || searchString.includes('premiere') || searchString.includes('after effects') || searchString.includes('davinci')
    if (activeCategory === 'Data') return searchString.includes('data') || searchString.includes('entry') || searchString.includes('excel') || searchString.includes('typing') || searchString.includes('analytics')
    
    return true
  }).slice(0, 6)

  return (
    <section id="talent" className="bg-white py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#0D0D0D] mb-4 sm:mb-6 text-balance">
              Hire Top Freelancers
            </h2>
            <p className="text-base sm:text-lg font-sans text-[#8A8A8A] max-w-2xl">
              Browse from a curated selection of the best student developers. Every profile is verified and rated by real clients.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-[#8A8A8A]'}`} />
            <span className="text-xs font-sans text-[#8A8A8A]">
              {live ? 'Live updates' : 'Loading…'}
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-10 flex flex-col gap-6 border-b-2 border-[#F5F4F0] pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-5 py-2.5 text-sm font-sans font-medium whitespace-nowrap transition-colors border-2 ${
                activeCategory === 'All' 
                  ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' 
                  : 'bg-[#F5F4F0] text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
              }`}
            >
              Show All Freelancers
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest shrink-0 w-24">Tech:</span>
              <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pb-2">
                {TECH_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 text-xs font-sans font-medium whitespace-nowrap transition-colors border-2 ${
                      activeCategory === category 
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' 
                        : 'bg-[#F5F4F0] text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <span className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest shrink-0 w-24">Creative:</span>
              <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pb-2">
                {NON_TECH_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 text-xs font-sans font-medium whitespace-nowrap transition-colors border-2 ${
                      activeCategory === category 
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' 
                        : 'bg-[#F5F4F0] text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {newEntry && (
          <div className="mb-6 px-4 py-3 border-2 border-[#F5A623] bg-[#FFF8EC] flex items-center gap-3 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
            <span className="text-xs font-sans text-[#0D0D0D]">
              <strong>{newEntry}</strong> just joined Forge!
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 min-h-[400px]">
          {filteredTalents.length > 0 ? (
            filteredTalents.map((talent) => (
              <TalentCard 
                key={talent.id} 
                id={talent.id}
                name={talent.full_name || 'Anonymous'}
                role={talent.title || talent.role || 'Developer'}
                skills={talent.skills || []}
                github={talent.github_url || ''}
                stars={((talent.full_name || 'A').length * 14) % 999}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#8A8A8A]">
              <p className="text-[#8A8A8A] font-sans text-sm">No freelancers found in this category yet.</p>
            </div>
          )}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <Link href="/talent" className="inline-block px-6 sm:px-8 py-3 border-2 border-[#0D0D0D] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium hover:border-[#F5A623] hover:text-[#F5A623] transition-all duration-200">
            View All Developers
          </Link>
        </div>
      </div>
    </section>
  )
}
