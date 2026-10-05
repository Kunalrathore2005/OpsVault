import {
  ListTodo, Zap, ShieldAlert, FileWarning,
  FileBarChart, Calendar, Box, FolderOpen
} from 'lucide-react';
import { useInView } from './useInView';

const capabilities = [
  { id: 'tasks', name: 'Task Management', icon: ListTodo, desc: 'Lifecycle tracking & workload', target: 'tasks-section' },
  { id: 'automation', name: 'Automation Engine', icon: Zap, desc: 'Event-driven trigger rules', target: 'automation-section' },
  { id: 'sla', name: 'SLA & Escalations', icon: ShieldAlert, desc: 'Resolution target monitoring', target: 'sla-section' },
  { id: 'incidents', name: 'Incident Tracking', icon: FileWarning, desc: 'Priority incident response', target: 'incident-section' },
  { id: 'reports', name: 'Scheduled Reports', icon: FileBarChart, desc: 'Operational intelligence', target: 'reporting-section' },
  { id: 'calendar', name: 'Operations Calendar', icon: Calendar, desc: 'Deadlines & personal events', target: 'calendar-section' },
  { id: 'assets', name: 'Asset Inventory', icon: Box, desc: 'Hardware & device status', target: 'assets-section' },
  { id: 'documents', name: 'Document Vault', icon: FolderOpen, desc: 'Encrypted file repository', target: 'assets-section' }
];

export default function CapabilitySection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  const scrollTo = (targetId) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="landing-section landing-section-compact">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`} style={{ marginBottom: '32px' }}>
          <h2 className="landing-section-title" style={{ fontSize: '26px' }}>
            Everything your operations team needs.
          </h2>
          <p className="landing-section-subtitle" style={{ fontSize: '15px' }}>
            Integrated operational tools designed to replace disconnected spreadsheets and chaotic message threads.
          </p>
        </div>

        <div className={`landing-capabilities-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {capabilities.map(c => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                className="landing-capability-card"
                onClick={() => scrollTo(c.target)}
                role="button"
                tabIndex={0}
                title={`Explore ${c.name}`}
              >
                <div className="landing-capability-icon">
                  <Icon size={20} />
                </div>
                <div className="landing-capability-name">{c.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
