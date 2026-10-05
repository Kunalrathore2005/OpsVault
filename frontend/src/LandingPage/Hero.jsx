import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle } from 'lucide-react';
import HeroVideo from './HeroVideo';
import { useNavigate } from 'react-router-dom';

const PHRASES = [
  'Engineering Teams',
  'Operations Leads',
  'Enterprise Managers',
  'Growing Businesses',
  'D2C & Modern Brands'
];

export default function Hero({ onGetStartedClick }) {
  const navigate = useNavigate();

  // Typewriter effect state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentPhrase.substring(0, text.length + 1));
        setTypingSpeed(90);

        if (text === currentPhrase) {
          // Pause at full word
          setTypingSpeed(1800);
          setIsDeleting(true);
        }
      } else {
        setText(currentPhrase.substring(0, text.length - 1));
        setTypingSpeed(45);

        if (text === '') {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
          setTypingSpeed(400);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, typingSpeed]);

  const handleExploreClick = () => {
    const el = document.getElementById('how-it-works') || document.getElementById('product');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="landing-hero">
      <div className="landing-container">
        <div className="landing-hero-grid">
          {/* LEFT SIDE: Headline, Typewriter, CTAs, Trust Points */}
          <div className="landing-hero-left">
            <div className="landing-hero-pill-anim">
              <div className="landing-pill">
                <Sparkles size={14} />
                <span>Next-Generation Operations Management</span>
              </div>
            </div>

            <h1 className="landing-hero-title">
              Run Your Business Operations{' '}
              <span className="landing-hero-gradient">in One Place.</span>
            </h1>

            <div className="landing-hero-sub-typewriter">
              <span>Engineered for </span>
              <span className="landing-typed-highlight">{text}</span>
              <span className="landing-typing-cursor">|</span>
            </div>

            <p className="landing-hero-desc">
              Manage people, tasks, workflows, incidents, assets, documents and daily operations through one connected platform.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-btn-primary"
                onClick={onGetStartedClick || (() => navigate('/login'))}
              >
                <span>Get Started</span>
                <ArrowRight size={16} className="btn-arrow-icon" />
              </button>

              <button
                type="button"
                className="landing-btn-secondary"
                onClick={handleExploreClick}
              >
                <span>Explore Platform</span>
                <ArrowRight size={15} className="btn-arrow-icon" />
              </button>
            </div>

            <div className="landing-hero-trust-badges">
              <div className="landing-hero-badge-item">
                <CheckCircle size={15} color="var(--success)" />
                <span>Zero Config Setup</span>
              </div>
              <div className="landing-hero-badge-item">
                <ShieldCheck size={15} color="var(--primary)" />
                <span>Strict Enterprise RBAC</span>
              </div>
              <div className="landing-hero-badge-item">
                <CheckCircle size={15} color="var(--success)" />
                <span>24/7 SLA Automation</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: 3D Product Showcase Video */}
          <div className="landing-hero-right">
            <HeroVideo />
          </div>
        </div>
      </div>
    </section>
  );
}


