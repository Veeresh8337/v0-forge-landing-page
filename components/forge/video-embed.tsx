'use client'

import React from 'react'

interface VideoEmbedProps {
  url: string
}

export function VideoEmbed({ url }: VideoEmbedProps) {
  const getEmbedUrl = (rawUrl: string) => {
    try {
      const urlObj = new URL(rawUrl)
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = ''
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1)
        } else {
          videoId = urlObj.searchParams.get('v') || ''
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
      
      // Vimeo
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop()
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null
      }
      
      return null
    } catch {
      return null
    }
  }

  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block p-4 bg-[#18181b] border border-[#27272a] text-sm font-mono text-[#a1a1aa] hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
      >
        External Link: {url}
      </a>
    )
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-sm border border-[#27272a] bg-[#09090b]">
      <iframe
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  )
}
