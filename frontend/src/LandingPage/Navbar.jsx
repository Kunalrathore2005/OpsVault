import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles, Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onLoginClick, onGetStartedClick, dark, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Notice Bar (Reference: parceluncle.com notice bar) */}
      <div className="landing-top-notice">
        <div className="landing-container">
          <p>
            <strong>◈ Official Operational Release:</strong> OpsVault Enterprise SLA & Automation Engine is active. 
            <span style={{ opacity: 0.85, marginLeft: 6 }}>No credentials required for public demo exploration.</span>
          </p>
        </div>
      </div>

      <header className={`landing-navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-container">
          <nav className="landing-navbar" aria-label="Main navigation">
            <div className="landing-nav-left">
              <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span className="landing-brand-icon">◈</span>
                <span>OpsVault</span>
              </div>

              <ul className="landing-nav-links">
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('product')}>
                    Product
                  </button>
                </li>
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('how-it-works')}>
                    How It Works
                  </button>
                </li>
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('automation')}>
                    Automation & SLA
                  </button>
                </li>
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('features')}>
                    Features
                  </button>
                </li>
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('solutions')}>
                    Solutions
                  </button>
                </li>
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('contact')}>
                    Contact
                  </button>
                </li>
                <li>
                  <button type="button" className="landing-nav-link" onClick={() => scrollToSection('faq')}>
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div className="landing-nav-right">
              <button
                type="button"
                className="landing-btn-secondary landing-btn-sm"
                onClick={onLoginClick || (() => navigate('/login'))}
              >
                Sign In
              </button>

              <button
                type="button"
                className="landing-btn-primary landing-btn-sm"
                onClick={onGetStartedClick || (() => navigate('/login'))}
              >
                <span>Get Started</span>
                <ArrowRight size={14} className="btn-arrow-icon" />
              </button>

              <button
                type="button"
                className="landing-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="landing-mobile-menu open">
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('product')}>
              Product Overview
            </button>
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('automation')}>
              Automation & SLA
            </button>
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('features')}>
              Features Suite
            </button>
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('solutions')}>
              Role-Based Solutions
            </button>
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('contact')}>
              Get In Touch
            </button>
            <button type="button" className="landing-mobile-link" onClick={() => scrollToSection('faq')}>
              FAQ
            </button>

            <div className="landing-mobile-actions">
              <button
                type="button"
                className="landing-btn-secondary"
                style={{ width: '100%' }}
                onClick={onLoginClick || (() => navigate('/login'))}
              >
                Sign In to Workspace
              </button>
              <button
                type="button"
                className="landing-btn-primary"
                style={{ width: '100%' }}
                onClick={onGetStartedClick || (() => navigate('/login'))}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
