import type { Metadata } from 'next';
import HeroMaths from '@/components/subjects/mathematics/HeroMaths';
import TrustStrip from '@/components/marketing/TrustStrip';
import StrandsMaths from '@/components/subjects/mathematics/StrandsMaths';
import PillarDiagnose from '@/components/subjects/mathematics/PillarDiagnose';
import PillarAnalyse from '@/components/subjects/mathematics/PillarAnalyse';
import PillarPractice from '@/components/subjects/mathematics/PillarPractice';
import PillarTutor from '@/components/subjects/mathematics/PillarTutor';
import SampleQuestion from '@/components/subjects/mathematics/SampleQuestion';
import SyllabusMap from '@/components/subjects/mathematics/SyllabusMap';
import Misconceptions from '@/components/subjects/mathematics/Misconceptions';
import PricingTeaser from '@/components/marketing/PricingTeaser';

export const metadata: Metadata = {
  title: 'Primary Mathematics — Diagnose, Analyse, Practise, Reinforce | Superholic Lab',
  description:
    'Singapore Primary Mathematics, mastered through the four-pillar method: live AL diagnosis, root-cause weakness analysis, MOE-aligned practice, and Miss Wena reinforcement.',
  alternates: { canonical: 'https://www.superholiclab.com/subjects/mathematics' },
};

export default function MathematicsPage() {
  return (
    <main className="page-as">
      <HeroMaths />
      <TrustStrip />
      <StrandsMaths />
      <PillarDiagnose />
      <PillarAnalyse />
      <PillarPractice />
      <PillarTutor />
      <SampleQuestion />
      <SyllabusMap />
      <Misconceptions />
      <PricingTeaser subject="mathematics" />
    </main>
  );
}
