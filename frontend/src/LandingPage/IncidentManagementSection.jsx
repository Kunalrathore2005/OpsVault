import { FileWarning, ChevronRight, Shield, Clock, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { useInView } from './useInView';

const incidentSteps = [
  { num: '01', title: 'Incident Logged', desc: 'Staff or systems report outage, hardware fault, or breach.', icon: FileWarning },
  { num: '02', title: 'Priority Assigned', desc: 'Classified from P1 (Critical) to P4 (Low) with targeted SLA.', icon: AlertTriangle },
  { num: '03', title: 'Owner Assigned', desc: 'Routed instantly to the authorized engineer or manager.', icon: UserCheck },
  { num: '04', title: 'SLA Clock Active', desc: 'Live countdown timer tracks resolution against company commitments.', icon: Clock },
  { num: '05', title: 'Auto-Escalation', desc: 'Triggered if milestone is approaching without active mitigation.', icon: Shield },
  { num: '06', title: 'Resolution & Audit', desc: 'Post-incident notes and root cause documented permanently.', icon: CheckCircle2 }
];

export default function IncidentManagementSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="incident-section">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <FileWarning size={14} />
            <span>Incident Management</span>
          </div>
          <h2 className="landing-section-title">Operational issues tracked with precision.</h2>
          <p className="landing-section-subtitle">
            When outages or facility failures happen, clear response workflows prevent chaos and maintain accountability.
          </p>
        </div>

        <div className={`landing-loop-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {incidentSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="landing-loop-card"
                style={{ transitionDelay: `${idx * 0.06}s` }}
              >
                <div className="landing-loop-num">{step.num}</div>
                <div className="landing-loop-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
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
