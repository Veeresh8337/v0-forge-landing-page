import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { description } = await req.json()

  if (!description || description.trim().length < 10) {
    return NextResponse.json({ error: 'Description too short' }, { status: 400 })
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a senior technical project manager at a premium dev agency. Given a client's raw project description, generate a concise, structured project scope. Return ONLY a JSON object with these exact fields:
{
  "title": "Short, professional project title (max 6 words)",
  "summary": "2-sentence executive summary of the project",
  "tech_stack": ["technology1", "technology2", "technology3", "technology4"],
  "budget_range": "e.g. $800–$2,000",
  "timeline": "e.g. 2–3 weeks",
  "milestones": [
    { "title": "Milestone title", "description": "Concrete deliverable in one sentence", "duration": "e.g. 3 days" },
    { "title": "...", "description": "...", "duration": "..." },
    { "title": "...", "description": "...", "duration": "..." },
    { "title": "...", "description": "...", "duration": "..." }
  ]
}
Return valid JSON only. No markdown, no extra text.`,
        },
        { role: 'user', content: description },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.65,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
  }

  const data = await response.json()
  const scoped = JSON.parse(data.choices[0].message.content)
  return NextResponse.json(scoped)
}
