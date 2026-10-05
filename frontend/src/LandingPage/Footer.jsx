import { Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer({ onLoginClick, onGetStartedClick }) {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-grid">
          {/* Brand Col */}
          <div className="landing-footer-brand-col">
            <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="landing-brand-icon">◈</span>
              <span>OpsVault</span>
            </div>
            <p>
              The unified operations management platform for modern, fast-moving business teams.
            </p>

            <div className="landing-footer-contact-info">
              <span><Mail size={13} /> hello@opsvault.example</span>
              <span><Mail size={13} /> support@opsvault.example</span>
              <span><Phone size={13} /> +91 00000 00000</span>
              <span><MapPin size={13} /> Mumbai, India</span>
            </div>
          </div>

          {/* Product Col */}
          <div className="landing-footer-col">
            <h4>Product</h4>
            <ul>
              <li><button type="button" onClick={() => scrollTo('tasks-section')}>Tasks</button></li>
              <li><button type="button" onClick={() => scrollTo('automation')}>Automation</button></li>
              <li><button type="button" onClick={() => scrollTo('sla-section')}>SLA Policies</button></li>
              <li><button type="button" onClick={() => scrollTo('reporting-section')}>Reports</button></li>
              <li><button type="button" onClick={() => scrollTo('calendar-section')}>Calendar</button></li>
            </ul>
          </div>

          {/* Operations Col */}
          <div className="landing-footer-col">
            <h4>Operations</h4>
            <ul>
              <li><button type="button" onClick={() => scrollTo('departments-section')}>Employees</button></li>
              <li><button type="button" onClick={() => scrollTo('departments-section')}>Departments</button></li>
              <li><button type="button" onClick={() => scrollTo('incident-section')}>Incidents</button></li>
              <li><button type="button" onClick={() => scrollTo('assets-section')}>Assets</button></li>
              <li><button type="button" onClick={() => scrollTo('assets-section')}>Documents</button></li>
            </ul>
          </div>

          {/* Company Col */}
          <div className="landing-footer-col">
            <h4>Company</h4>
            <ul>
              <li><button type="button" onClick={() => scrollTo('product')}>About</button></li>
              <li><button type="button" onClick={() => scrollTo('faq')}>FAQ</button></li>
              <li><button type="button" onClick={() => scrollTo('features')}>Security</button></li>
            </ul>
          </div>

          {/* Account Col */}
          <div className="landing-footer-col">
            <h4>Account</h4>
            <ul>
              <li>
                <button type="button" onClick={onLoginClick || (() => navigate('/login'))}>
                  Sign In
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStartedClick || (() => navigate('/login'))}>
                  Get Started
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <div>© 2026 OpsVault. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
