import PassiveDiagnosis from '@/components/PassiveDiagnosis';
import Hero from '@/components/Hero';
import FailureMirror from '@/components/FailureMirror';
import Consequences from '@/components/Consequences';
import Simulator from '@/components/Simulator';
import CommitmentGradient from '@/components/CommitmentGradient';
import Verification from '@/components/Verification';
import Credibility from '@/components/Credibility';
import SocialProof from '@/components/SocialProof';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <PassiveDiagnosis />
      <Hero />
      <FailureMirror />
      <Consequences />
      <Simulator />
      <CommitmentGradient />
      <Verification />
      <Credibility />
      <SocialProof />
      <FAQ />
      <Footer />
    </main>
  );
}
