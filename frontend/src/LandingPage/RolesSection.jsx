import { ShieldCheck, UserCheck, User, Check } from 'lucide-react';
import { useInView } from './useInView';

const roles = [
  {
    role: 'Org Administrator',
    badge: 'ADMIN',
    icon: ShieldCheck,
    tagline: 'Organization-wide governance & control',
    desc: 'Full visibility over all departments, staff allocations, enterprise SLA policies, global automations, and scheduled analytical reports.',
    points: [
      'Organization-wide operational control center',
      'Global automation rules & SLA threshold definition',
      'Department creation and managerial assignment',
      'Immutable system audit history and executive reports'
    ]
  },
  {
    role: 'Operations Manager',
    badge: 'MANAGER',
    icon: UserCheck,
    tagline: 'Department capacity & execution',
    desc: 'Dedicated oversight over departmental team members, task assignments, employee approval requests, and localized operational escalations.',
    points: [
      'Department-focused live operations dashboard',
      'Workload balancing and task dispatching',
      'Employee request approval & rejection workflows',
      'Department-scoped automation triggers & incident mitigation'
    ]
  },
  {
    role: 'Team Member',
    badge: 'EMPLOYEE',
    icon: User,
    tagline: 'Focused execution & self-service',
    desc: 'A personalized operational view with assigned tasks, personal task creation, request submissions, personal calendar, and gamified level progression.',
    points: [
      'Personal task queue with live deadline tracking',
      'Fast request submission with instant status alerts',
      'Personal & departmental event calendar in Profile',
      'Earn XP and track operational milestones upon completion'
    ]
  }
];

export default function RolesSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="solutions">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <ShieldCheck size={14} />
            <span>Role-Based Experience</span>
          </div>
          <h2 className="landing-section-title">Built for every role in your business.</h2>
          <p className="landing-section-subtitle">
            OpsVault adapts its experience to match each user's operational scope, eliminating clutter and maximizing focus.
          </p>
        </div>

        <div className={`landing-roles-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {roles.map((r, idx) => {
            const Icon = r.icon;
            return (
              <div
                key={r.role}
                className="landing-role-card"
                style={{ transitionDelay: `${idx * 0.08}s` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="landing-role-icon">
                    <Icon size={24} />
                  </div>
                  <span className="badge in-progress" style={{ fontSize: '11px' }}>
                    {r.badge}
                  </span>
                </div>

                <div>
                  <h3 className="landing-role-title">{r.role}</h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    {r.tagline}
                  </div>
                </div>

                <p className="landing-role-desc">{r.desc}</p>

                <ul className="landing-role-list">
                  {r.points.map((pt, pIdx) => (
                    <li key={pIdx} className="landing-role-list-item">
                      <Check size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
