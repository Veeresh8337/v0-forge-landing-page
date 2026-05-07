'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { TalentCard } from './talent-card'

type Talent = {
  id: string
  name: string
  role: string
  skills: string[]
  github: string
  stars: number
  avatar_url?: string
}

// Fallback static data shown while DB is empty / loading
const FALLBACK_TALENTS: Talent[] = [
  {
    id: '1',
    name: 'Alex Chen',
    role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    github: 'https://github.com/alexchen',
    stars: 842,
  },
  {
    id: '2',
    name: 'Jamie Rodriguez',
    role: 'Backend Engineer',
    skills: ['Go', 'Rust', 'Kubernetes', 'AWS'],
    github: 'https://github.com/jamierodriguez',
    stars: 1204,
  },
  {
    id: '3',
    name: 'Sam Patel',
    role: 'Frontend Specialist',
    skills: ['React', 'Next.js', 'Tailwind', 'Framer Motion'],
    github: 'https://github.com/sampatel',
    stars: 567,
  },
]

export function TalentCardGrid() {
  const [talents, setTalents] = useState<Talent[]>(FALLBACK_TALENTS)
  const [live, setLive] = useState(false)
  const [newEntry, setNewEntry] = useState<string | null>(null)

  const fetchTalents = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, skills, github, stars, avatar_url')
      .order('stars', { ascending: false })
      .limit(6)

    if (!error && data && data.length > 0) {
      setTalents(data as Talent[])
      setLive(true)
    }
  }, [])

  useEffect(() => {
    fetchTalents()

    const supabase = createClient()

    // Real-time subscription on the `profiles` table
    const channel = supabase
      .channel('realtime:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProfile = payload.new as Talent
            setNewEntry(newProfile.name)
            setTimeout(() => setNewEntry(null), 3000)
            setTalents((prev) => [newProfile, ...prev].slice(0, 6))
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

  return (
    <section id="talent" className="bg-white py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#0D0D0D] mb-4 sm:mb-6 text-balance">
              Top Developers on Forge
            </h2>
            <p className="text-base sm:text-lg font-sans text-[#8A8A8A] max-w-2xl">
              Browse from a curated selection of the best student developers. Every profile is verified and rated by real clients.
            </p>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-[#8A8A8A]'}`} />
            <span className="text-xs font-sans text-[#8A8A8A]">
              {live ? 'Live updates' : 'Loading…'}
            </span>
          </div>
        </div>

        {/* Toast for new entrant */}
        {newEntry && (
          <div className="mb-6 px-4 py-3 border-2 border-[#F5A623] bg-[#FFF8EC] flex items-center gap-3 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
            <span className="text-xs font-sans text-[#0D0D0D]">
              <strong>{newEntry}</strong> just joined Forge!
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {talents.map((talent) => (
            <TalentCard key={talent.id} {...talent} />
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <button className="px-6 sm:px-8 py-3 border-2 border-[#0D0D0D] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium hover:border-[#F5A623] hover:text-[#F5A623] transition-all duration-200">
            View All Developers
          </button>
        </div>
      </div>
    </section>
  )
}
