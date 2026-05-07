'use client';

import { StepItem } from './step-item';

export function HowItWorks() {
  return (
    <section id="how" className="bg-[#F5F4F0] py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-[#0D0D0D] mb-4 sm:mb-6 text-balance">
            How Forge Works
          </h2>
          <p className="text-base sm:text-lg font-sans text-[#8A8A8A] max-w-2xl mx-auto">
            From project posting to delivery, Forge handles everything to ensure smooth collaboration.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
          <StepItem 
            number={1} 
            title="Post Your Project" 
            description="Describe what you need built. Our AI analyzes the scope to find the perfect match."
          />
          <StepItem 
            number={2} 
            title="Connect with Talent" 
            description="Browse matched developers and start conversations. Compare rates and timelines."
          />
          <StepItem 
            number={3} 
            title="Build Together" 
            description="Collaborate with your developer using our built-in tools, then release payment upon completion."
          />
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <button className="px-6 sm:px-8 py-3 bg-[#F5A623] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium border-2 border-[#F5A623] hover:bg-[#0D0D0D] hover:text-[#F5A623] transition-all duration-200">
            Post Your First Project
          </button>
        </div>
      </div>
    </section>
  );
}
