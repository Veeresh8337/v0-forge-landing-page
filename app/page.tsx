import { Navbar } from '@/components/forge/navbar';
import { HeroSection } from '@/components/forge/hero-section';
import { ProblemStatement } from '@/components/forge/problem-statement';
import { AIScopingSection } from '@/components/forge/ai-scoping-section';
import { TalentCardGrid } from '@/components/forge/talent-card-grid';
import { HowItWorks } from '@/components/forge/how-it-works';
import { Footer } from '@/components/forge/footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <ProblemStatement />
      <AIScopingSection />
      <TalentCardGrid />
      <HowItWorks />
      <Footer />
    </main>
  );
}
