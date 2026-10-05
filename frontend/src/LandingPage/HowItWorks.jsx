import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Users, ListTodo, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useInView } from './useInView';

const steps = [
  {
    id: 0,
    tab: '1. Onboard',
    title: 'Onboard Your Organization',
    badge: 'Step 1: Workspace Setup',
    desc: 'Set up your company workspace in minutes. Configure departments, define operational boundaries, and invite managers and employees with cryptographic JWT authentication.',
    kpi: 'Setup Complete in < 5 mins',
    preview: {
      type: 'setup',
      title: 'Organization Configuration',
      items: ['Configured 6 Core Departments', 'Assigned Departmental Managers', 'Enforced Strict RBAC Policies']
    }
  },
  {
    id: 1,
    tab: '2. Teams & Scope',
    title: 'Structure Departments & Roles',
    badge: 'Step 2: Hierarchy Mapping',
    desc: 'Map every team member to their respective operational unit. Managers gain autonomous oversight over their department workload, while executives retain global organization visibility.',
    kpi: '100% Granular Visibility',
    preview: {
      type: 'teams',
      title: 'Department Scope Active',
      items: ['Engineering · 18 Active Members', 'Operations & Logistics · 24 Staff', 'Legal & Finance · 6 Specialists']
    }
  },
  {
    id: 2,
    tab: '3. Tasks & Approvals',
    title: 'Dispatch Tasks & Route Requests',
    badge: 'Step 3: Workflow Execution',
    desc: 'Assign operational deliverables with precision deadlines. Team members submit structured purchase or access queries that route directly to authorized managers for instant review.',
    kpi: 'Zero Bottleneck Routing',
    preview: {
      type: 'tasks',
      title: 'Live Task Queue',
      items: ['34 Active Tasks In Flight', '3 Requests Awaiting Approval', '23 Tasks Completed On Schedule']
    }
  },
  {
    id: 3,
    tab: '4. Automate & SLA',
    title: 'Automate Triggers & Enforce SLAs',
    badge: 'Step 4: Autonomous Governance',
    desc: 'Let the OpsVault Automation Engine watch your operations 24/7. When tasks approach deadlines or high-severity incidents occur, the engine triggers notifications and escalates automatically.',
    kpi: '99.2% Target Adherence',
    preview: {
      type: 'automation',
      title: 'Automation Engine Running',
      items: ['WHEN Task Overdue → THEN Notify & Escalate', 'WHEN Incident Critical → THEN Broadcast Alert', 'WHEN Doc Expiring → THEN Warn Owner']
    }
  },
  {
    id: 4,
    tab: '5. Insights & Reports',
    title: 'Executive Intelligence & Audit',
    badge: 'Step 5: Continuous Reporting',
    desc: 'Generate scheduled business reports across 7 standard operational dimensions. Track resolution latency, verify SLA compliance, and maintain tamper-evident audit logs.',
    kpi: 'Instant Analytical Reports',
    preview: {
      type: 'reports',
      title: 'Operational Health Report',
      items: ['Task Summary Report (PDF/CSV)', 'SLA Compliance Benchmark 98.4%', 'Immutable Audit Trail Verified']
    }
  }
];

export default function HowItWorks() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [inView]);

  const nextStep = () => setActiveIndex(prev => (prev + 1) % steps.length);
  const prevStep = () => setActiveIndex(prev => (prev - 1 + steps.length) % steps.length);

  const current = steps[activeIndex];
  const progressPct = ((activeIndex + 1) / steps.length) * 100;

  return (
    <section ref={sectionRef} className="landing-section landing-hiw-section">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <Zap size={14} />
            <span>Operational Workflow</span>
          </div>
          <h2 className="landing-section-title">
            How OpsVault <span className="landing-hero-gradient">Works</span>
          </h2>
          <p className="landing-section-subtitle">
            From initial team onboarding to autonomous SLA enforcement and scheduled business reporting.
          </p>
        </div>

        {/* Step Buttons */}
        <div className="landing-hiw-tabs">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`landing-hiw-tab-btn ${activeIndex === idx ? 'active' : ''}`}
            >
              {s.tab}
            </button>
          ))}
        </div>

        {/* Interactive Split Card */}
        <div className="landing-hiw-card-wrap">
          {/* Left Visual Preview with Progress Bar */}
          <div className="landing-hiw-visual">
            <div className="landing-hiw-preview-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="badge in-progress" style={{ fontSize: '11px' }}>{current.badge}</span>
                <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>● Active Process</span>
              </div>

              <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>
                {current.preview.title}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {current.preview.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13.5px',
                      color: 'var(--text)'
                    }}
                  >
                    <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                padding: '10px 14px',
                background: 'var(--primary-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--primary-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px'
              }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Benchmark</span>
                <strong style={{ color: 'var(--primary)' }}>{current.kpi}</strong>
              </div>
            </div>

            {/* Bottom Progress Line */}
            <div className="landing-hiw-progress-track">
              <div className="landing-hiw-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Right Text Description & Controls */}
          <div className="landing-hiw-details">
            <span className="landing-hiw-step-tag">{current.badge}</span>
            <h3 className="landing-hiw-step-title">{current.title}</h3>
            <p className="landing-hiw-step-desc">{current.desc}</p>

            <div className="landing-hiw-controls">
              <button
                type="button"
                onClick={prevStep}
                className="landing-hiw-nav-btn"
                aria-label="Previous step"
              >
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                {activeIndex + 1} / {steps.length}
              </span>
              <button
                type="button"
                onClick={nextStep}
                className="landing-hiw-nav-btn"
                aria-label="Next step"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
