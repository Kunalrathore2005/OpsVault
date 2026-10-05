import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Hero from './Hero';
import TrustMarquee from './TrustMarquee';
import HowItWorks from './HowItWorks';
import MetricsBanner from './MetricsBanner';
import CapabilitySection from './CapabilitySection';
import ProductIntroduction from './ProductIntroduction';
import TaskManagementSection from './TaskManagementSection';
import AutomationSection from './AutomationSection';
import SLASection from './SLASection';
import IncidentManagementSection from './IncidentManagementSection';
import RequestsSection from './RequestsSection';
import PeopleDepartmentsSection from './PeopleDepartmentsSection';
import AssetsDocumentsSection from './AssetsDocumentsSection';
import ReportingSection from './ReportingSection';
import CalendarSection from './CalendarSection';
import RolesSection from './RolesSection';
import ConnectedOperations from './ConnectedOperations';
import FeatureGrid from './FeatureGrid';
import SecuritySection from './SecuritySection';
import TestimonialsCarousel from './TestimonialsCarousel';
import ContactSection from './ContactSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import Footer from './Footer';
import './landing.css';

export default function LandingPage({ onLoginClick, onGetStartedClick }) {
  const navigate = useNavigate();

  const handleLogin = () => {
    if (onLoginClick) onLoginClick();
    else navigate('/login');
  };

  const handleGetStarted = () => {
    if (onGetStartedClick) onGetStartedClick();
    else navigate('/login');
  };

  return (
    <div className="landing-root">
      {/* Background ambient lighting */}
      <div className="landing-ambient-bg" aria-hidden="true">
        <div className="landing-glow-1" />
        <div className="landing-glow-2" />
      </div>

      {/* 1. Header / Navbar (with Top Notice Bar) */}
      <Navbar
        onLoginClick={handleLogin}
        onGetStartedClick={handleGetStarted}
      />

      {/* 2. Hero Section with Dynamic Typewriter & Product Preview */}
      <Hero onGetStartedClick={handleGetStarted} />

      {/* 3. Tech & Infrastructure Trust Marquee (Reference: parceluncle.com) */}
      <TrustMarquee />

      {/* 4. Interactive How It Works 5-Step Process (Reference: parceluncle.com) */}
      <HowItWorks />

      {/* 5. Metrics & Business Impact Grid */}
      <MetricsBanner />

      {/* 6. Capability Grid */}
      <CapabilitySection />

      {/* 7. Product Introduction (Your Entire Operation. Connected) */}
      <ProductIntroduction onGetStartedClick={handleGetStarted} />

      {/* 8. Task Management Section */}
      <TaskManagementSection onGetStartedClick={handleGetStarted} />

      {/* 9. Automation Engine Section */}
      <AutomationSection />

      {/* 10. SLA & Escalations Section */}
      <SLASection />

      {/* 11. Incident Management Section */}
      <IncidentManagementSection />

      {/* 12. Requests & Approvals Section */}
      <RequestsSection onGetStartedClick={handleGetStarted} />

      {/* 13. People & Department Structure */}
      <PeopleDepartmentsSection />

      {/* 14. Assets & Documents Section */}
      <AssetsDocumentsSection />

      {/* 15. Reporting Section */}
      <ReportingSection />

      {/* 16. Calendar Section */}
      <CalendarSection />

      {/* 17. Roles Experience (Admin / Manager / Employee) */}
      <RolesSection />

      {/* 18. Connected Operations Loop */}
      <ConnectedOperations />

      {/* 19. Complete Feature Grid */}
      <FeatureGrid />

      {/* 20. Security & Governance */}
      <SecuritySection />

      {/* 21. Customer Stories / Testimonials (Reference: parceluncle.com) */}
      <TestimonialsCarousel />

      {/* 22. Interactive Contact & Walkthrough Form (Reference: parceluncle.com) */}
      <ContactSection />

      {/* 23. FAQ Accordion */}
      <FAQSection />

      {/* 24. Final Conversion CTA */}
      <CTASection
        onGetStartedClick={handleGetStarted}
        onLoginClick={handleLogin}
      />

      {/* 25. SaaS Footer */}
      <Footer
        onLoginClick={handleLogin}
        onGetStartedClick={handleGetStarted}
      />
    </div>
  );
}

