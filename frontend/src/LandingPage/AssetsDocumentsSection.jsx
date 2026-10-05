import { Box, FolderOpen, ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { useInView } from './useInView';

export default function AssetsDocumentsSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="landing-section" id="assets-section" style={{ background: 'var(--bg-subtle)' }}>
      <div className="landing-container">
        <div className={`landing-section-header scroll-reveal ${inView ? 'visible' : ''}`}>
          <div className="landing-pill">
            <Box size={14} />
            <span>Operational Resources</span>
          </div>
          <h2 className="landing-section-title">Hardware assets & document repository.</h2>
          <p className="landing-section-subtitle">
            Maintain complete custodial control over company equipment and ensure compliance documents never expire silently.
          </p>
        </div>

        <div className="landing-split-grid">
          {/* Asset Management Card */}
          <div
            className={`scroll-reveal ${inView ? 'visible' : ''}`}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform var(--t-fast)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Asset Management</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Hardware lifecycle, serial numbers & employee custody</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div>
                  <b style={{ color: 'var(--text)' }}>MacBook Pro 16" M3 Max</b>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Asset #AST-9021 · Serial: C02G9014Q</div>
                </div>
                <span className="badge in-progress" style={{ fontSize: '11px' }}>Assigned</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div>
                  <b style={{ color: 'var(--text)' }}>Dell UltraSharp 32" 4K Monitor</b>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Asset #AST-8840 · Inventory Hub</div>
                </div>
                <span className="badge completed" style={{ fontSize: '11px' }}>Available</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div>
                  <b style={{ color: 'var(--text)' }}>YubiKey 5C NFC Security Key</b>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Asset #AST-7722 · IT Security</div>
                </div>
                <span className="badge completed" style={{ fontSize: '11px' }}>Available</span>
              </div>
            </div>
          </div>

          {/* Document Management Card */}
          <div
            className={`scroll-reveal stagger-2 ${inView ? 'visible' : ''}`}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform var(--t-fast)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderOpen size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Document Vault</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Secure storage with automated expiry notifications</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div>
                  <b style={{ color: 'var(--text)' }}>SOC2 Type II Compliance Report.pdf</b>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Owner: Security Lead · 2.4 MB</div>
                </div>
                <span className="badge completed" style={{ fontSize: '11px' }}>Active</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--warning-subtle)', borderRadius: '8px', border: '1px solid var(--warning-border)', fontSize: '13px' }}>
                <div>
                  <b style={{ color: 'var(--text)' }}>AWS Enterprise Master Service Agreement.pdf</b>
                  <div style={{ fontSize: '11px', color: 'var(--warning)' }}>Expires in 28 days · Automation Trigger Active</div>
                </div>
                <span className="badge pending" style={{ fontSize: '11px' }}>Renewal Soon</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div>
                  <b style={{ color: 'var(--text)' }}>Corporate Insurance Policy 2026.pdf</b>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Owner: Finance Operations · 4.1 MB</div>
                </div>
                <span className="badge completed" style={{ fontSize: '11px' }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
