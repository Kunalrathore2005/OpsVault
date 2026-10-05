import { TrendingDown, Zap, ShieldCheck, Clock } from 'lucide-react';
import { useInView } from './useInView';

const metrics = [
  {
    num: '35%',
    label: 'Operational Overhead Reduction',
    sub: 'Eliminates redundant status meetings and fragmented chats',
    color: '#3b82f6',
    icon: TrendingDown
  },
  {
    num: '3X',
    label: 'Faster Approval & Incident Turnaround',
    sub: 'Direct department routing with one-click decisioning',
    color: '#f59e0b',
    icon: Zap
  },
  {
    num: '99.4%',
    label: 'Target SLA Compliance Adherence',
    sub: 'Continuous background monitoring with tiered escalations',
    color: '#10b981',
    icon: ShieldCheck
  },
  {
    num: '24/7',
    label: 'Autonomous Automation Engine',
    sub: 'Celery background workers evaluating triggers continuously',
    color: '#8b5cf6',
    icon: Clock
  }
];

export default function MetricsBanner() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section landing-section-compact" style={{ background: 'var(--surface)' }}>
      <div className="landing-container">
        <div className={`landing-metrics-grid scroll-reveal ${inView ? 'visible' : ''}`}>
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="landing-metric-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="landing-metric-num" style={{ color: m.color }}>{m.num}</span>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                    <Icon size={18} />
                  </div>
                </div>
                <h4 className="landing-metric-label">{m.label}</h4>
                <p className="landing-metric-sub">{m.sub}</p>
                <div className="landing-metric-stripe" style={{ background: m.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
