import { Building2, Users, UserCheck, Briefcase, Shield } from 'lucide-react';
import { useInView } from './useInView';

const orgHierarchy = [
  { step: '1', title: 'Organization', role: 'Global Visibility', desc: 'Central enterprise configuration, global policies, and executive control.', icon: Building2 },
  { step: '2', title: 'Departments', role: 'Operational Units', desc: 'Dedicated business units (e.g., Engineering, Operations, Legal, Finance).', icon: Briefcase },
  { step: '3', title: 'Managers', role: 'Department Leadership', desc: 'Authorizations, workload balancing, request approval, and escalation triage.', icon: UserCheck },
  { step: '4', title: 'Employees', role: 'Team Members', desc: 'Executing deliverables, updating task status, and submitting requests.', icon: Users }
];

export default function PeopleDepartmentsSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="departments-section">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <Users size={14} />
            <span>People & Organization</span>
          </div>
          <h2 className="landing-section-title">Built around your real team structure.</h2>
          <p className="landing-section-subtitle">
            Map your entire operational hierarchy with strict role-based access control and clear reporting lines.
          </p>
        </div>

        <div className={`landing-loop-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {orgHierarchy.map((node, idx) => {
            const Icon = node.icon;
            return (
              <div
                key={node.step}
                className="landing-loop-card"
                style={{ transitionDelay: `${idx * 0.08}s` }}
              >
                <div className="landing-loop-num">{node.step}</div>
                <div className="landing-loop-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Icon size={16} color="var(--primary)" />
                    <h4>{node.title}</h4>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    {node.role}
                  </span>
                  <p>{node.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
