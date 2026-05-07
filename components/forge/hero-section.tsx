'use client';

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white grain flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient dot (subtle) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-96 h-96 bg-gradient-radial from-[#F5A623]/5 to-transparent rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left content */}
          <div className="flex flex-col gap-6 sm:gap-8">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium text-[#0D0D0D] leading-tight mb-4 sm:mb-6 animate-fade-up text-balance">
                Connect exceptional student developers with opportunity
              </h1>
              <p className="text-base sm:text-lg font-sans text-[#8A8A8A] max-w-md animate-fade-up-delay-1">
                Forge matches top talent with premium freelance projects. Build your portfolio while working on real-world problems.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-up-delay-2">
              <button className="px-6 sm:px-8 py-3 bg-[#F5A623] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium border-2 border-[#F5A623] hover:bg-[#0D0D0D] hover:text-[#F5A623] transition-all duration-200">
                Browse Projects
              </button>
              <button className="px-6 sm:px-8 py-3 border-2 border-[#0D0D0D] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium hover:border-[#F5A623] hover:text-[#F5A623] transition-all duration-200">
                View Talent
              </button>
            </div>
          </div>
          
          {/* Right side - Floating card mock */}
          <div className="relative h-96 hidden md:flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Floating card */}
              <div className="w-full max-w-sm border-2 border-[#8A8A8A] p-6 bg-white shadow-2xl animate-float">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-[#F5A623] rounded-full mb-4" />
                  <h3 className="text-lg font-serif font-medium text-[#0D0D0D]">Alex Chen</h3>
                  <p className="text-sm font-sans text-[#8A8A8A]">Full Stack Developer</p>
                </div>
                
                <div className="mb-4">
                  <div className="text-xs font-sans text-[#8A8A8A] mb-2">SKILLS</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs font-sans bg-[#F5F4F0] text-[#0D0D0D] px-2 py-1 border border-[#8A8A8A]">React</span>
                    <span className="text-xs font-sans bg-[#F5F4F0] text-[#0D0D0D] px-2 py-1 border border-[#8A8A8A]">Node.js</span>
                    <span className="text-xs font-sans bg-[#F5F4F0] text-[#0D0D0D] px-2 py-1 border border-[#8A8A8A]">TypeScript</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t-2 border-[#8A8A8A]">
                  <p className="text-xs font-sans text-[#8A8A8A]">⭐ 842 stars on open source</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
