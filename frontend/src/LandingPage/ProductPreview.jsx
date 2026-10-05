import { useState, useEffect } from 'react';
import {
  ListTodo, ClipboardCheck, FileWarning, ShieldCheck,
  CheckCircle2, Clock, ShieldAlert, Zap, Users, ArrowUpRight,
  Activity, Building2, Box, FolderOpen, RefreshCw, Bell
} from 'lucide-react';

const liveTickerEvents = [
  { id: 1, text: 'Task #248: Security Patch deployed on schedule', type: 'completed', time: 'Just now' },
  { id: 2, text: 'SLA Health: 98.2% target adherence across 6 departments', type: 'sla', time: '1m ago' },
  { id: 3, text: 'Request Approved: Cloud compute scaling for DevOps', type: 'approved', time: '3m ago' },
  { id: 4, text: 'Automation Trigger: Task approaching SLA deadline', type: 'warning', time: '5m ago' }
];

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState('overview');
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % liveTickerEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentTicker = liveTickerEvents[tickerIndex];

  return (
    <div className="landing-mockup-window">
      {/* Mockup Topbar */}
      <div className="landing-mockup-header">
        <div className="landing-mockup-dots">
          <div className="landing-mockup-dot" style={{ background: '#ef4444' }} title="Close" />
          <div className="landing-mockup-dot" style={{ background: '#f59e0b' }} title="Minimize" />
          <div className="landing-mockup-dot" style={{ background: '#10b981' }} title="Expand" />
        </div>
        <div className="landing-mockup-title">◈ OpsVault — Organization Operations Control Center</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
          <span className="landing-pulse-dot" />
          <span>Live Telemetry</span>
        </div>
      </div>

      {/* Mockup Nav / Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
        fontSize: '13px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Operations Overview' },
            { id: 'automation', label: 'Automation & SLA' },
            { id: 'resources', label: 'Resource Hub' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 12px',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Live Ticker */}
        <div className="landing-live-ticker" key={currentTicker.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={12} color="var(--primary)" />
            <span>{currentTicker.text}</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 8 }}>{currentTicker.time}</span>
        </div>
      </div>

      {/* Mockup Body Content */}
      <div className="landing-mockup-body" style={{ background: 'var(--bg)' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '11px', fontWeight: 600 }}>
                  <span>ACTIVE STAFF</span>
                  <Users size={14} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', color: 'var(--text)' }}>48</div>
                <div style={{ fontSize: '10.5px', color: 'var(--success)' }}>Across 6 departments</div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '11px', fontWeight: 600 }}>
                  <span>ACTIVE TASKS</span>
                  <ListTodo size={14} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', color: 'var(--text)' }}>34</div>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>14 in progress · 20 pending</div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '11px', fontWeight: 600 }}>
                  <span>PENDING REQUESTS</span>
                  <ClipboardCheck size={14} color="var(--warning)" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', color: 'var(--warning)' }}>3</div>
                <div style={{ fontSize: '10.5px', color: 'var(--warning)' }}>Requires approval</div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '11px', fontWeight: 600 }}>
                  <span>SLA COMPLIANCE</span>
                  <ShieldCheck size={14} color="var(--success)" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0', color: 'var(--success)' }}>98.2%</div>
                <div style={{ fontSize: '10.5px', color: 'var(--success)' }}>Within resolution target</div>
              </div>
            </div>

            {/* Split: Task Donut & Attention Required */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Operational Task Distribution</span>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }}>View All</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'conic-gradient(#10b981 0% 55%, #3b82f6 55% 82%, #f59e0b 82% 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                      <span>85</span>
                      <span style={{ fontSize: '8px', color: 'var(--muted)' }}>TOTAL</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ color: 'var(--text)' }}>Completed (47)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                      <span style={{ color: 'var(--text)' }}>In Progress (23)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ color: 'var(--text)' }}>Pending (15)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attention List */}
              <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
                  Attention Required
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--warning-subtle)', borderRadius: '6px', border: '1px solid var(--warning-border)', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClipboardCheck size={14} color="var(--warning)" />
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>3 Pending Approvals</span>
                    </div>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Review</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--success-subtle)', borderRadius: '6px', border: '1px solid var(--success-border)', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="var(--success)" />
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>All Incidents Resolved</span>
                    </div>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>0 Open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Active Automation Engine Rules</span>
              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>● Engine Running</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Auto-Escalate Overdue Tasks</span>
                  <span style={{ fontSize: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>TASK_OVERDUE</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '11.5px' }}>
                  WHEN Task reaches deadline → IF uncompleted → THEN notify manager & create L1 escalation
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Critical Incident Alerting</span>
                  <span style={{ fontSize: '10px', background: 'var(--danger-subtle)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px' }}>INCIDENT_CRITICAL</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '11.5px' }}>
                  WHEN Incident severity is CRITICAL → THEN broadcast admin notification & trigger audit trail
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
                <Box size={15} color="var(--primary)" />
                <span>Asset Inventory</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--muted)' }}>
                <span>Total Tracked</span>
                <b style={{ color: 'var(--text)' }}>64 Devices</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
                <span>In Active Use</span>
                <b style={{ color: 'var(--success)' }}>58 Assigned</b>
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
                <FolderOpen size={15} color="var(--primary)" />
                <span>Document Vault</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--muted)' }}>
                <span>Repository Files</span>
                <b style={{ color: 'var(--text)' }}>142 Documents</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
                <span>Storage Volume</span>
                <b style={{ color: 'var(--primary)' }}>84.5 MB Encrypted</b>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
