'use client';

import { TalentCard } from './talent-card';

export function TalentCardGrid() {
  const talents = [
    {
      name: 'Alex Chen',
      role: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      github: 'https://github.com/alexchen',
      stars: 842,
    },
    {
      name: 'Jamie Rodriguez',
      role: 'Backend Engineer',
      skills: ['Go', 'Rust', 'Kubernetes', 'AWS'],
      github: 'https://github.com/jamierodriguez',
      stars: 1204,
    },
    {
      name: 'Sam Patel',
      role: 'Frontend Specialist',
      skills: ['React', 'Next.js', 'Tailwind', 'Framer Motion'],
      github: 'https://github.com/sampatel',
      stars: 567,
    },
  ];

  return (
    <section id="talent" className="bg-white py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#0D0D0D] mb-4 sm:mb-6 text-balance">
            Top Developers on Forge
          </h2>
          <p className="text-base sm:text-lg font-sans text-[#8A8A8A] max-w-2xl">
            Browse from a curated selection of the best student developers. Every profile is verified and rated by real clients.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {talents.map((talent) => (
            <TalentCard key={talent.name} {...talent} />
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <button className="px-6 sm:px-8 py-3 border-2 border-[#0D0D0D] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium hover:border-[#F5A623] hover:text-[#F5A623] transition-all duration-200">
            View All Developers
          </button>
        </div>
      </div>
    </section>
  );
}
