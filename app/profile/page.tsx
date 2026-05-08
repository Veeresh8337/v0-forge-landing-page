'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Save, MapPin, Link as LinkIcon, Video, Star } from 'lucide-react'

export default function PrivateProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    role: '',
    bio: '',
    location: '',
    skills: '',
    linkedin_url: '',
    portfolio_links: '',
    work_samples: '',
    github_url: ''
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        router.push('/profile/setup')
        return
      }

      setFormData({
        id: data.id,
        full_name: data.full_name || '',
        role: data.role || '',
        bio: data.bio || '',
        location: data.location || '',
        skills: data.skills?.join(', ') || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_links: data.portfolio_links?.join(', ') || '',
        work_samples: data.work_samples?.join(', ') || '',
        github_url: data.github_url || ''
      })
      
      setLoading(false)
    }
    
    loadProfile()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    
    const supabase = createClient()
    
    const payload = {
      full_name: formData.full_name,
      role: formData.role,
      bio: formData.bio,
      location: formData.location,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      linkedin_url: formData.linkedin_url,
      portfolio_links: formData.portfolio_links.split(',').map(s => s.trim()).filter(Boolean),
      work_samples: formData.work_samples.split(',').map(s => s.trim()).filter(Boolean),
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', formData.id)

    if (dbError) {
      setError('Failed to update profile.')
    } else {
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F5A623]" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] pb-20">
      <div className="border-b border-[#27272a] px-6 py-4 bg-[#09090b] sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="text-xl font-serif font-medium">forge.</Link>
          <div className="flex items-center gap-4">
            {formData.id && (
              <Link href={`/profile/${formData.id}`} className="text-sm font-mono text-[#71717a] hover:text-[#F5A623] transition-colors">
                View Public Profile
              </Link>
            )}
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-4 py-2 bg-[#F5A623] text-[#09090b] text-sm font-mono font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif mb-2">Manage Profile</h1>
          <p className="text-sm font-mono text-[#71717a]">Update your information, links, and portfolio.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-[#f87171]/10 border border-[#f87171] text-[#f87171] text-sm font-mono">{error}</div>}
        {success && <div className="mb-6 p-4 bg-[#22c55e]/10 border border-[#22c55e] text-[#22c55e] text-sm font-mono">{success}</div>}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 bg-[#18181b] border border-[#27272a] space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-[#F5A623]">Personal Details</h2>
              
              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-2">Role / Headline</label>
                <input 
                  type="text" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})} 
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-mono text-[#71717a] mb-2"><MapPin size={12}/> Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-2">Bio</label>
                <textarea 
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})} 
                  rows={4}
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="p-6 bg-[#18181b] border border-[#27272a] space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-[#F5A623]">Professional Info</h2>
              
              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-2">Skills (Comma Separated)</label>
                <input 
                  type="text" 
                  value={formData.skills} 
                  onChange={e => setFormData({...formData, skills: e.target.value})} 
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-2">LinkedIn URL</label>
                <input 
                  type="url" 
                  value={formData.linkedin_url} 
                  onChange={e => setFormData({...formData, linkedin_url: e.target.value})} 
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-mono text-[#71717a] mb-2"><LinkIcon size={12}/> Portfolio Links (Comma Separated)</label>
                <textarea 
                  value={formData.portfolio_links} 
                  onChange={e => setFormData({...formData, portfolio_links: e.target.value})} 
                  rows={2}
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                  placeholder="https://mysite.com, https://github.com/..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-mono text-[#71717a] mb-2"><Video size={12}/> Work Samples / Embedded Media (Comma Separated)</label>
                <textarea 
                  value={formData.work_samples} 
                  onChange={e => setFormData({...formData, work_samples: e.target.value})} 
                  rows={2}
                  className="w-full bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
            <div className="p-6 bg-[#18181b] border border-[#27272a] space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-[#F5A623]">GitHub Integration</h2>
              
              <div>
                <label className="block text-xs font-mono text-[#71717a] mb-2">GitHub Profile URL</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={formData.github_url || ''} 
                    onChange={e => setFormData({...formData, github_url: e.target.value})} 
                    className="flex-1 bg-[#09090b] border border-[#27272a] p-3 text-sm font-mono focus:border-[#F5A623] outline-none" 
                    placeholder="https://github.com/yourusername"
                  />
                  <button 
                    onClick={async () => {
                      if (!formData.github_url) {
                        setError('Please enter a GitHub URL first.')
                        return
                      }
                      
                      const usernameMatch = formData.github_url.match(/github\.com\/([a-zA-Z0-9-]+)/)
                      const username = usernameMatch ? usernameMatch[1] : formData.github_url.split('/').filter(Boolean).pop()
                      
                      setSaving(true)
                      try {
                        const res = await fetch(`/api/github-profile?username=${username}`)
                        if (!res.ok) throw new Error('GitHub user not found')
                        const ghData = await res.json()
                        
                        const supabase = createClient()
                        const { error: dbError } = await supabase
                          .from('profiles')
                          .update({ 
                            github_repos: ghData.top_repos,
                            github_url: ghData.github_url
                          })
                          .eq('id', formData.id)
                          
                        if (dbError) throw dbError
                        
                        setSuccess(`Successfully synced ${ghData.top_repos.length} repositories!`)
                        setTimeout(() => setSuccess(''), 4000)
                      } catch (err: any) {
                        setError(err.message || 'Failed to sync GitHub repos.')
                      }
                      setSaving(false)
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-[#27272a] text-[#fafafa] font-mono text-sm border border-[#27272a] hover:bg-[#3f3f46] hover:border-[#F5A623] transition-all disabled:opacity-50"
                  >
                    Sync Repos
                  </button>
                </div>
                <p className="text-xs font-mono text-[#71717a] mt-2">Clicking "Sync Repos" will automatically fetch and display all your public repositories on your profile.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
