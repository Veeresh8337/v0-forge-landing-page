'use client';

import { StatCallout } from './stat-callout';

export function ProblemStatement() {
  return (
    <section className="bg-[#0D0D0D] py-16 sm:py-24 grain-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-20">
          <StatCallout number="2.3K+" label="Student Developers" />
          <StatCallout number="$1.2M" label="Projects Completed" />
          <StatCallout number="4.9★" label="Average Rating" />
        </div>
        
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#F5F4F0] leading-tight text-balance">
            Finding good junior talent is hard. Finding great ones is nearly impossible.
          </h2>
          <p className="text-base sm:text-lg font-sans text-[#8A8A8A]">
            Traditional job boards flood you with unvetted candidates. Forge cuts through the noise by connecting you directly with verified student developers who have proven track records on real projects.
          </p>
        </div>
      </div>
    </section>
  );
}
