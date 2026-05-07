'use client';

import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-2 border-[#8A8A8A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-lg sm:text-xl font-serif font-medium text-[#0D0D0D]">
            forge.
          </Link>
        </div>
        
        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8 lg:gap-12 absolute left-1/2 transform -translate-x-1/2">
          <Link href="#talent" className="text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
            Talent
          </Link>
          <Link href="#features" className="text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
            Features
          </Link>
          <Link href="#how" className="text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors">
            How It Works
          </Link>
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-xs sm:text-sm font-sans text-[#0D0D0D] hover:text-[#F5A623] transition-colors hidden sm:inline">
            Sign In
          </button>
          <button className="px-4 sm:px-6 py-2 border-2 border-[#F5A623] text-[#F5A623] font-sans text-xs sm:text-sm font-medium hover:bg-[#F5A623] hover:text-[#0D0D0D] transition-all duration-200">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
