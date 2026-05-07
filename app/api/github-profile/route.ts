import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }

  // Use server-side GitHub token if available to raise rate limits
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=8&type=owner`, { headers }),
  ])

  if (!userRes.ok) {
    return NextResponse.json({ error: 'GitHub user not found' }, { status: 404 })
  }

  const user = await userRes.json()
  const repos = reposRes.ok ? await reposRes.json() : []

  // Tally languages across repos
  const langCount: Record<string, number> = {}
  for (const repo of repos) {
    if (repo.language && !repo.fork) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1
    }
  }

  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)

  const total_stars = repos.reduce((acc: number, r: { stargazers_count: number }) => acc + r.stargazers_count, 0)

  const top_repos = repos
    .filter((r: { fork: boolean }) => !r.fork)
    .slice(0, 4)
    .map((r: { name: string; description: string; stargazers_count: number; language: string; html_url: string }) => ({
      name: r.name,
      description: r.description || '',
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url,
    }))

  return NextResponse.json({
    login: user.login,
    name: user.name || user.login,
    avatar_url: user.avatar_url,
    bio: user.bio || '',
    followers: user.followers,
    public_repos: user.public_repos,
    languages,
    top_repos,
    total_stars,
    github_url: user.html_url,
  })
}
