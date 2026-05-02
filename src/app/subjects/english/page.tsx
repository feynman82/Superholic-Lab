import type { Metadata } from 'next';
import HeroEnglish from '@/components/subjects/english/HeroEnglish';
import TrustStrip from '@/components/marketing/TrustStrip';
import ComponentsEnglish from '@/components/subjects/english/ComponentsEnglish';
import PillarDiagnoseEng from '@/components/subjects/english/PillarDiagnoseEng';
import PillarAnalyseEng from '@/components/subjects/english/PillarAnalyseEng';
import PillarPracticeEng from '@/components/subjects/english/PillarPracticeEng';
import PillarTutorEng from '@/components/subjects/english/PillarTutorEng';
import SampleQuestionEng from '@/components/subjects/english/SampleQuestionEng';
import SyllabusMapEng from '@/components/subjects/english/SyllabusMapEng';
import MisconceptionsEng from '@/components/subjects/english/MisconceptionsEng';
import PricingTeaser from '@/components/marketing/PricingTeaser';

export const metadata: Metadata = {
  title: 'Primary English — Diagnose, Analyse, Practise, Reinforce | Superholic Lab',
  description:
    'Singapore Primary English, taught component-by-component: 5 Paper 2 components in the question bank, Composition coached by Miss Wena. Live AL diagnosis, root-cause analysis, MOE-aligned practice.',
  alternates: { canonical: 'https://www.superholiclab.com/subjects/english' },
};

export default function EnglishPage() {
  return (
    <main className="page-as page-as--english">
      <HeroEnglish />
      <TrustStrip />
      <ComponentsEnglish />
      <PillarDiagnoseEng />
      <PillarAnalyseEng />
      <PillarPracticeEng />
      <PillarTutorEng />
      <SampleQuestionEng />
      <SyllabusMapEng />
      <MisconceptionsEng />
      <PricingTeaser subject="english" />
    </main>
  );
}
