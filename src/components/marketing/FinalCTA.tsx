import FadeUp from './motion/FadeUp';
import Dog from './Dog';

interface Props { subject: 'mathematics' | 'science' | 'english'; }

export default function FinalCTA({ subject }: Props) {
  return (
    <section className="final-cta-section" data-section="final-cta">
      <div className="container-as final-cta-inner">
        <FadeUp>
          <h2 className="h1-as final-cta-h2">Begin a 7-day free trial.</h2>
          <p className="body-lg final-cta-sub">No credit card. No commitment.</p>
          <a
            href={`/pages/signup.html?subject=${subject}&mode=trial`}
            className="btn btn-primary"
            data-auth-cta
            data-plausible-event={`trial_start_final_${subject}`}
          >
            Start free trial
          </a>
          <p className="label-caps confidence-strip">
            PDPA REGISTERED · 7-DAY REFUND · CANCEL ANYTIME · SINGAPORE SERVERS
          </p>
        </FadeUp>
        <div className="final-cta-dog" aria-hidden="true">
          <Dog variant="bookend" />
        </div>
      </div>
    </section>
  );
}
