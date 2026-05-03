import type { Metadata } from 'next';
import HeroAbout from '@/components/about/HeroAbout';
import ManifestoSpine from '@/components/about/ManifestoSpine';
import ProblemAbout from '@/components/about/ProblemAbout';
import MethodAbout from '@/components/about/MethodAbout';
import EngineAbout from '@/components/about/EngineAbout';
import ShippingAbout from '@/components/about/ShippingAbout';
import CompassAbout from '@/components/about/CompassAbout';
import ProofAbout from '@/components/about/ProofAbout';
import ClosingAbout from '@/components/about/ClosingAbout';

export const metadata: Metadata = {
  title: 'About — Built solo. Built honestly. | Superholic Lab',
  description:
    "Superholic Lab is built by a small Singapore team that got tired of assessment books that don't explain why. Read the method, the engine, and what we ship today.",
  alternates: { canonical: 'https://www.superholiclab.com/about' },
};

export default function AboutPage() {
  return (
    <main className="page-as page-as--about">
      <ManifestoSpine />
      <HeroAbout />
      <ProblemAbout />
      <MethodAbout />
      <EngineAbout />
      <ShippingAbout />
      <CompassAbout />
      <ProofAbout />
      <ClosingAbout />
    </main>
  );
}
