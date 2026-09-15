import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API = 'https://resumes-lover-recall-ext.trycloudflare.com/api';
const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

const statusMeta = {
  pending: { label: 'Pending', color: '#374151', bg: 'rgba(55,65,81,0.1)' },
  approved: { label: 'Approved', color: '#111827', bg: 'rgba(17,24,39,0.1)' },
  rejected: { label: 'Rejected', color: '#6B7280', bg: 'rgba(107,114,128,0.16)' },
};

const ApprovalsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('admin_token');

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/events?includeAll=true&status=${status}`, { headers });
      setEvents(res.data.events || []);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [status]);

  const filtered = events.filter(event => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [event.title, event.venue, event.city, event.category]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query));
  });

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ap-row:hover { background: #FAFBFC !important; }
        .ap-card:hover { box-shadow: 0 10px 28px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .ap-card { transition: all 0.18s ease; }
        .ap-input:focus { border-color: #374151 !important; box-shadow: 0 0 0 3px rgba(55,65,81,0.1) !important; outline: none; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <p style={s.eyebrow}>Moderation</p>
            <h1 style={s.pageTitle}>Approvals</h1>
            <p style={s.subTitle}>Review submitted events and manage their publication status.</p>
          </div>
          <button onClick={loadEvents} style={s.refreshBtn}>Refresh</button>
        </div>

        <div style={s.toolbar}>
          <div style={s.filterGroup}>
            {STATUS_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => setStatus(option)}
                style={{
                  ...s.filterBtn,
                  ...(status === option ? s.filterBtnActive : {}),
                }}
              >
                {statusMeta[option].label}
              </button>
            ))}
          </div>

          <div style={s.searchWrap}>
            <input
              className="ap-input"
              style={s.searchInput}
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={s.summaryRow}>
          <SummaryCard label="Pending" value={events.filter(e => e.status === 'pending').length} color="#374151" />
          <SummaryCard label="Approved" value={events.filter(e => e.status === 'approved').length} color="#111827" />
          <SummaryCard label="Rejected" value={events.filter(e => e.status === 'rejected').length} color="#6B7280" />
          <SummaryCard label="Total" value={events.length} color="#1F2937" />
        </div>

        <div style={s.card} className="ap-card">
          {loading ? (
            <div style={s.loading}>Loading approvals...</div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyTitle}>No events found</div>
              <div style={s.emptySub}>Try a different filter or search term.</div>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Event</th>
                    <th style={s.th}>Submitted by</th>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(event => (
                    <tr key={event._id} className="ap-row" style={s.row}>
                      <td style={s.td}>
                        <div style={s.eventCell}>
                          <img src={event.imageUrl} alt={event.title} style={s.thumb} />
                          <div>
                            <div style={s.eventTitle}>{event.title}</div>
                            <div style={s.eventMeta}>{event.venue} · {event.city}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>{event.submittedBy?.fullName || 'Unknown'}</td>
                      <td style={s.td}>{event.category}</td>
                      <td style={s.td}>
                        <span style={{ ...s.statusPill, background: statusMeta[event.status]?.bg || '#F3F4F6', color: statusMeta[event.status]?.color || '#374151' }}>
                          {statusMeta[event.status]?.label || event.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <Link to={`/approvals/${event._id}`} style={s.reviewBtn}>Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div style={{ ...s.summaryCard, borderTopColor: color }}>
    <div style={s.summaryLabel}>{label}</div>
    <div style={{ ...s.summaryValue, color }}>{value}</div>
  </div>
);

const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
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
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9CA3AF',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '0 0 6px',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.6px',
  },
  subTitle: {
    margin: '8px 0 0',
    color: '#6B7280',
    fontSize: 13,
  },
  refreshBtn: {
    backgroundColor: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  filterGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    backgroundColor: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 999,
    padding: '9px 14px',
    fontSize: 12,
    fontWeight: 700,
    color: '#6B7280',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#111827',
    color: '#fff',
    borderColor: '#111827',
  },
  searchWrap: { minWidth: 260, flex: 1, maxWidth: 420 },
  searchInput: {
    width: '100%',
    backgroundColor: '#fff',
    border: '1.5px solid #E5E7EB',
    borderRadius: 10,
    padding: '11px 13px',
    fontSize: 13,
    color: '#111827',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: '#fff',
    border: '1px solid #E5E7EB',
    borderTopWidth: 4,
    borderRadius: 14,
    padding: '16px 18px',
  },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: 700, marginBottom: 6 },
  summaryValue: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px' },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  tableWrap: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '13px 16px',
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderBottom: '1px solid #F3F4F6',
    whiteSpace: 'nowrap',
  },
  row: { borderBottom: '1px solid #F9FAFB' },
  td: { padding: '14px 16px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  eventCell: { display: 'flex', alignItems: 'center', gap: 12 },
  thumb: { width: 58, height: 58, borderRadius: 12, objectFit: 'cover', backgroundColor: '#F3F4F6', flexShrink: 0 },
  eventTitle: { fontSize: 13.5, fontWeight: 800, color: '#111827', marginBottom: 3 },
  eventMeta: { fontSize: 12, color: '#6B7280' },
  statusPill: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' },
  reviewBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 700 },
  loading: { padding: '34px 20px', textAlign: 'center', color: '#6B7280', fontWeight: 600 },
  empty: { padding: '42px 20px', textAlign: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: 800, color: '#111827' },
  emptySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
};

export default ApprovalsPage;
