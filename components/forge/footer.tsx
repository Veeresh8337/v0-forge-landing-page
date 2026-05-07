'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0D0D0D] border-t-2 border-[#8A8A8A] py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-lg font-serif font-medium text-[#F5F4F0] mb-4">forge.</h3>
            <p className="text-sm font-sans text-[#8A8A8A]">
              Connecting student developers with premium opportunities.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-sm font-sans font-medium text-[#F5F4F0] mb-4 uppercase tracking-wide">For Clients</h4>
            <ul className="space-y-3">
              <li><Link href="/talent" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Browse Talent</Link></li>
              <li><Link href="/auth/login" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Post Project</Link></li>
              <li><Link href="#pricing" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Pricing</Link></li>
              <li><Link href="#how" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* For Developers */}
          <div>
            <h4 className="text-sm font-sans font-medium text-[#F5F4F0] mb-4 uppercase tracking-wide">For Developers</h4>
            <ul className="space-y-3">
              <li><Link href="/projects" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Find Work</Link></li>
              <li><Link href="/auth/login" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Apply Now</Link></li>
              <li><Link href="/auth/login" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Build Profile</Link></li>
              <li><Link href="#resources" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-sans font-medium text-[#F5F4F0] mb-4 uppercase tracking-wide">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">About</a></li>
              <li><a href="#" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Careers</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t-2 border-[#8A8A8A] pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <p className="text-xs font-sans text-[#8A8A8A] order-3 sm:order-1">
            &copy; 2024 Forge. All rights reserved.
          </p>
          <div className="flex gap-6 order-2">
            <a href="#" className="text-xs font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Privacy</a>
            <a href="#" className="text-xs font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Terms</a>
            <a href="#" className="text-xs font-sans text-[#8A8A8A] hover:text-[#F5A623] transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
