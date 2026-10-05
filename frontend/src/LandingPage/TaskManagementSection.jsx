import { useState, useEffect } from 'react';
import { ListTodo, Clock, CheckCircle2, XCircle, ArrowRight, User, Plus, Send, Check } from 'lucide-react';
import { useInView } from './useInView';

const workflowSteps = [
  { id: 'create', label: '1. Create', desc: 'Define deliverable & deadline', targetCol: 0 },
  { id: 'assign', label: '2. Assign', desc: 'Route to employee with capacity', targetCol: 1 },
  { id: 'track', label: '3. Track', desc: 'Monitor progress & SLA window', targetCol: 1 },
  { id: 'complete', label: '4. Complete', desc: 'Verify completion & log history', targetCol: 2 }
];

export default function TaskManagementSection({ onGetStartedClick }) {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % workflowSteps.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <section ref={sectionRef} className="landing-section" id="tasks-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <ListTodo size={14} />
            <span>Task Management</span>
          </div>
          <h2 className="landing-section-title">Keep work moving.</h2>
          <p className="landing-section-subtitle">
            Structure complex operational workflows into clear assignments. Track deliverables, assign deadlines, and monitor employee workload in real time.
          </p>
        </div>

        {/* Interactive Storytelling Step Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}>
          {workflowSteps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={activeStep === idx ? 'landing-btn-primary landing-btn-sm' : 'landing-btn-secondary landing-btn-sm'}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              <span>{step.label}</span>
            </button>
          ))}
        </div>

        {/* Task Pipeline Columns */}
        <div className={`landing-tasks-pipeline scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {/* Column 1: Pending */}
          <div className={`landing-task-col ${activeStep === 0 ? 'active-step' : ''}`}>
            <div className="landing-task-col-head" style={{ color: 'var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                <span>Pending</span>
              </div>
              <span className="badge pending" style={{ fontSize: '11px', padding: '2px 6px' }}>3</span>
            </div>

            <div className="landing-task-card">
              <div className="landing-task-card-title">Q4 Infrastructure Audit</div>
              <div className="landing-task-card-meta">
                <span>DevOps · Due in 3d</span>
                <span className="badge pending" style={{ fontSize: '10px' }}>Alex R.</span>
              </div>
            </div>

            <div className="landing-task-card">
              <div className="landing-task-card-title">Update Client Privacy Terms</div>
              <div className="landing-task-card-meta">
                <span>Legal · Due in 5d</span>
                <span className="badge pending" style={{ fontSize: '10px' }}>Sarah M.</span>
              </div>
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className={`landing-task-col ${activeStep === 1 || activeStep === 2 ? 'active-step' : ''}`}>
            <div className="landing-task-col-head" style={{ color: 'var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ListTodo size={14} />
                <span>In Progress</span>
              </div>
              <span className="badge in-progress" style={{ fontSize: '11px', padding: '2px 6px' }}>4</span>
            </div>

            <div className="landing-task-card">
              <div className="landing-task-card-title">Deploy Security Patch v2.4</div>
              <div className="landing-task-card-meta">
                <span>Engineering · Due Tomorrow</span>
                <span className="badge in-progress" style={{ fontSize: '10px' }}>Elena K.</span>
              </div>
            </div>

            <div className="landing-task-card">
              <div className="landing-task-card-title">Hardware Inventory Check</div>
              <div className="landing-task-card-meta">
                <span>IT Support · Due in 2d</span>
                <span className="badge in-progress" style={{ fontSize: '10px' }}>James T.</span>
              </div>
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className={`landing-task-col ${activeStep === 3 ? 'active-step' : ''}`}>
            <div className="landing-task-col-head" style={{ color: 'var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Completed</span>
              </div>
              <span className="badge completed" style={{ fontSize: '11px', padding: '2px 6px' }}>12</span>
            </div>

            <div className="landing-task-card">
              <div className="landing-task-card-title">Monthly Payroll Reconciliation</div>
              <div className="landing-task-card-meta">
                <span>Finance · Verified</span>
                <span className="badge completed" style={{ fontSize: '10px' }}>David L.</span>
              </div>
            </div>

            <div className="landing-task-card">
              <div className="landing-task-card-title">Employee Onboarding Batch</div>
              <div className="landing-task-card-meta">
                <span>People Ops · Done</span>
                <span className="badge completed" style={{ fontSize: '10px' }}>Priya K.</span>
              </div>
            </div>
          </div>

          {/* Column 4: Dropped / Cancelled */}
          <div className="landing-task-col">
            <div className="landing-task-col-head" style={{ color: 'var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={14} />
                <span>Dropped</span>
              </div>
              <span className="badge cancelled" style={{ fontSize: '11px', padding: '2px 6px' }}>1</span>
            </div>

            <div className="landing-task-card" style={{ opacity: 0.85 }}>
              <div className="landing-task-card-title" style={{ textDecoration: 'line-through' }}>Legacy File Server Migration</div>
              <div className="landing-task-card-meta">
                <span>Superseded by Cloud</span>
                <span className="badge cancelled" style={{ fontSize: '10px' }}>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
