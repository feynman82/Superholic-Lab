import type { Metadata } from 'next';
import HeroScience from '@/components/subjects/science/HeroScience';
import TrustStrip from '@/components/marketing/TrustStrip';
import ThemesScience from '@/components/subjects/science/ThemesScience';
import PillarDiagnoseSci from '@/components/subjects/science/PillarDiagnoseSci';
import PillarAnalyseSci from '@/components/subjects/science/PillarAnalyseSci';
import PillarPracticeSci from '@/components/subjects/science/PillarPracticeSci';
import PillarTutorSci from '@/components/subjects/science/PillarTutorSci';
import SampleQuestionSci from '@/components/subjects/science/SampleQuestionSci';
import SyllabusMapSci from '@/components/subjects/science/SyllabusMapSci';
import MisconceptionsSci from '@/components/subjects/science/MisconceptionsSci';
import PricingTeaser from '@/components/marketing/PricingTeaser';

export const metadata: Metadata = {
  title: 'Primary Science — Diagnose, Analyse, Practise, Reinforce | Superholic Lab',
  description:
    'Singapore Primary Science, taught the way examiners mark it: Claim, Evidence, Reason. Live AL diagnosis, root-cause analysis, MOE-aligned practice, and Miss Wena reinforcement.',
  alternates: { canonical: 'https://www.superholiclab.com/subjects/science' },
};

export default function SciencePage() {
  return (
    <main className="page-as page-as--science">
      <HeroScience />
      <TrustStrip />
      <ThemesScience />
      <PillarDiagnoseSci />
      <PillarAnalyseSci />
      <PillarPracticeSci />
      <PillarTutorSci />
      <SampleQuestionSci />
      <SyllabusMapSci />
      <MisconceptionsSci />
      <PricingTeaser subject="science" />
    </main>
  );
}
