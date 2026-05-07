'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { TalentCard } from '@/components/forge/talent-card'
import { Search } from 'lucide-react'

type Talent = {
  id: string
  full_name: string
  role: string
  skills: string[]
  github_url: string
  avatar_url?: string
}

const CATEGORIES = ['All', 'Web Dev', 'AI / ML', 'Mobile', 'Backend']

export default function AllTalentPage() {
  const [talents, setTalents] = useState<Talent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchTalents = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, skills, github_url, avatar_url')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTalents(data as Talent[])
    } else if (error) {
      console.error('Error fetching talents:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTalents()
  }, [fetchTalents])

  // Filter based on role/skills and search text
  const filteredTalents = talents.filter((talent) => {
    const matchesSearch = (talent.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (talent.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (talent.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (!matchesSearch) return false

    if (activeCategory === 'All') return true
    
    const roleAndSkills = `${talent.role} ${talent.skills.join(' ')}`.toLowerCase()
    
    if (activeCategory === 'Web Dev') return roleAndSkills.includes('web') || roleAndSkills.includes('frontend') || roleAndSkills.includes('react')
    if (activeCategory === 'AI / ML') return roleAndSkills.includes('machine learning') || roleAndSkills.includes('ai') || roleAndSkills.includes('python')
    if (activeCategory === 'Mobile') return roleAndSkills.includes('mobile') || roleAndSkills.includes('swift') || roleAndSkills.includes('react native')
    if (activeCategory === 'Backend') return roleAndSkills.includes('backend') || roleAndSkills.includes('node') || roleAndSkills.includes('go') || roleAndSkills.includes('rust')
    
    return true
  })

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      {/* Navbar */}
      <div className="border-b-2 border-[#8A8A8A] px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-40">
        <Link href="/" className="text-xl font-serif font-medium text-[#0D0D0D]">forge.</Link>
        <div className="flex gap-6">
          <Link href="/projects" className="text-xs font-sans text-[#8A8A8A] hover:text-[#0D0D0D] transition-colors">
            Browse Projects
          </Link>
          <Link href="/auth/login" className="text-xs font-sans text-[#8A8A8A] hover:text-[#0D0D0D] transition-colors">
            Post a Project
          </Link>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-serif font-medium text-[#0D0D0D] mb-4">
            Browse All Freelancers
          </h1>
          <p className="text-base sm:text-lg font-sans text-[#8A8A8A] max-w-2xl mx-auto">
            Discover exceptional student developers ready to build your next big idea.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 border-[#8A8A8A] pb-6">
          <div className="flex overflow-x-auto w-full md:w-auto hide-scrollbar gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 text-sm font-sans font-medium whitespace-nowrap transition-colors border-2 ${
                  activeCategory === category 
                    ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' 
                    : 'bg-white text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" size={16} />
            <input 
              type="text"
              placeholder="Search by name, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-[#8A8A8A] bg-white font-sans text-sm focus:outline-none focus:border-[#F5A623] transition-colors"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border-2 border-[#8A8A8A] p-6 bg-white animate-pulse min-h-[300px]" />
            ))}
          </div>
        ) : (
          /* Grid */
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px] content-start">
              {filteredTalents.length > 0 ? (
                filteredTalents.map((talent) => (
                  <TalentCard 
                    key={talent.id} 
                    name={talent.full_name || 'Anonymous'}
                    role={talent.role || 'Developer'}
                    skills={talent.skills || []}
                    github={talent.github_url || ''}
                    stars={Math.floor(Math.random() * 1000)} // Random stars for demo
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#8A8A8A] bg-white">
                  <p className="text-[#8A8A8A] font-sans text-base">No freelancers match your search.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                    className="mt-4 text-[#F5A623] hover:text-[#0D0D0D] transition-colors font-sans text-sm font-medium underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            
            {filteredTalents.length > 0 && (
              <div className="mt-12 text-center text-xs font-sans text-[#8A8A8A]">
                Showing {filteredTalents.length} developers
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
