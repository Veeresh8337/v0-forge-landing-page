'use client';

export function AIScopingSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left side - Chat UI Mock */}
          <div className="border-2 border-[#8A8A8A] p-6 sm:p-8 bg-[#F5F4F0]">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-xs bg-[#F5A623] text-[#0D0D0D] px-4 py-3 font-sans text-sm border-2 border-[#F5A623]">
                  Build a booking calendar for a fitness startup
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-xs bg-[#8A8A8A] text-[#F5F4F0] px-4 py-3 font-sans text-sm border-2 border-[#8A8A8A]">
                  I found 5 perfect matches for this project. Here's the estimated scope:
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-xs bg-[#8A8A8A] text-[#F5F4F0] px-4 py-3 font-sans text-sm space-y-2 border-2 border-[#8A8A8A]">
                  <div>• Tech Stack: React + Node.js</div>
                  <div>• Timeline: 3-4 weeks</div>
                  <div>• Budget Range: $2,500 - $4,500</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Feature description */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#0D0D0D] mb-3 sm:mb-4 text-balance">
                Smart Project Scoping
              </h2>
              <p className="text-base sm:text-lg font-sans text-[#8A8A8A]">
                Our AI analyzes your project details and instantly suggests the best student developers, estimated timeline, and fair pricing. No guessing games.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 border-2 border-[#F5A623] text-[#F5A623] font-serif font-medium">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-medium text-[#0D0D0D]">Describe Your Project</h3>
                  <p className="text-sm font-sans text-[#8A8A8A] mt-1">Tell us what you need built in natural language</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 border-2 border-[#F5A623] text-[#F5A623] font-serif font-medium">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-medium text-[#0D0D0D]">AI Analyzes Scope</h3>
                  <p className="text-sm font-sans text-[#8A8A8A] mt-1">Our system identifies tech stack, timeline, and complexity</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 border-2 border-[#F5A623] text-[#F5A623] font-serif font-medium">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-medium text-[#0D0D0D]">Get Perfect Matches</h3>
                  <p className="text-sm font-sans text-[#8A8A8A] mt-1">We show you developers who have done similar work</p>
                </div>
              </div>
            </div>
            
            <button className="px-6 sm:px-8 py-3 bg-[#F5A623] text-[#0D0D0D] font-sans text-sm sm:text-base font-medium border-2 border-[#F5A623] hover:bg-[#0D0D0D] hover:text-[#F5A623] transition-all duration-200 w-full sm:w-auto">
              Try Smart Scoping
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
