import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useInView } from './useInView';

const testimonials = [
  {
    id: 1,
    name: 'Vikram Sengupta',
    role: 'VP of Operations',
    company: 'Apex Logistics & Retail',
    avatar: 'VS',
    avatarBg: '#2563eb',
    quote: 'OpsVault completely replaced our scattered Slack channels and tracking sheets. We now manage all 8 regional departments from one unified dashboard with zero confusion.'
  },
  {
    id: 2,
    name: 'Ananya Deshmukh',
    role: 'Head of Engineering',
    company: 'FinStack Technologies',
    avatar: 'AD',
    avatarBg: '#059669',
    quote: 'The Automation Engine and SLA escalation system are unmatched. Tasks no longer slip through the cracks—our incident resolution time dropped by over 45%.'
  },
  {
    id: 3,
    name: 'Rohan Mehra',
    role: 'Operations Director',
    company: 'Krypton Enterprises',
    avatar: 'RM',
    avatarBg: '#d97706',
    quote: 'Scheduled reports delivered directly in PDF and CSV format save my management team 6 hours every single Monday morning. Clean, fast, and exceptionally reliable.'
  },
  {
    id: 4,
    name: 'Pooja Iyer',
    role: 'People Operations Lead',
    company: 'Nova Digital Labs',
    avatar: 'PI',
    avatarBg: '#7c3aed',
    quote: 'The role-based access control and personal calendar view give our employees clarity without overwhelming them with executive settings. Highly recommended!'
  }
];

export default function TestimonialsCarousel() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [inView]);

  const next = () => setCurrentIdx(prev => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIdx(prev => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section ref={sectionRef} className="landing-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <Quote size={14} />
            <span>Customer Stories</span>
          </div>
          <h2 className="landing-section-title">
            What Operations Leaders <span className="landing-hero-gradient">Say</span>
          </h2>
          <p className="landing-section-subtitle">
            Trusted by operations managers, department leads, and fast-growing organizations.
          </p>
        </div>

        {/* Carousel Grid */}
        <div className={`landing-testimonials-grid scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}>
          {testimonials.map((t, idx) => (
            <div key={t.id} className="landing-testimonial-card">
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>

              <p className="landing-testimonial-quote">"{t.quote}"</p>

              <div className="landing-testimonial-author">
                <div
                  className="landing-testimonial-avatar"
                  style={{ background: t.avatarBg }}
                >
                  {t.avatar}
                </div>
                <div>
                  <h4 className="landing-testimonial-name">{t.name}</h4>
                  <p className="landing-testimonial-role">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
