'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Forge AI. Tell me what you're trying to build, and I'll help you scope the project, estimate the budget, and find the perfect freelancers."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Simulate AI thinking and querying Supabase for freelancers
    setTimeout(async () => {
      const supabase = createClient()
      
      // Simulate smart search based on keywords
      const keywords = ['react', 'node', 'web', 'app', 'design', 'backend', 'frontend', 'ai', 'python']
      const matchedKeyword = keywords.find(k => userMessage.content.toLowerCase().includes(k)) || 'developer'

      const { data: freelancers } = await supabase
        .from('profiles')
        .select('id, full_name, role, skills')
        .contains('skills', [matchedKeyword])
        .limit(2)

      let aiResponse = "Based on your request, I estimate this project will take about 2-4 weeks with a budget around $500 - $1500.\n\n"
      
      if (freelancers && freelancers.length > 0) {
        aiResponse += `I found some excellent freelancers who specialize in this:\n`
        freelancers.forEach(f => {
          aiResponse += `- **${f.full_name || 'Anonymous'}** (${f.role}): specialized in ${f.skills?.slice(0, 3).join(', ')}\n`
        })
      } else {
        aiResponse += "I recommend checking our Talent Board for developers with those specific skills!"
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse }])
      setLoading(false)
    }, 1500)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-[#F5A623] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Sparkles size={24} className="text-[#0D0D0D]" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white border-2 border-[#8A8A8A] shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-[#0D0D0D] p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-[#F5A623]" />
              <span className="font-serif font-medium">Forge AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#8A8A8A] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F4F0]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm font-sans whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-[#F5A623] text-[#0D0D0D] rounded-l-lg rounded-tr-lg' 
                    : 'bg-white border border-[#8A8A8A] text-[#0D0D0D] rounded-r-lg rounded-tl-lg'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#8A8A8A] p-3 rounded-r-lg rounded-tl-lg flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#F5A623]" />
                  <span className="text-xs font-sans text-[#8A8A8A]">Analyzing project...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t-2 border-[#8A8A8A] shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Describe your project idea..."
                className="flex-1 bg-[#F5F4F0] border border-[#8A8A8A] p-2 text-sm font-sans focus:outline-none focus:border-[#F5A623] transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2 bg-[#0D0D0D] text-white hover:bg-[#F5A623] hover:text-[#0D0D0D] transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
