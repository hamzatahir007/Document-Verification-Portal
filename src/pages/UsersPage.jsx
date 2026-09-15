import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    axios.get('https://resumes-lover-recall-ext.trycloudflare.com/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setUsers(res.data.users);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .wb-row:hover { background: #FAFBFC !important; }
        .wb-search:focus { border-color: #374151 !important; box-shadow: 0 0 0 3px rgba(55,65,81,0.1) !important; outline: none; }
        .wb-skeleton { background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <p style={s.eyebrow}>People</p>
            <h1 style={s.pageTitle}>Users</h1>
          </div>
          <div style={s.countBadge}>
            <div style={s.countDot} />
            {users.length} registered {users.length === 1 ? 'user' : 'users'}
          </div>
        </div>

        <div style={s.tableCard}>
          <div style={s.tableTop}>
            <div style={s.searchWrap}>
              <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={s.searchIcon}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="wb-search"
                style={s.searchInput}
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={s.clearBtn}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {!loading && (
              <span style={s.resultCount}>
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>

          {loading ? (
            <div>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={s.skeletonRow}>
                  <div className="wb-skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div className="wb-skeleton" style={{ height: 12, width: '28%' }} />
                    <div className="wb-skeleton" style={{ height: 11, width: '40%' }} />
                  </div>
                  <div className="wb-skeleton" style={{ height: 20, width: 52, borderRadius: 20 }} />
                  <div className="wb-skeleton" style={{ height: 11, width: 80 }} />
                </div>
              ))}
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.theadRow}>
                  <th style={s.th}>#</th>
                  <th style={s.th}>User</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={s.empty}>
                      <div style={s.emptyInner}>
                        <svg width="32" height="32" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 10 }}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span style={s.emptyTitle}>No users found</span>
                        <span style={s.emptySub}>Try adjusting your search</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr key={u._id} className="wb-row" style={s.row}>
                    <td style={s.td}>
                      <span style={s.rowNum}>{i + 1}</span>
                    </td>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <div style={{ ...s.avatar, backgroundColor: avatarBg(u.fullName) }}>
                          <span style={s.avatarLetter}>{u.fullName?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <span style={s.name}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.email}>{u.email}</span></td>
                    <td style={s.td}>
                      <span style={u.role === 'admin' ? s.badgeAdmin : s.badgeUser}>
                        {u.role}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.date}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

const AVATAR_COLORS = [
  'rgba(17,24,39,0.08)',
  'rgba(31,41,55,0.08)',
  'rgba(55,65,81,0.08)',
  'rgba(75,85,99,0.08)',
  'rgba(107,114,128,0.08)',
];
const avatarBg = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

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
    alignItems: 'flex-end',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: '0 0 5px',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.6px',
  },
  countBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12.5,
    color: '#6B7280',
    backgroundColor: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '7px 13px',
    fontWeight: '500',
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#4B5563',
    boxShadow: '0 0 0 2px rgba(75,85,99,0.2)',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  tableTop: {
    padding: '14px 20px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    maxWidth: 280,
    flex: 1,
  },
  searchIcon: { position: 'absolute', left: 10, pointerEvents: 'none' },
  searchInput: {
    width: '100%',
    padding: '8px 30px 8px 30px',
    border: '1.5px solid #E5E7EB',
    borderRadius: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  clearBtn: {
    position: 'absolute',
    right: 9,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9CA3AF',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  resultCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { backgroundColor: '#FAFAFA' },
  th: {
    padding: '10px 20px',
    textAlign: 'left',
    fontSize: 10.5,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #F3F4F6',
  },
  row: { borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' },
  td: { padding: '13px 20px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  skeletonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 20px',
    borderBottom: '1px solid #F9FAFB',
  },
  rowNum: { fontSize: 11.5, color: '#D1D5DB', fontWeight: '500', fontVariantNumeric: 'tabular-nums' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  name: { fontWeight: '500', color: '#111827', fontSize: 13 },
  email: { color: '#6B7280', fontSize: 12.5 },
  date: { color: '#9CA3AF', fontSize: 12, fontVariantNumeric: 'tabular-nums' },
  badgeAdmin: {
    backgroundColor: 'rgba(17,24,39,0.1)',
    color: '#111827',
    padding: '3px 9px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  badgeUser: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    padding: '3px 9px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  empty: { padding: '60px 20px', textAlign: 'center' },
  emptyInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 12.5, color: '#9CA3AF', marginTop: 2 },
};

export default UsersPage;