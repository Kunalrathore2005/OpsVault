import { useState, useEffect } from 'react';
import { Users, ListTodo, ShieldAlert, Zap, Bell, FileBarChart, FileText, CheckCircle2 } from 'lucide-react';
import { useInView } from './useInView';

const loopSteps = [
  { num: '01', title: 'People & Teams', desc: 'Departments, managers, and staff configured with RBAC boundaries.', icon: Users },
  { num: '02', title: 'Tasks & Requests', desc: 'Operational assignments and employee queries created in the system.', icon: ListTodo },
  { num: '03', title: 'SLA Tracking', desc: 'Target turnaround windows and real-time countdown tracking.', icon: ShieldAlert },
  { num: '04', title: 'Automation Engine', desc: 'Trigger-action conditions continuously evaluate bottlenecks.', icon: Zap },
  { num: '05', title: 'Instant Alerts', desc: 'Real-time push notifications routed to responsible stakeholders.', icon: Bell },
  { num: '06', title: 'Tiered Escalations', desc: 'Unresolved issues automatically escalate to managerial attention.', icon: ShieldAlert },
  { num: '07', title: 'Scheduled Reports', desc: 'Analytical performance metrics compiled into executive summaries.', icon: FileBarChart },
  { num: '08', title: 'Immutable Audit', desc: 'Every operational event recorded in tamper-evident system logs.', icon: FileText }
];

export default function ConnectedOperations() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % loopSteps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section ref={sectionRef} className="landing-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <CheckCircle2 size={14} />
            <span>Closed-Loop Operational Ecosystem</span>
          </div>
          <h2 className="landing-section-title">One connected operational cycle.</h2>
          <p className="landing-section-subtitle">
            Every action, status change, and approval feeds directly into continuous operational intelligence.
          </p>
        </div>

        <div className={`landing-loop-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {loopSteps.map((step, idx) => {
            const Icon = step.icon;
            const isHighlight = activeStep === idx;
            return (
              <div
                key={step.num}
                className="landing-loop-card"
                onClick={() => setActiveStep(idx)}
                style={{
                  transform: isHighlight ? 'translateY(-4px)' : 'translateY(0)',
                  borderColor: isHighlight ? 'var(--primary)' : 'var(--border)',
                  boxShadow: isHighlight ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--t-fast)'
                }}
              >
                <div
                  className="landing-loop-num"
                  style={{
                    background: isHighlight ? 'var(--primary)' : 'var(--primary-subtle)',
                    color: isHighlight ? '#ffffff' : 'var(--primary)'
                  }}
                >
                  {step.num}
                </div>
                <div className="landing-loop-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Icon size={16} color="var(--primary)" />
                    <h4>{step.title}</h4>
                  </div>
                  <p>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
