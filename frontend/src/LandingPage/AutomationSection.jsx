import { useState, useEffect } from 'react';
import { Zap, Bell, ShieldAlert, FileText, ArrowRight, CheckCircle2, ChevronRight, Sliders } from 'lucide-react';
import { useInView } from './useInView';

const automationExamples = [
  {
    id: 'overdue-task',
    title: 'Overdue Task Escalation',
    event: 'Task deadline expires without completion',
    condition: 'IF task status != "COMPLETED"',
    action: 'Dispatch urgent alert to Department Manager',
    escalation: 'Create Level 1 Escalation record',
    audit: 'Log immutable compliance event to Audit stream'
  },
  {
    id: 'critical-incident',
    title: 'Critical Incident Broadcast',
    event: 'Incident logged with severity = "CRITICAL"',
    condition: 'IF response SLA <= 15 minutes',
    action: 'Trigger instant push notification to Admin & Security Leads',
    escalation: 'Create Level 3 Executive Escalation',
    audit: 'Record emergency incident response log'
  },
  {
    id: 'doc-expiry',
    title: 'Document Expiry Warning',
    event: 'Compliance certificate is 30 days from expiration',
    condition: 'IF renewal document not submitted',
    action: 'Notify Document Owner & Legal Ops',
    escalation: 'Flag document status in repository',
    audit: 'Record automated renewal notification dispatch'
  }
];

export default function AutomationSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [selectedExample, setSelectedExample] = useState(automationExamples[0]);
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveNodeIndex(prev => (prev + 1) % 5);
    }, 2400);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section ref={sectionRef} className="landing-section" id="automation" style={{ position: 'relative' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <Zap size={14} />
            <span>Automation Engine</span>
          </div>
          <h2 className="landing-section-title">Let operations work automatically.</h2>
          <p className="landing-section-subtitle">
            Configure intelligent WHEN / IF / THEN trigger-action rules. When bottlenecks happen, OpsVault acts immediately without human delay.
          </p>
        </div>

        {/* Tab Selection */}
        <div className={`scroll-reveal stagger-1 ${inView ? 'visible' : ''}`} style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '36px',
          flexWrap: 'wrap'
        }}>
          {automationExamples.map(ex => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                setSelectedExample(ex);
                setActiveNodeIndex(0);
              }}
              className={selectedExample.id === ex.id ? 'landing-btn-primary landing-btn-sm' : 'landing-btn-secondary landing-btn-sm'}
            >
              <Zap size={13} />
              <span>{ex.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic 5-Step Workflow Chain with Animated Node Highlight */}
        <div className={`landing-flow-chain scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          <div className={`landing-flow-node ${activeNodeIndex === 0 ? 'active-node' : ''}`}>
            <div className="landing-flow-node-badge" style={{ color: 'var(--warning)' }}>1. Event Trigger</div>
            <div className="landing-flow-node-title">WHEN Event Occurs</div>
            <div className="landing-flow-node-desc">{selectedExample.event}</div>
          </div>

          <div className="landing-flow-arrow"><ChevronRight /></div>

          <div className={`landing-flow-node ${activeNodeIndex === 1 ? 'active-node' : ''}`}>
            <div className="landing-flow-node-badge" style={{ color: 'var(--primary)' }}>2. Condition Check</div>
            <div className="landing-flow-node-title">IF Condition Met</div>
            <div className="landing-flow-node-desc">{selectedExample.condition}</div>
          </div>

          <div className="landing-flow-arrow"><ChevronRight /></div>

          <div className={`landing-flow-node ${activeNodeIndex === 2 ? 'active-node' : ''}`}>
            <div className="landing-flow-node-badge" style={{ color: 'var(--primary)' }}>3. Automated Action</div>
            <div className="landing-flow-node-title">THEN Execute Action</div>
            <div className="landing-flow-node-desc">{selectedExample.action}</div>
          </div>

          <div className="landing-flow-arrow"><ChevronRight /></div>

          <div className={`landing-flow-node ${activeNodeIndex === 3 ? 'active-node' : ''}`}>
            <div className="landing-flow-node-badge" style={{ color: 'var(--danger)' }}>4. Escalation</div>
            <div className="landing-flow-node-title">Auto Escalation</div>
            <div className="landing-flow-node-desc">{selectedExample.escalation}</div>
          </div>

          <div className="landing-flow-arrow"><ChevronRight /></div>

          <div className={`landing-flow-node ${activeNodeIndex === 4 ? 'active-node' : ''}`}>
            <div className="landing-flow-node-badge" style={{ color: 'var(--success)' }}>5. Audit Trail</div>
            <div className="landing-flow-node-title">System Audit Log</div>
            <div className="landing-flow-node-desc">{selectedExample.audit}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
