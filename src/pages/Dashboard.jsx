import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const Dashboard = () => {
  const [userCount, setUserCount] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get('https://resumes-lover-recall-ext.trycloudflare.com/api/users', { headers })
      .then(res => setUserCount(res.data.count)).catch(() => setUserCount(0));
    axios.get('https://resumes-lover-recall-ext.trycloudflare.com/api/events/count', { headers })
      .then(res => setEventCount(res.data.count)).catch(() => setEventCount(0));
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .wb-stat:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .wb-stat { transition: all 0.18s ease; }
        .wb-action:hover { border-color: #374151 !important; background: #F9FAFB !important; }
        .wb-action { transition: all 0.15s ease; }
      `}</style>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <p style={s.greeting}>{getGreeting()}</p>
            <h1 style={s.pageTitle}>Dashboard</h1>
          </div>
          <div style={s.datePill}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {today}
          </div>
        </div>

        <div style={s.statsRow}>
          <StatCard
            label="Total Users"
            value={userCount}
            note="Registered accounts"
            color="#111827"
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />
          <StatCard
            label="Total Events"
            value={eventCount}
            note="Live on platform"
            color="#4B5563"
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            }
          />
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>Quick Actions</p>
          <div style={s.actionsGrid}>
            <ActionCard
              title="Create New Event"
              desc="Publish a new event to the platform"
              href="/events"
              icon={
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="12" y1="15" x2="12" y2="19"/><line x1="10" y1="17" x2="14" y2="17"/>
                </svg>
              }
            />
            <ActionCard
              title="Manage Users"
              desc="View and manage registered users"
              href="/users"
              icon={
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const StatCard = ({ label, value, note, color, icon }) => (
  <div className="wb-stat" style={s.statCard}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div style={{ ...s.statIconWrap, backgroundColor: color + '12', color }}>{icon}</div>
      <span style={{ ...s.notePill, color, backgroundColor: color + '10' }}>{note}</span>
    </div>
    <div style={s.statValue}>
      {value === null
        ? <span style={s.skeleton} />
        : value.toLocaleString()
      }
    </div>
    <div style={s.statLabel}>{label}</div>
    <div style={{ ...s.accentLine, backgroundColor: color }} />
  </div>
);

const ActionCard = ({ title, desc, href, icon }) => (
  <a href={href} className="wb-action" style={s.actionCard}>
    <div style={s.actionIconWrap}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={s.actionTitle}>{title}</div>
      <div style={s.actionDesc}>{desc}</div>
    </div>
    <svg width="14" height="14" fill="none" stroke="#C4C9D4" strokeWidth="2.2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </a>
);

const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F8F9FB',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: '40px 48px',
    overflowY: 'auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 36,
    flexWrap: 'wrap',
    gap: 12,
  },
  greeting: {
    fontSize: 12.5,
    color: '#9CA3AF',
    margin: '0 0 4px',
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.6px',
  },
  datePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '7px 13px',
    fontWeight: '500',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 36,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: '24px 24px 20px',
    border: '1px solid #EAECF0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notePill: {
    fontSize: 10.5,
    fontWeight: '600',
    padding: '3px 9px',
    borderRadius: 20,
    letterSpacing: '0.01em',
  },
  statValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '-1.2px',
    lineHeight: 1,
    marginBottom: 5,
  },
  statLabel: { fontSize: 12.5, color: '#9CA3AF', fontWeight: '500' },
  accentLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    borderRadius: '14px 14px 0 0',
  },
  skeleton: {
    display: 'inline-block',
    width: 70,
    height: 32,
    backgroundColor: '#F1F3F5',
    borderRadius: 7,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '0 0 12px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 10,
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    border: '1.5px solid #E5E7EB',
    borderRadius: 12,
    padding: '16px 18px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: '-0.1px',
  },
  actionDesc: { fontSize: 12, color: '#9CA3AF', fontWeight: '400' },
};

export default Dashboard;