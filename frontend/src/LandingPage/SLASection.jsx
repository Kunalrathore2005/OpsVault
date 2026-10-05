import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useInView } from './useInView';

const slaStates = [
  {
    status: 'ontrack',
    name: 'On Track',
    badgeClass: 'completed',
    icon: ShieldCheck,
    color: 'var(--success)',
    timeText: '> 48 Hours Remaining',
    desc: 'Work progressing normally within allocated SLA target window.'
  },
  {
    status: 'duesoon',
    name: 'Due Soon',
    badgeClass: 'pending',
    icon: Clock,
    color: 'var(--warning)',
    timeText: '< 12 Hours Remaining',
    desc: 'Approaching targeted milestone. Warning notification dispatched to assignee.'
  },
  {
    status: 'overdue',
    name: 'Overdue',
    badgeClass: 'danger',
    icon: AlertTriangle,
    color: 'var(--danger)',
    timeText: 'Past Target Schedule',
    desc: 'Resolution window exceeded. Automatic SLA breach flag recorded.'
  },
  {
    status: 'escalated',
    name: 'Escalated',
    badgeClass: 'in-progress',
    icon: ShieldAlert,
    color: '#8b5cf6',
    timeText: 'Management Intervened',
    desc: 'Tiered escalation routed to Operations Manager & Org Admin for immediate resolution.'
  },
  {
    status: 'resolved',
    name: 'Resolved',
    badgeClass: 'completed',
    icon: CheckCircle2,
    color: 'var(--primary)',
    timeText: 'SLA Metric Satisfied',
    desc: 'Task or incident fulfilled with resolution time recorded for historical performance reports.'
  }
];

export default function SLASection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveStage(prev => (prev + 1) % slaStates.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section ref={sectionRef} className="landing-section" id="sla-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <ShieldCheck size={14} />
            <span>SLA & Escalations</span>
          </div>
          <h2 className="landing-section-title">
            Know what needs attention before it becomes a problem.
          </h2>
          <p className="landing-section-subtitle">
            Every business deliverable has a timeline. OpsVault provides continuous SLA monitoring with multi-tier escalation management.
          </p>
        </div>

        <div className={`landing-sla-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {slaStates.map((state, idx) => {
            const Icon = state.icon;
            const isHighlight = activeStage === idx;
            return (
              <div
                key={state.status}
                className={`landing-sla-card ${state.status}`}
                onClick={() => setActiveStage(idx)}
                style={{
                  transform: isHighlight ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHighlight ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  border: isHighlight ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                  transition: 'all var(--t-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className={`badge ${state.badgeClass}`} style={{ fontSize: '11px' }}>
                    {state.name}
                  </span>
                  <Icon size={18} color={state.color} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: state.color, marginBottom: '6px' }}>
                  {state.timeText}
                </div>
                <div className="landing-sla-title">{state.name} Lifecycle</div>
                <div className="landing-sla-desc">{state.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
