import { ClipboardCheck, ArrowRight, User, Check, X, Bell, ShieldCheck } from 'lucide-react';
import { useInView } from './useInView';

export default function RequestsSection({ onGetStartedClick }) {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="requests-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className="landing-split-grid">
          {/* Visual Interactive Approval Card */}
          <div
            className={`scroll-reveal ${inView ? 'visible' : ''}`}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform var(--t-fast)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardCheck size={18} color="var(--primary)" />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Pending Approval Request</span>
              </div>
              <span className="badge pending" style={{ fontSize: '11px' }}>Awaiting Review</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Budget Allocation for Cloud Infrastructure Scaling
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '12px' }}>
                Requested by: <strong>Marcus Vance (Engineering Lead)</strong> · Department: <strong>DevOps</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                "Requesting approval for additional compute nodes to support Q4 volume surge."
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="landing-btn-secondary landing-btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
              >
                <X size={14} />
                <span>Reject</span>
              </button>
              <button
                type="button"
                className="landing-btn-primary landing-btn-sm"
                style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
              >
                <Check size={14} />
                <span>Approve Request</span>
              </button>
            </div>
          </div>

          {/* Explanation */}
          <div className={`landing-split-content scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
            <div className="landing-pill">
              <ClipboardCheck size={14} />
              <span>Requests & Approvals</span>
            </div>
            <h2 className="landing-split-title">
              Clear authorization, <span className="landing-hero-gradient">zero bottlenecks.</span>
            </h2>
            <p className="landing-split-desc">
              Employees can easily submit structured operational requests—from equipment purchases to access delegations. Managers review, decide, and notify with a single click.
            </p>

            <div className="landing-feature-bullets">
              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><Check size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Structured Forms:</strong> Capture all needed context upfront rather than messy email chains.
                </div>
              </div>

              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><Check size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Departmental Routing:</strong> Automatically routes to the correct department manager based on organizational hierarchy.
                </div>
              </div>

              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><Check size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Instant Push Notification:</strong> Requesters receive automated alerts the moment a decision is recorded.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
