import {
  ListTodo, Users, Building2, ClipboardCheck,
  FileWarning, Box, FolderOpen, Zap, ShieldAlert,
  FileBarChart, Calendar, Bell, FileText, CheckCircle2
} from 'lucide-react';
import { useInView } from './useInView';

const allFeatures = [
  { name: 'Task Management', desc: 'Create, assign, schedule, and track tasks across team members with lifecycle statuses.', icon: ListTodo },
  { name: 'Employee Directory', desc: 'Manage user profiles, operational roles, contact info, and individual capacity.', icon: Users },
  { name: 'Department Units', desc: 'Organize teams into business units with dedicated managerial oversight.', icon: Building2 },
  { name: 'Requests & Approvals', desc: 'Structured employee inquiry workflow with fast approve/reject actioning.', icon: ClipboardCheck },
  { name: 'Incident Tracking', desc: 'Log outages and technical incidents from P1 Critical to P4 Low with ownership.', icon: FileWarning },
  { name: 'Asset Management', desc: 'Track physical equipment, laptops, keys, and device assignments.', icon: Box },
  { name: 'Document Vault', desc: 'Secure repository for compliance documents, policies, contracts, and attachments.', icon: FolderOpen },
  { name: 'Automation Engine', desc: 'Configurable WHEN / IF / THEN business logic for automated operations.', icon: Zap },
  { name: 'SLA Monitoring', desc: 'Continuous deadline tracking with visual compliance health metrics.', icon: ShieldAlert },
  { name: 'Tiered Escalations', desc: 'Multi-level escalation pathways when critical items face resolution delay.', icon: ShieldAlert },
  { name: 'Scheduled Reports', desc: 'Generate multi-format analytical summaries on tasks, SLA, and workloads.', icon: FileBarChart },
  { name: 'Operations Calendar', desc: 'Integrated schedule combining personal events and task milestones.', icon: Calendar },
  { name: 'Push Notifications', desc: 'Instant header notifications for assignments, decisions, and system alerts.', icon: Bell },
  { name: 'Audit History', desc: 'Immutable logging of all operational transactions for compliance and security.', icon: FileText }
];

export default function FeatureGrid() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="features">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <CheckCircle2 size={14} />
            <span>Complete Feature Suite</span>
          </div>
          <h2 className="landing-section-title">Everything built into one platform.</h2>
          <p className="landing-section-subtitle">
            OpsVault provides all the building blocks necessary to manage modern business operations reliably.
          </p>
        </div>

        <div className={`landing-grid-3x scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {allFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.name}
                className="landing-feature-box"
                style={{ transitionDelay: `${idx * 0.03}s` }}
              >
                <div className="landing-feature-box-icon">
                  <Icon size={20} />
                </div>
                <h3>{feat.name}</h3>
                <p>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
