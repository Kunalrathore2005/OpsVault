import { Check, Layers, Zap, ShieldCheck, Activity, Users, ArrowRight } from 'lucide-react';
import { useInView } from './useInView';

export default function ProductIntroduction({ onGetStartedClick }) {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="product">
      <div className="landing-container">
        <div className="landing-split-grid">
          {/* Left Text Explanation */}
          <div className={`landing-split-content scroll-reveal ${inView ? 'visible' : ''}`}>
            <div className="landing-pill">
              <Layers size={14} />
              <span>Unified Operational Layer</span>
            </div>

            <h2 className="landing-split-title">
              Your entire operation. <span className="landing-hero-gradient">Connected.</span>
            </h2>

            <p className="landing-split-desc">
              Disconnected tools create blind spots. When tasks live in one tool, requests in chat apps, incidents in tickets, and assets in spreadsheets, operational leaders lose visibility and accountability collapses.
            </p>

            <p className="landing-split-desc">
              OpsVault establishes a single, continuous operational record where people, tasks, requests, SLA policies, and automated workflows work in synchrony.
            </p>

            <div className="landing-feature-bullets">
              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><Check size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Zero context switching:</strong> Assign tasks, review departmental approvals, and monitor incident recovery from a single interface.
                </div>
              </div>

              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><Check size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Autonomous SLA enforcement:</strong> Overdue items and critical alerts automatically escalate according to predefined business rules.
                </div>
              </div>

              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><Check size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Granular role-based governance:</strong> Keep executives informed, managers empowered, and individual contributors focused.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="landing-btn-primary"
                onClick={onGetStartedClick}
              >
                <span>Experience OpsVault</span>
                <ArrowRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          </div>

          {/* Right Visual Card Previews */}
          <div className={`scroll-reveal stagger-2 ${inView ? 'visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform var(--t-fast)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Operational Pipeline</h4>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Real-time business telemetry</span>
                  </div>
                </div>
                <span className="badge completed" style={{ fontSize: '11px' }}>Synchronized</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Task Throughput</span>
                  <b style={{ fontSize: '16px', color: 'var(--text)' }}>94.6%</b>
                  <div className="progress" style={{ marginTop: '6px', height: '4px' }}>
                    <i style={{ width: '94.6%', background: 'var(--success)' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Approval Turnaround</span>
                  <b style={{ fontSize: '16px', color: 'var(--text)' }}>&lt; 4 Hours</b>
                  <div className="progress" style={{ marginTop: '6px', height: '4px' }}>
                    <i style={{ width: '88%', background: 'var(--primary)' }} />
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '12.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={15} color="var(--primary)" />
                  <span style={{ color: 'var(--text)' }}>Rule triggered: Auto-assigned incident ticket</span>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Just now</span>
              </div>
            </div>

            {/* Quick Connected Info Card */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--success-subtle)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>SLA Health Verified</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>0 active escalation breaches</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>Operational</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
