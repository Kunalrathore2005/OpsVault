import { useState } from 'react';
import { Calendar, Clock, Bell, CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useInView } from './useInView';

const exampleDays = [
  {
    day: 'Today',
    dateLabel: 'Tuesday, Operations Day',
    events: [
      { time: '09:30 AM', title: 'Daily Operational Standup', type: 'DEPARTMENT', color: 'var(--primary)' },
      { time: '11:00 AM', title: 'Task Deadline: Security Patch v2.4', type: 'TASK_DEADLINE', color: 'var(--danger)' },
      { time: '02:00 PM', title: 'SLA Milestone Check: P2 Incidents', type: 'SLA_CHECK', color: 'var(--warning)' },
      { time: '04:30 PM', title: 'Automated Scheduled Report Dispatch', type: 'AUTOMATION', color: 'var(--success)' }
    ]
  },
  {
    day: 'Tomorrow',
    dateLabel: 'Wednesday, Mid-Week Review',
    events: [
      { time: '10:00 AM', title: 'Engineering Sprint Review', type: 'DEPARTMENT', color: 'var(--primary)' },
      { time: '01:30 PM', title: 'Vendor Asset Delivery Inspection', type: 'ASSET_AUDIT', color: 'var(--warning)' },
      { time: '04:00 PM', title: 'Document Expiry Milestone: AWS MSA', type: 'DOCUMENT_EXPIRY', color: 'var(--danger)' }
    ]
  }
];

export default function CalendarSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const currentDay = exampleDays[selectedDayIndex];

  return (
    <section ref={sectionRef} className="landing-section" id="calendar-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <Calendar size={14} />
            <span>Operations Calendar</span>
          </div>
          <h2 className="landing-section-title">Keep your operations on schedule.</h2>
          <p className="landing-section-subtitle">
            A unified operational schedule that merges personal events, team meetings, task deadlines, and automated reminders in one view.
          </p>
        </div>

        <div className={`landing-split-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {/* Visual Mini Calendar / Schedule Card */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {exampleDays.map((d, idx) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    style={{
                      background: selectedDayIndex === idx ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: selectedDayIndex === idx ? '#ffffff' : 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--t-fast)'
                    }}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
              <span className="badge in-progress" style={{ fontSize: '11px' }}>{currentDay.events.length} Events</span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '12px', fontWeight: 500 }}>
              {currentDay.dateLabel}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentDay.events.map((evt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${evt.color}`,
                    transition: 'transform var(--t-fast)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{evt.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                      <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {evt.time} · {evt.type.replace('_', ' ')}
                    </div>
                  </div>
                  <Bell size={14} color="var(--muted)" />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="landing-split-content">
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
              Never miss an operational milestone or compliance window.
            </h3>
            <p className="landing-split-desc">
              OpsVault integrates your operational commitments into an accessible calendar in your user profile and instant header popup.
            </p>

            <div className="landing-feature-bullets">
              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><CheckCircle2 size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Automatic Task Synchronization:</strong> Task deadlines automatically populate your personal operational schedule.
                </div>
              </div>

              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><CheckCircle2 size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Scheduled Reminders:</strong> Background dispatch sends automated alerts prior to key operational windows.
                </div>
              </div>

              <div className="landing-bullet-item">
                <div className="landing-bullet-check"><CheckCircle2 size={14} /></div>
                <div className="landing-bullet-text">
                  <strong>Header Quick Access:</strong> One-click calendar drawer allows team members to view their day without leaving their active task.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
