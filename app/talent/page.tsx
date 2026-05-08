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

const TECH_CATEGORIES = ['Web Dev', 'AI / ML', 'Mobile', 'Backend', 'CyberSec', 'DevOps']
const NON_TECH_CATEGORIES = ['Design', 'Video Editing', 'Data Entry', 'Writing', 'Marketing', 'Virtual Assistant', 'Audio / Music']

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
    if (activeCategory === 'Mobile') return roleAndSkills.includes('mobile') || roleAndSkills.includes('swift') || roleAndSkills.includes('react native') || roleAndSkills.includes('flutter')
    if (activeCategory === 'Backend') return roleAndSkills.includes('backend') || roleAndSkills.includes('node') || roleAndSkills.includes('go') || roleAndSkills.includes('rust')
    if (activeCategory === 'CyberSec') return roleAndSkills.includes('security') || roleAndSkills.includes('cyber') || roleAndSkills.includes('penetration')
    if (activeCategory === 'DevOps') return roleAndSkills.includes('devops') || roleAndSkills.includes('aws') || roleAndSkills.includes('docker') || roleAndSkills.includes('kubernetes')

    if (activeCategory === 'Design') return roleAndSkills.includes('design') || roleAndSkills.includes('ui') || roleAndSkills.includes('ux') || roleAndSkills.includes('figma') || roleAndSkills.includes('photoshop')
    if (activeCategory === 'Video Editing') return roleAndSkills.includes('video') || roleAndSkills.includes('edit') || roleAndSkills.includes('premiere') || roleAndSkills.includes('after effects') || roleAndSkills.includes('davinci')
    if (activeCategory === 'Data Entry') return roleAndSkills.includes('data') || roleAndSkills.includes('entry') || roleAndSkills.includes('excel') || roleAndSkills.includes('typing') || roleAndSkills.includes('analytics')
    if (activeCategory === 'Writing') return roleAndSkills.includes('writ') || roleAndSkills.includes('copy') || roleAndSkills.includes('blog') || roleAndSkills.includes('content')
    if (activeCategory === 'Marketing') return roleAndSkills.includes('market') || roleAndSkills.includes('seo') || roleAndSkills.includes('social') || roleAndSkills.includes('growth')
    if (activeCategory === 'Virtual Assistant') return roleAndSkills.includes('virtual') || roleAndSkills.includes('assistant') || roleAndSkills.includes('admin')
    if (activeCategory === 'Audio / Music') return roleAndSkills.includes('audio') || roleAndSkills.includes('music') || roleAndSkills.includes('sound') || roleAndSkills.includes('mix')
    
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
        <div className="mb-10 flex flex-col items-start gap-6 border-b-2 border-[#8A8A8A] pb-6">
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" size={16} />
              <input 
                type="text"
                placeholder="Search by name, role, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-[#8A8A8A] bg-white font-sans text-sm focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>
            
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-5 py-2.5 text-sm font-sans font-medium whitespace-nowrap transition-colors border-2 ${
                activeCategory === 'All' 
                  ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]' 
                  : 'bg-white text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
              }`}
            >
              Show All Freelancers
            </button>
          </div>

          <div className="w-full flex flex-col gap-4">
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
                        : 'bg-white text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
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
                        : 'bg-white text-[#8A8A8A] border-transparent hover:border-[#8A8A8A] hover:text-[#0D0D0D]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
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
                    id={talent.id}
                    name={talent.full_name || 'Anonymous'}
                    role={talent.role || 'Developer'}
                    skills={talent.skills || []}
                    github={talent.github_url || ''}
                    stars={((talent.full_name || 'A').length * 14) % 999}
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
