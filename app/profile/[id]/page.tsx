import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Star, Github, Linkedin, ExternalLink, Code2 } from 'lucide-react'
import { cookies } from 'next/headers'
import { VideoEmbed } from '@/components/forge/video-embed'

// Parallel Data Fetching
async function getProfileData(id: string) {
  if (id === 'undefined') {
    return { error: "Invalid profile link. Please navigate back and try again." }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  // Fire all queries simultaneously for maximum speed
  const [profileRes, projectsRes, reviewsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('bids').select('projects!inner(*)').eq('student_id', id).eq('status', 'accepted').eq('projects.status', 'completed'),
    supabase.from('reviews').select('*, client:profiles!client_id(full_name, avatar_url)').eq('freelancer_id', id)
  ])

  if (profileRes.error || !profileRes.data) {
    console.error("Profile Error:", JSON.stringify(profileRes.error, null, 2));
    console.error("Projects Error:", JSON.stringify(projectsRes.error, null, 2));
    console.error("Reviews Error:", JSON.stringify(reviewsRes.error, null, 2));
    
    // PGRST116 means 0 rows returned
    if (profileRes.error?.code === 'PGRST116') {
      return { error: "This profile does not exist or is currently unpublished." }
    }
    
    return { error: profileRes.error?.message || "Profile not found" }
  }

  let githubData = null;
  let githubRepos = profileRes.data.github_repos || [];

  // Dynamically fetch GitHub profile and all repos to guarantee fresh "Mini GitHub Profile"
  if (profileRes.data.github_url) {
    try {
      const match = profileRes.data.github_url.match(/github\.com\/([^\/]+)/i);
      if (match && match[1]) {
        const username = match[1];
        
        const headers: any = { 'Accept': 'application/vnd.github.v3+json' };
        if (process.env.GITHUB_TOKEN) {
          headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }

        const [ghUserRes, ghReposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}`, { headers, next: { revalidate: 3600 } }),
          fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers, next: { revalidate: 3600 } })
        ]);

        if (ghUserRes.ok && ghReposRes.ok) {
          const ghUser = await ghUserRes.json();
          const ghReposRaw = await ghReposRes.json();
          
          githubData = {
            followers: ghUser.followers,
            following: ghUser.following,
            public_repos: ghUser.public_repos,
            avatar_url: ghUser.avatar_url,
            login: ghUser.login
          };

          githubRepos = ghReposRaw.map((r: any) => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            url: r.html_url,
            updated_at: r.updated_at
          }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch dynamic github profile", e);
    }
  }

  return {
    profile: profileRes.data,
    completedProjects: projectsRes.data ? projectsRes.data.map((b: any) => b.projects) : [],
    reviews: reviewsRes.data || [],
    githubData,
    githubRepos
  }
}

export default async function ProfilePage({ params }: { params: any }) {
  console.log("Raw params:", params);
  const resolvedParams = await params;
  console.log("Resolved params:", resolvedParams);
  
  if (!resolvedParams?.id) {
    return <div className="text-white p-8">Error: No ID provided in URL params. Raw params: {JSON.stringify(params)}</div>
  }

  const data = await getProfileData(resolvedParams.id)
  
  if ('error' in data) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-serif text-[#f87171] mb-4">Database Error</h1>
        <p className="font-mono text-sm bg-[#18181b] p-4 border border-[#27272a]">{data.error}</p>
        <p className="text-xs font-mono text-[#71717a] mt-4">Did you run the SQL migration for the new tables?</p>
      </div>
    )
  }
  
  const { profile, completedProjects, reviews, githubData, githubRepos } = data

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Navbar */}
      <div className="border-b border-[#27272a] px-6 py-4 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
          <Link href="/" className="text-xl font-serif font-medium">forge.</Link>
          <span className="text-xs font-mono tracking-widest text-[#F5A623] uppercase">Public Profile</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT SIDEBAR: Details */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-6 border border-[#27272a] bg-[#18181b] animate-fade-up">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 object-cover border border-[#27272a] mb-4" />
              ) : (
                <div className="w-24 h-24 bg-[#27272a] flex items-center justify-center font-serif text-3xl mb-4">
                  {profile.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <h1 className="text-2xl font-serif font-medium">{profile.full_name}</h1>
              <p className="text-sm font-mono text-[#F5A623] mt-1">{profile.title || (profile.role === 'student' ? 'Freelancer' : profile.role)}</p>
              
              {profile.location && (
                <div className="flex items-center gap-2 mt-4 text-xs font-mono text-[#a1a1aa]">
                  <MapPin size={12} /> {profile.location}
                </div>
              )}

              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-[#27272a]">
                <div className="text-center">
                  <div className="text-xl font-serif">{profile.average_rating || '5.0'}</div>
                  <div className="text-xs font-mono text-[#71717a]">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-serif">{reviews.length}</div>
                  <div className="text-xs font-mono text-[#71717a]">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-serif">{completedProjects.length}</div>
                  <div className="text-xs font-mono text-[#71717a]">Projects</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <p className="text-xs font-mono tracking-widest uppercase text-[#71717a]">Links</p>
              <div className="flex flex-col gap-2">
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#18181b] border border-[#27272a] text-sm font-mono hover:border-[#F5A623] transition-colors">
                    <Github size={14} className="text-[#a1a1aa]" /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#18181b] border border-[#27272a] text-sm font-mono hover:border-[#F5A623] transition-colors">
                    <Linkedin size={14} className="text-[#a1a1aa]" /> LinkedIn
                  </a>
                )}
                {profile.portfolio_links?.map((link: string, i: number) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#18181b] border border-[#27272a] text-sm font-mono hover:border-[#F5A623] transition-colors">
                    <ExternalLink size={14} className="text-[#a1a1aa]" /> Portfolio {i + 1}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 animate-fade-up" style={{ animationDelay: '150ms' }}>
              <p className="text-xs font-mono tracking-widest uppercase text-[#71717a]">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#a1a1aa]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-12">
            
            <section className="animate-fade-up">
              <h2 className="text-xl font-serif mb-4">About</h2>
              <p className="text-sm font-mono text-[#a1a1aa] leading-relaxed">
                {profile.bio || "No biography provided."}
              </p>
            </section>

            {profile.work_samples && profile.work_samples.length > 0 && (
              <section className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                <h2 className="text-xl font-serif mb-4">Work Samples</h2>
                <div className="space-y-6">
                  {profile.work_samples.map((sample: string, idx: number) => (
                    <VideoEmbed key={idx} url={sample} />
                  ))}
                </div>
              </section>
            )}

            {githubData && (
              <section className="animate-fade-up" style={{ animationDelay: '140ms' }}>
                <a href={profile.github_url} target="_blank" className="block p-5 bg-[#18181b] border border-[#27272a] hover:border-[#F5A623] transition-colors group mb-6">
                  <div className="flex items-center gap-4">
                    <img src={githubData.avatar_url} className="w-12 h-12 rounded-full border border-[#3f3f46]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-serif text-[#fafafa] group-hover:text-[#F5A623] transition-colors">{githubData.login}</h3>
                        <Github size={16} className="text-[#a1a1aa]" />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-[#71717a] mt-1">
                        <span>{githubData.public_repos} Repositories</span>
                        <span>{githubData.followers} Followers</span>
                        <span>{githubData.following} Following</span>
                      </div>
                    </div>
                  </div>
                </a>
              </section>
            )}

            {githubRepos && githubRepos.length > 0 && (
              <section className="animate-fade-up" style={{ animationDelay: '150ms' }}>
                <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                  <Code2 size={20} /> Open Source Projects ({githubRepos.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {githubRepos.map((repo: any) => (
                    <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer" className="block p-5 bg-[#18181b] border border-[#27272a] hover:border-[#F5A623] transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-mono font-medium text-[#fafafa] truncate">{repo.name}</h3>
                        <ExternalLink size={14} className="text-[#71717a] group-hover:text-[#F5A623] opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-xs font-mono text-[#71717a] line-clamp-2 mb-4 h-8">{repo.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-4 text-xs font-mono text-[#52525b]">
                        {repo.language && <span className="flex items-center gap-1"><Code2 size={12} /> {repo.language}</span>}
                        <span className="flex items-center gap-1 text-[#F5A623]"><Star size={12} /> {repo.stars}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {completedProjects && completedProjects.length > 0 && (
              <section className="animate-fade-up" style={{ animationDelay: '175ms' }}>
                <h2 className="text-xl font-serif mb-4">Completed Projects on Forge</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {completedProjects.map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}/dashboard`} className="block p-5 bg-[#18181b] border border-[#27272a] hover:border-[#F5A623] transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-serif font-medium text-[#fafafa] truncate">{project.title}</h3>
                        <ExternalLink size={14} className="text-[#71717a] group-hover:text-[#F5A623] opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-xs font-mono text-[#71717a] line-clamp-2 mb-4 h-8">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs font-mono text-[#52525b]">
                        <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">Completed</span>
                        <span>{project.budget}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="animate-fade-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-xl font-serif mb-4">Client Reviews</h2>
              {reviews.length === 0 ? (
                <div className="p-8 text-center border border-[#27272a] border-dashed">
                  <Star size={24} className="mx-auto text-[#3f3f46] mb-3" />
                  <p className="text-sm font-mono text-[#71717a]">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-5 border border-[#27272a] bg-[#18181b]">
                      <div className="flex items-center gap-1 text-[#F5A623] mb-3">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-sm font-mono text-[#fafafa] italic mb-3">"{review.comment}"</p>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#27272a]">
                        {review.client?.avatar_url ? (
                          <img src={review.client.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#27272a]" />
                        )}
                        <span className="text-xs font-mono text-[#a1a1aa]">{review.client?.full_name || 'Anonymous Client'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
