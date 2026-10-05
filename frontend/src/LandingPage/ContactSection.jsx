import { useState } from 'react';
import { Send, CheckCircle2, Sparkles, Mail, Building, User, MessageSquare } from 'lucide-react';
import { useInView } from './useInView';

export default function ContactSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <section ref={sectionRef} className="landing-section" id="contact" style={{ background: 'var(--surface)' }}>
      <div className="landing-container">
        <div className={`landing-contact-card scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-section-header" style={{ marginBottom: '32px' }}>
            <div className="landing-pill">
              <Mail size={14} />
              <span>Get In Touch</span>
            </div>
            <h2 className="landing-section-title" style={{ fontSize: '32px' }}>
              Ready to streamline your operations? <span className="landing-hero-gradient">Let's talk.</span>
            </h2>
            <p className="landing-section-subtitle" style={{ fontSize: '15px' }}>
              Get a personalized walkthrough of OpsVault tailored to your company's operational hierarchy.
            </p>
          </div>

          {submitted ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--success-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--success-border)'
            }}>
              <CheckCircle2 size={42} color="var(--success)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Message Sent Successfully!
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
                Thank you for reaching out. An OpsVault operations specialist will contact you at <strong>{form.email}</strong> shortly.
              </p>
              <button
                type="button"
                className="landing-btn-secondary landing-btn-sm"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', company: '', message: '' });
                }}
                style={{ marginTop: '20px' }}
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="landing-contact-form">
              <div className="landing-contact-grid-2">
                <div className="landing-input-group">
                  <label>Your Name *</label>
                  <div className="landing-input-wrap">
                    <User size={16} className="landing-input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="landing-input-group">
                  <label>Business Email *</label>
                  <div className="landing-input-wrap">
                    <Mail size={16} className="landing-input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="landing-input-group">
                <label>Company / Organization Name *</label>
                <div className="landing-input-wrap">
                  <Building size={16} className="landing-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexus Technologies Ltd"
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="landing-input-group">
                <label>Operational Requirements</label>
                <div className="landing-input-wrap" style={{ alignItems: 'flex-start' }}>
                  <MessageSquare size={16} className="landing-input-icon" style={{ marginTop: '12px' }} />
                  <textarea
                    rows={3}
                    placeholder="Tell us about your team size, departments, or custom automation requirements..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="landing-btn-primary"
                  style={{ width: '100%', maxWidth: '280px' }}
                >
                  {loading ? 'Sending Inquiry...' : (
                    <>
                      <span>Submit Inquiry</span>
                      <Send size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
