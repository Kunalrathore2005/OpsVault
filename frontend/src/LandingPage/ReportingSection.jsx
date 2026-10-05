import { FileBarChart, Download, Calendar, ArrowUpRight, Check, Layers } from 'lucide-react';
import { useInView } from './useInView';

const reportTypes = [
  { id: 'tasks', name: 'Task Operations Summary', desc: 'Breakdown of completed vs overdue deliverables across departments.', format: 'PDF / CSV' },
  { id: 'workload', name: 'Employee Workload Analysis', desc: 'Capacity distribution and task allocation per team member.', format: 'PDF / CSV' },
  { id: 'incident', name: 'Incident & Outage Audit', desc: 'Root cause tracking, severity breakdown, and MTTR metrics.', format: 'PDF / HTML' },
  { id: 'sla', name: 'SLA Adherence & Escalations', desc: 'Compliance percentages against target resolution benchmarks.', format: 'PDF / CSV' },
  { id: 'department', name: 'Department Capacity Report', desc: 'Resource utilization across operational business units.', format: 'CSV / JSON' },
  { id: 'requests', name: 'Request & Approval Turnaround', desc: 'Management review efficiency and approval latency audit.', format: 'PDF / CSV' },
  { id: 'assets', name: 'Asset Allocation Ledger', desc: 'Hardware custody, repair logs, and inventory availability.', format: 'CSV / Excel' }
];

export default function ReportingSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="reporting-section">
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <FileBarChart size={14} />
            <span>Operational Intelligence</span>
          </div>
          <h2 className="landing-section-title">Turn daily operations into useful insights.</h2>
          <p className="landing-section-subtitle">
            Generate executive-ready audit reports on demand or schedule automatic delivery directly to management inboxes.
          </p>
        </div>

        <div className={`landing-grid-3x scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {reportTypes.map((report, idx) => (
            <div
              key={report.id}
              className="landing-feature-box"
              style={{
                transitionDelay: `${idx * 0.05}s`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="landing-feature-box-icon">
                  <FileBarChart size={20} />
                </div>
                <span className="badge completed" style={{ fontSize: '10px' }}>{report.format}</span>
              </div>

              <h3>{report.name}</h3>
              <p>{report.desc}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary)', marginTop: 'auto', paddingTop: '8px' }}>
                <Calendar size={13} />
                <span>Supports recurring cron scheduling</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
