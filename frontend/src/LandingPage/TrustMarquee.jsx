import { useEffect, useRef } from 'react';
import { Database, Server, Cpu, Layers, ShieldCheck, Zap, Terminal, HardDrive } from 'lucide-react';

const partners = [
  { name: 'PostgreSQL 16', icon: Database, label: 'ACID Storage' },
  { name: 'Redis Cache', icon: Zap, label: 'Sub-ms Broker' },
  { name: 'FastAPI Backend', icon: Terminal, label: 'Async REST' },
  { name: 'Celery Beat', icon: Cpu, label: 'Distributed Queue' },
  { name: 'Docker Engine', icon: Layers, label: 'Containerized' },
  { name: 'React 18 SPA', icon: Server, label: 'Modern UI' },
  { name: 'Enterprise RBAC', icon: ShieldCheck, label: 'Strict Security' },
  { name: 'Encrypted Vault', icon: HardDrive, label: 'AES-256 Storage' }
];

export default function TrustMarquee() {
  const trackRef = useRef(null);

  return (
    <section className="landing-marquee-section">
      <div className="landing-container" style={{ textAlign: 'center', marginBottom: '18px' }}>
        <h3 className="landing-marquee-title">
          Built on battle-tested enterprise technologies <span style={{ color: 'var(--primary)' }}>for uninterrupted reliability</span>
        </h3>
      </div>

      <div className="landing-marquee-wrapper">
        <div className="landing-marquee-track" ref={trackRef}>
          {[...partners, ...partners, ...partners].map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="landing-marquee-item">
                <div className="landing-marquee-icon">
                  <Icon size={18} />
                </div>
                <div className="landing-marquee-text">
                  <span className="marquee-name">{p.name}</span>
                  <span className="marquee-sub">{p.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
