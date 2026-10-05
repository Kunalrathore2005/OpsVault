import { ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInView } from './useInView';

export default function CTASection({ onGetStartedClick, onLoginClick }) {
  const navigate = useNavigate();
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  const handleStart = () => {
    if (onGetStartedClick) onGetStartedClick();
    else navigate('/login');
  };

  const handleLogin = () => {
    if (onLoginClick) onLoginClick();
    else navigate('/login');
  };

  return (
    <section ref={sectionRef} className="landing-section" style={{ paddingBottom: '100px' }}>
      <div className="landing-container">
        <div className={`landing-cta-banner scroll-reveal ${inView ? 'visible' : ''}`}>
          <h2 className="landing-cta-title">Operations. Without the chaos.</h2>
          <p className="landing-cta-desc">
            Bring your teams, workflows and daily operations into one connected workspace. Get started with OpsVault today.
          </p>

          <div className="landing-cta-actions">
            <button
              type="button"
              className="landing-cta-btn-white"
              onClick={handleStart}
            >
              <span>Get Started Now</span>
            </button>

            <button
              type="button"
              className="landing-cta-btn-outline"
              onClick={handleLogin}
            >
              <span>Sign In to Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
