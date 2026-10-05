import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'What is OpsVault?',
    a: 'OpsVault is an integrated business operations management platform. It consolidates team tasks, departmental requests, incident tracking, asset inventory, compliance documents, SLA policies, and automated workflows into a single workspace.'
  },
  {
    q: 'Who is OpsVault for?',
    a: 'OpsVault is built for growing companies, operations teams, department managers, and executives who need centralized visibility over daily operational execution without juggling fragmented spreadsheets and disparate software.'
  },
  {
    q: 'What user roles are supported?',
    a: 'OpsVault supports three primary roles out of the box: Org Administrator (organization-wide governance and policies), Operations Manager (departmental workload and request approvals), and Team Member/Employee (personal task execution and query submission).'
  },
  {
    q: 'Can managers manage their specific teams?',
    a: 'Yes. OpsVault features strict departmental scoping. Managers have visibility and approval authority over the employees and tasks within their assigned departments.'
  },
  {
    q: 'Does OpsVault support workflow automation?',
    a: 'Yes. OpsVault includes an Automation Engine that executes customizable WHEN / IF / THEN rules. For example, when a task becomes overdue or a critical incident is logged, the system can automatically notify managers, create escalations, and record audit entries.'
  },
  {
    q: 'What is SLA management in OpsVault?',
    a: 'SLA (Service Level Agreement) management monitors turnaround deadlines for tasks and requests. The system provides real-time health gauges, warns when deadlines approach, and triggers automated escalations upon breaches.'
  },
  {
    q: 'Can business reports be scheduled automatically?',
    a: 'Yes. OpsVault includes a Report Scheduler that can generate and deliver 7 standard operational reports (such as Task Summary, SLA Compliance, and Workload Distribution) in CSV, PDF/HTML, or JSON on recurring schedules.'
  },
  {
    q: 'Does OpsVault include a calendar?',
    a: 'Yes. Every user has access to an integrated Personal Calendar within their Profile as well as a quick-access Header Popup that synchronizes task deadlines, company milestones, and personal operational events.'
  },
  {
    q: 'How does role-based access control work?',
    a: 'Access control is enforced at both the API layer and the database layer using cryptographically signed JWTs. Admin, Manager, and Employee permissions strictly govern which records each user can view, edit, or delete.'
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section className="landing-section" id="faq">
      <div className="landing-container">
        <div className="landing-section-header">
          <div className="landing-pill">
            <HelpCircle size={14} />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="landing-section-title">Answers to common questions.</h2>
          <p className="landing-section-subtitle">
            Everything you need to know about getting started with OpsVault.
          </p>
        </div>

        <div className="landing-faq-wrap">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`landing-faq-item ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="landing-faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform var(--t-fast)',
                      flexShrink: 0
                    }}
                  />
                </button>

                {isOpen && (
                  <div className="landing-faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
