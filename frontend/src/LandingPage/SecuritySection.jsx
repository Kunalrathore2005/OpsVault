import { ShieldCheck, Key, Lock, Eye, FileText, Check } from 'lucide-react';
import { useInView } from './useInView';

export default function SecuritySection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <ShieldCheck size={14} />
            <span>Governance & Security</span>
          </div>
          <h2 className="landing-section-title">Engineered for security and operational integrity.</h2>
          <p className="landing-section-subtitle">
            Enterprise role-based boundaries ensure users only see and manage data within their authorized scope.
          </p>
        </div>

        <div className={`landing-grid-3x scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          <div className="landing-feature-box">
            <div className="landing-feature-box-icon">
              <Key size={20} />
            </div>
            <h3>JWT Authentication</h3>
            <p>Cryptographically signed session tokens ensuring secure, stateless API communication.</p>
          </div>

          <div className="landing-feature-box">
            <div className="landing-feature-box-icon">
              <Lock size={20} />
            </div>
            <h3>Strict RBAC Enforcement</h3>
            <p>Database queries and REST endpoints validated against user roles (Admin, Manager, Employee).</p>
          </div>

          <div className="landing-feature-box">
            <div className="landing-feature-box-icon">
              <FileText size={20} />
            </div>
            <h3>Complete Audit Logs</h3>
            <p>Every administrative action, rule trigger, and resolution is permanently timestamped.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
