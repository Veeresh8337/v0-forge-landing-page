'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'client') {
        router.replace('/dashboard/client')
      } else {
        router.replace('/dashboard/freelancer')
      }
    }
    redirect()
  }, [])

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#F5A623]" />
    </div>
  )
}
