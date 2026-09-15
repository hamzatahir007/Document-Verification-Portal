import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const API = 'https://resumes-lover-recall-ext.trycloudflare.com/api';
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const CATEGORIES = ['All', 'Live Music', 'DJ Nightlife', 'Events', 'Food & Drink', 'Clubs', 'Comedy'];

const CATEGORY_META = {
  'Live Music':   { color: '#111827', bg: 'rgba(17,24,39,0.08)' },
  'DJ Nightlife': { color: '#1F2937', bg: 'rgba(31,41,55,0.08)' },
  'Events':       { color: '#374151', bg: 'rgba(55,65,81,0.08)' },
  'Food & Drink': { color: '#4B5563', bg: 'rgba(75,85,99,0.08)' },
  'Clubs':        { color: '#6B7280', bg: 'rgba(107,114,128,0.1)'  },
  'Comedy':       { color: '#111827', bg: 'rgba(17,24,39,0.1)' },
};

const emptyForm = {
  title: '', description: '', venue: '', address: '', city: '',
  category: 'Live Music', date: '', time: '', isFree: false,
  price: '', imageUrl: '', isFeatured: false, galleryImages: '',
  latitude: '', longitude: '',
};

let googleScriptLoaded = false;

const loadGoogleMapsScript = (apiKey) => {
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (googleScriptLoaded || window.google?.maps) {
    googleScriptLoaded = true;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleScriptLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const LocationSearchInput = ({ value, onChange, apiKey }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment', 'geocode'],
          fields: ['geometry', 'formatted_address', 'name', 'address_components'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place.geometry) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || '';

          const components = place.address_components || [];
          const cityComp = components.find(c =>
            c.types.includes('postal_town') ||
            c.types.includes('locality') ||
            c.types.includes('administrative_area_level_2')
          );
          const city = cityComp?.long_name || '';

          onChange({ address, city, lat: String(lat), lng: String(lng) });
        });
      })
      .catch(err => console.warn('Google Maps failed to load', err));

    return () => { cancelled = true; };
  }, [apiKey, onChange]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        placeholder="Search venue or address (e.g. O2 Arena, London)…"
        style={{
          ...s.input,
          paddingLeft: 34,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='7' stroke='%239CA3AF' stroke-width='2'/%3E%3Cpath d='M20 20l-3-3' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '10px 50%',
        }}
      />
    </div>
  );
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const formRef = useRef(null);

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadEvents = () => {
    setLoading(true);
    axios.get(`${API}/events`, { headers })
      .then(res => { setEvents(res.data.events); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLocationSelected = ({ address, city, lat, lng }) => {
    setForm(prev => ({
      ...prev,
      address,
      city: city || prev.city,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude !== '' ? parseFloat(form.latitude) : null,
        longitude: form.longitude !== '' ? parseFloat(form.longitude) : null,
        galleryImages: form.galleryImages
          ? form.galleryImages.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      if (editingId) {
        await axios.put(`${API}/events/${editingId}`, payload, { headers });
      } else {
        await axios.post(`${API}/events`, payload, { headers });
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      loadEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API}/uploads`, formData, { headers });
    return res.data.url;
  };

  const handleMainImageChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setSubmitting(true);
    try {
      const url = await uploadFile(f);
      setForm(prev => ({ ...prev, imageUrl: url }));
    } catch { setError('Image upload failed'); } finally { setSubmitting(false); }
  };

  const handleGalleryChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSubmitting(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setForm(prev => ({ ...prev, galleryImages: urls.join(', ') }));
    } catch { setError('Gallery upload failed'); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/events/${id}`, { headers });
    setDeleteConfirm(null);
    loadEvents();
  };

  const handleApprove = async (id) => {
    await axios.patch(`${API}/events/${id}/approve`, {}, { headers });
    loadEvents();
  };

  const handleReject = async (id) => {
    await axios.patch(`${API}/events/${id}/reject`, {}, { headers });
    loadEvents();
  };

  const handleEdit = (event) => {
    setForm({
      title: event.title, description: event.description, venue: event.venue,
      address: event.address, city: event.city, category: event.category,
      date: event.date, time: event.time, isFree: event.isFree,
      price: event.price || '', imageUrl: event.imageUrl, isFeatured: event.isFeatured,
      galleryImages: event.galleryImages ? event.galleryImages.join(', ') : '',
      latitude: event.latitude != null ? String(event.latitude) : '',
      longitude: event.longitude != null ? String(event.longitude) : '',
    });
    setEditingId(event._id);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(''); };

  const filtered = events.filter(e => {
    const matchSearch = !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.venue?.toLowerCase().includes(search.toLowerCase()) ||
      e.city?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || e.category === activeCategory;
    return matchSearch && matchCat;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? events.length : events.filter(e => e.category === cat).length;
    return acc;
  }, {});

  const pendingEvents = events.filter(e => e.status === 'pending');

  return (
    <div style={s.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .ev-skeleton { background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        .ev-input:focus { border-color: #374151 !important; box-shadow: 0 0 0 3px rgba(55,65,81,0.1) !important; outline: none; }
        .ev-btn-primary:hover:not(:disabled) { background: #1F2937 !important; }
        .ev-btn-primary { transition: background 0.15s; }
        .ev-cat-chip:hover { opacity: 1 !important; }
        .ev-card { transition: transform 0.18s, box-shadow 0.18s; }
        .ev-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .ev-card:hover .ev-card-actions { opacity: 1 !important; transform: translateY(0) !important; }
        .ev-row:hover { background: #FAFBFC !important; }
        .ev-delete-confirm { animation: fadeIn 0.15s ease; }
        .pac-container { z-index: 9999 !important; border-radius: 10px; border: 1px solid #E5E7EB; box-shadow: 0 8px 24px rgba(0,0,0,0.1); font-family: 'DM Sans', system-ui, sans-serif; margin-top: 4px; }
        .pac-item { padding: 10px 14px; font-size: 13px; cursor: pointer; color: #374151; }
        .pac-item:hover { background: #F9FAFB; }
        .pac-item-query { font-size: 13px; font-weight: 600; color: #111827; }
        .pac-matched { font-weight: 700; }
        .pac-icon { display: none; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <main style={s.main} ref={formRef}>

        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <p style={s.eyebrow}>Platform Content</p>
            <h1 style={s.pageTitle}>Events</h1>
          </div>
          <div style={s.topActions}>
            <div style={s.viewToggle}>
              <button
                onClick={() => setViewMode('grid')}
                style={{ ...s.viewBtn, ...(viewMode === 'grid' ? s.viewBtnActive : {}) }}
                title="Grid view"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/>
                  <rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{ ...s.viewBtn, ...(viewMode === 'list' ? s.viewBtnActive : {}) }}
                title="List view"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>
            <button
              className={showForm ? '' : 'ev-btn-primary'}
              onClick={() => showForm ? cancelForm() : setShowForm(true)}
              style={showForm ? s.btnCancel : s.btnPrimary}
            >
              {showForm ? (
                <>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Event
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pending Panel */}
        {pendingEvents.length > 0 && (
          <div style={s.pendingPanel}>
            <div style={s.pendingHeader}>
              <div style={s.pendingDot} />
              <span style={s.pendingTitle}>Pending approvals</span>
              <span style={s.pendingCount}>{pendingEvents.length}</span>
            </div>
            <div style={s.pendingGrid}>
              {pendingEvents.slice(0, 4).map(event => (
                <div key={event._id} style={s.pendingCard}>
                  {event.imageUrl && <img src={event.imageUrl} alt="event" style={s.pendingImg} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.pendingCardTitle}>{event.title}</div>
                    <div style={s.pendingCardMeta}>{event.venue}{event.city ? ` · ${event.city}` : ''}</div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 7 }}>
                      <button onClick={() => handleApprove(event._id)} style={s.approveBtn}>Approve</button>
                      <button onClick={() => handleReject(event._id)} style={s.rejectBtn}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div style={s.formCard}>
            <div style={s.formHeader}>
              <div>
                <div style={s.formTitle}>{editingId ? 'Edit Event' : 'New Event'}</div>
                <div style={s.formSub}>{editingId ? 'Update event details below' : 'Fill in the details to publish a new event'}</div>
              </div>
            </div>

            {error && (
              <div style={s.errorBox}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormSection label="Basic Information">
                <div style={s.grid2}>
                  <Field label="Event Title" required>
                    <input className="ev-input" style={s.input} name="title" value={form.title} onChange={handleChange} placeholder="e.g. Jazz Night at The Blue Room" required />
                  </Field>
                  <Field label="Category" required>
                    <select className="ev-input" style={s.input} name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Description">
                  <textarea className="ev-input" style={{ ...s.input, minHeight: 88, resize: 'vertical', lineHeight: 1.65 }} name="description" value={form.description} onChange={handleChange} placeholder="Describe the event..." />
                </Field>
              </FormSection>

              <FormSection label="Venue & Location">
                <div style={s.grid2}>
                  <Field label="Venue Name" required>
                    <input className="ev-input" style={s.input} name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. The Blue Room" required />
                  </Field>
                  <Field label="City" required>
                    <input className="ev-input" style={s.input} name="city" value={form.city} onChange={handleChange} placeholder="e.g. London" required />
                  </Field>
                </div>
                <Field label="Search Address / Venue">
                  <LocationSearchInput
                    apiKey={GOOGLE_MAPS_API_KEY}
                    value={form.address}
                    onChange={handleLocationSelected}
                  />
                  <div style={s.coordHint}>
                    {form.latitude && form.longitude ? (
                      <>
                        <span style={{ color: '#008E6D', fontWeight: 700 }}>📍 Pinned:</span>
                        &nbsp;{parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                        {form.city ? <>&nbsp;·&nbsp;{form.city}</> : null}
                      </>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>Search and select a place to pin it on the map</span>
                    )}
                  </div>
                </Field>
              </FormSection>

              <FormSection label="Date, Time & Pricing">
                <div style={s.grid3}>
                  <Field label="Date" required>
                    <input className="ev-input" style={s.input} name="date" type="date" value={form.date} onChange={handleChange} required />
                  </Field>
                  <Field label="Time">
                    <input className="ev-input" style={s.input} name="time" type="time" value={form.time} onChange={handleChange} />
                  </Field>
                  <Field label="Ticket Price (£)">
                    <input className="ev-input" style={{ ...s.input, ...(form.isFree ? { opacity: 0.4, pointerEvents: 'none' } : {}) }} name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" disabled={form.isFree} />
                  </Field>
                </div>
                <div style={s.checkRow}>
                  <CheckToggle label="Free Entry" name="isFree" checked={form.isFree} onChange={handleChange} color="#4B5563" />
                  <CheckToggle label="Featured Event" name="isFeatured" checked={form.isFeatured} onChange={handleChange} color="#111827" />
                </div>
              </FormSection>

              <FormSection label="Images">
                <div style={s.grid2}>
                  <Field label="Cover Image">
                    <div style={s.imageUploadArea}>
                      {form.imageUrl ? (
                        <div style={s.imagePreviewWrap}>
                          <img src={form.imageUrl} alt="cover" style={s.imagePreview} />
                          <div style={s.imageOverlay}>
                            <label style={s.changeImageBtn}>
                              Change
                              <input type="file" accept="image/*" onChange={handleMainImageChange} style={{ display: 'none' }} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label style={s.uploadLabel}>
                          <svg width="22" height="22" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <div style={s.uploadText}>Click to upload cover image</div>
                          <div style={s.uploadSub}>PNG, JPG up to 10MB</div>
                          <input type="file" accept="image/*" onChange={handleMainImageChange} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={s.urlToggleLabel}>Or paste a URL</span>
                      <input className="ev-input" style={s.input} name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />
                    </div>
                  </Field>
                  <Field label="Gallery Images">
                    <label style={{ ...s.uploadLabel, minHeight: 110, border: '1.5px dashed #E5E7EB', borderRadius: 9, backgroundColor: '#FAFAFA', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <svg width="20" height="20" fill="none" stroke="#D1D5DB" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="13" rx="2"/><path d="M22 4H10a2 2 0 0 0-2 2"/><circle cx="6.5" cy="10.5" r="1"/><polyline points="16 13 13 10 6 17"/></svg>
                      <div style={s.uploadText}>Upload gallery images</div>
                      <div style={s.uploadSub}>Select multiple files</div>
                      <input type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display: 'none' }} />
                    </label>
                    {form.galleryImages && (
                      <div style={s.galleryPreview}>
                        {form.galleryImages.split(',').slice(0, 4).map((url, i) => (
                          <img key={i} src={url.trim()} alt="" style={s.galleryThumb} />
                        ))}
                      </div>
                    )}
                  </Field>
                </div>
              </FormSection>

              <div style={s.formActions}>
                <button type="button" onClick={cancelForm} style={s.btnSecondary}>Discard</button>
                <button type="submit" className="ev-btn-primary" disabled={submitting} style={s.btnPrimary}>
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={s.spinner} /> {editingId ? 'Updating...' : 'Publishing...'}
                    </span>
                  ) : editingId ? 'Update Event' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar */}
        <div style={s.filterBar}>
          <div style={s.searchWrap}>
            <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={s.searchIcon}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="ev-input"
              style={s.searchInput}
              placeholder="Search events, venues, cities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.searchClear}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <div style={s.categoryChips}>
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat] || {};
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  className="ev-cat-chip"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    ...s.catChip,
                    ...(isActive ? {
                      backgroundColor: cat === 'All' ? '#111827' : meta.color,
                      color: '#fff',
                      borderColor: 'transparent',
                    } : {}),
                  }}
                >
                  {cat}
                  <span style={{
                    ...s.catCount,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                    color: isActive ? '#fff' : '#9CA3AF',
                  }}>
                    {categoryCounts[cat]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results label */}
        <div style={s.resultsBar}>
          <span style={s.resultsText}>
            {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'event' : 'events'}`}
            {activeCategory !== 'All' && ` in ${activeCategory}`}
            {search && ` matching "${search}"`}
          </span>
        </div>

        {/* Events Grid / List */}
        {loading ? (
          viewMode === 'grid' ? (
            <div style={s.grid}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={s.skeletonCard}>
                  <div className="ev-skeleton" style={{ height: 170, borderRadius: '12px 12px 0 0' }} />
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div className="ev-skeleton" style={{ height: 13, width: '70%' }} />
                    <div className="ev-skeleton" style={{ height: 11, width: '50%' }} />
                    <div className="ev-skeleton" style={{ height: 11, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.listContainer}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                  <div className="ev-skeleton" style={{ width: 52, height: 52, borderRadius: 9, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="ev-skeleton" style={{ height: 12, width: '38%' }} />
                    <div className="ev-skeleton" style={{ height: 10, width: '24%' }} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div style={s.emptyState}>
            <svg width="36" height="36" fill="none" stroke="#D1D5DB" strokeWidth="1.4" viewBox="0 0 24 24" style={{ marginBottom: 14 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div style={s.emptyTitle}>{events.length === 0 ? 'No events yet' : 'No matching events'}</div>
            <div style={s.emptySub}>{events.length === 0 ? 'Create your first event to get started.' : 'Try adjusting your search or filters.'}</div>
            {events.length === 0 && (
              <button className="ev-btn-primary" onClick={() => setShowForm(true)} style={{ ...s.btnPrimary, marginTop: 18 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create First Event
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={s.grid}>
            {filtered.map(ev => (
              <EventCard key={ev._id} event={ev} onEdit={() => handleEdit(ev)} onDelete={() => setDeleteConfirm(ev._id)} />
            ))}
          </div>
        ) : (
          <div style={s.listContainer}>
            {filtered.map((ev, i) => (
              <EventListRow key={ev._id} event={ev} index={i} onEdit={() => handleEdit(ev)} onDelete={() => setDeleteConfirm(ev._id)} />
            ))}
          </div>
        )}
      </main>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div style={s.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className="ev-delete-confirm" style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalIcon}>
              <svg width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="1.8" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 style={s.modalTitle}>Delete Event?</h3>
            <p style={s.modalSub}>This action cannot be undone. The event will be permanently removed from the platform.</p>
            <div style={s.modalActions}>
              <button onClick={() => setDeleteConfirm(null)} style={s.btnSecondary}>Keep</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={s.btnDanger}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Event Card ── */
const EventCard = ({ event: ev, onEdit, onDelete }) => {
  const meta = CATEGORY_META[ev.category] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' };
  const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="ev-card" style={s.card}>
      <div style={s.cardImg}>
        {ev.imageUrl ? (
          <img src={ev.imageUrl} alt={ev.title} style={s.cardImgEl} />
        ) : (
          <div style={{ ...s.cardImgPlaceholder, backgroundColor: meta.bg }}>
            <svg width="28" height="28" fill="none" stroke={meta.color} strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        )}
        <div style={s.cardBadges}>
          <span style={{ ...s.catBadge, backgroundColor: meta.color }}>{ev.category}</span>
          {ev.isFeatured && <span style={s.featBadge}>Featured</span>}
        </div>
        <div className="ev-card-actions" style={s.cardActions}>
          <button onClick={onEdit} style={s.cardActionBtn}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button onClick={onDelete} style={{ ...s.cardActionBtn, ...s.cardActionDelete }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Delete
          </button>
        </div>
      </div>
      <div style={s.cardBody}>
        <h3 style={s.cardTitle}>{ev.title}</h3>
        <div style={s.cardMeta}>
          <span style={s.cardMetaItem}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {ev.venue}{ev.city ? `, ${ev.city}` : ''}
          </span>
          <span style={s.cardMetaItem}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {dateStr}{ev.time ? ` · ${ev.time}` : ''}
          </span>
        </div>
      </div>
      <div style={s.cardFooter}>
        <span style={ev.isFree ? s.priceFree : s.priceTag}>
          {ev.isFree ? 'Free' : `£${ev.price}`}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={s.footerEditBtn}>Edit</button>
          <button onClick={onDelete} style={s.footerDeleteBtn}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── List Row ── */
const EventListRow = ({ event: ev, index, onEdit, onDelete }) => {
  const meta = CATEGORY_META[ev.category] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' };
  const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="ev-row" style={s.listRow}>
      <div style={s.listThumb}>
        {ev.imageUrl
          ? <img src={ev.imageUrl} alt="" style={s.listThumbImg} />
          : <div style={{ ...s.listThumbPlaceholder, backgroundColor: meta.bg }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={s.listTitle}>{ev.title}</span>
          {ev.isFeatured && <span style={s.listFeatBadge}>Featured</span>}
        </div>
        <div style={s.listMeta}>
          <span style={{ color: meta.color, fontWeight: '600', fontSize: 11 }}>{ev.category}</span>
          <span style={s.listDot} />
          {ev.venue}{ev.city ? `, ${ev.city}` : ''}
          <span style={s.listDot} />
          {dateStr}{ev.time ? ` · ${ev.time}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={ev.isFree ? s.priceFree : s.priceTag}>{ev.isFree ? 'Free' : `£${ev.price}`}</span>
        <button onClick={onEdit} style={s.footerEditBtn}>Edit</button>
        <button onClick={onDelete} style={s.footerDeleteBtn}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>
  );
};

/* ── Small helpers ── */
const FormSection = ({ label, children }) => (
  <div style={s.formSection}>
    <div style={s.formSectionLabel}>{label}</div>
    {children}
  </div>
);

const Field = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={s.fieldLabel}>{label}{required && <span style={{ color: '#6B7280', marginLeft: 2 }}>*</span>}</label>
    {children}
  </div>
);

const CheckToggle = ({ label, name, checked, onChange, color }) => (
  <label style={s.toggleWrap}>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} style={{ display: 'none' }} />
    <div style={{ ...s.toggleTrack, backgroundColor: checked ? color : '#E5E7EB', boxShadow: checked ? `0 0 0 3px ${color}20` : 'none' }}>
      <div style={{ ...s.toggleThumb, transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>{label}</span>
  </label>
);

const s = {
  layout: { display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#F8F9FB', fontFamily: "'DM Sans', system-ui, sans-serif" },
  main: { flex: 1, minWidth: 0, padding: '40px 48px', overflowY: 'auto' },

  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  eyebrow: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#111827', margin: 0, letterSpacing: '-0.6px' },
  topActions: { display: 'flex', gap: 10, alignItems: 'center' },

  viewToggle: { display: 'flex', backgroundColor: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 9, overflow: 'hidden' },
  viewBtn: { padding: '8px 11px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', transition: 'all 0.13s' },
  viewBtnActive: { backgroundColor: '#111827', color: '#fff' },

  btnPrimary: { display: 'flex', alignItems: 'center', gap: 7, backgroundColor: '#111827', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontWeight: '600', fontSize: 13, letterSpacing: '-0.1px', fontFamily: "'DM Sans', system-ui, sans-serif" },
  btnCancel: { display: 'flex', alignItems: 'center', gap: 7, backgroundColor: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontWeight: '600', fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif" },
  btnSecondary: { backgroundColor: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontWeight: '600', fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif" },
  btnDanger: { backgroundColor: '#374151', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontWeight: '600', fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif" },

  pendingPanel: { backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 18px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  pendingHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  pendingDot: { width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4B5563', boxShadow: '0 0 0 2px rgba(75,85,99,0.2)', flexShrink: 0 },
  pendingTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  pendingCount: { fontSize: 11, fontWeight: '700', backgroundColor: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: 20 },
  pendingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 },
  pendingCard: { display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12 },
  pendingImg: { width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  pendingCardTitle: { fontSize: 13.5, fontWeight: '600', color: '#111827' },
  pendingCardMeta: { fontSize: 11.5, color: '#6B7280', marginTop: 2 },
  approveBtn: { backgroundColor: '#111827', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontWeight: '600', fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif" },
  rejectBtn: { backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontWeight: '600', fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif" },

  formCard: { backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' },
  formHeader: { padding: '20px 24px', borderBottom: '1px solid #F3F4F6' },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: '-0.3px' },
  formSub: { fontSize: 12.5, color: '#9CA3AF', marginTop: 2 },
  formSection: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid #F3F4F6' },
  formSectionLabel: { fontSize: 10.5, fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: -2 },
  fieldLabel: { fontSize: 11.5, fontWeight: '600', color: '#374151', letterSpacing: '0.01em' },
  input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13.5, color: '#111827', backgroundColor: '#FAFAFA', boxSizing: 'border-box', fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'border-color 0.15s, box-shadow 0.15s', fontWeight: '400' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 },
  checkRow: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  toggleWrap: { display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' },
  toggleTrack: { width: 40, height: 22, borderRadius: 11, position: 'relative', transition: 'all 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '50%', marginTop: -8, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
  coordHint: { marginTop: 6, fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  imageUploadArea: { borderRadius: 9, overflow: 'hidden', border: '1.5px dashed #E5E7EB', backgroundColor: '#FAFAFA' },
  uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '22px 16px', cursor: 'pointer', minHeight: 120 },
  uploadText: { fontSize: 12.5, fontWeight: '600', color: '#6B7280' },
  uploadSub: { fontSize: 11, color: '#9CA3AF' },
  urlToggleLabel: { fontSize: 11, fontWeight: '500', color: '#9CA3AF', display: 'block', marginBottom: 5 },
  imagePreviewWrap: { position: 'relative', height: 120 },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover' },
  imageOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  changeImageBtn: { color: '#fff', fontSize: 12.5, fontWeight: '600', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 7 },
  galleryPreview: { display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  galleryThumb: { width: 48, height: 48, borderRadius: 7, objectFit: 'cover', border: '1.5px solid #E5E7EB' },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', color: '#374151', padding: '11px 24px', fontSize: 13, fontWeight: '500' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '18px 24px' },

  filterBar: { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center', minWidth: 180 },
  searchIcon: { position: 'absolute', left: 9, pointerEvents: 'none' },
  searchInput: { padding: '8px 30px 8px 29px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12.5, backgroundColor: '#FAFAFA', color: '#111827', width: 210, fontFamily: "'DM Sans', system-ui, sans-serif" },
  searchClear: { position: 'absolute', right: 9, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 0 },
  categoryChips: { display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 },
  catChip: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, border: '1.5px solid #E5E7EB', backgroundColor: '#FAFAFA', color: '#6B7280', fontSize: 12, fontWeight: '500', cursor: 'pointer', transition: 'all 0.13s', fontFamily: "'DM Sans', system-ui, sans-serif" },
  catCount: { fontSize: 10.5, fontWeight: '600', padding: '1px 5px', borderRadius: 10 },

  resultsBar: { marginBottom: 12 },
  resultsText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16, marginBottom: 32 },
  skeletonCard: { backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' },

  card: { backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cardImg: { position: 'relative', height: 168, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  cardImgEl: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBadges: { position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 },
  catBadge: { fontSize: 10, fontWeight: '700', color: '#fff', padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' },
  featBadge: { fontSize: 10, fontWeight: '700', color: '#fff', padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(31,41,55,0.85)', backdropFilter: 'blur(4px)' },
  cardActions: { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 6, padding: '10px', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)', opacity: 0, transform: 'translateY(4px)', transition: 'all 0.18s' },
  cardActionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.92)', color: '#111827', border: 'none', borderRadius: 7, padding: '7px', fontSize: 12, fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" },
  cardActionDelete: { backgroundColor: 'rgba(55,65,81,0.95)', color: '#fff' },
  cardBody: { padding: '13px 15px 10px', flex: 1 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: '#111827', marginBottom: 7, letterSpacing: '-0.2px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 3 },
  cardMetaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#9CA3AF', fontWeight: '400' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderTop: '1px solid #F3F4F6' },
  priceFree: { fontSize: 12, fontWeight: '600', color: '#374151', backgroundColor: 'rgba(55,65,81,0.08)', padding: '3px 9px', borderRadius: 20 },
  priceTag: { fontSize: 14, fontWeight: '700', color: '#111827' },
  footerEditBtn: { fontSize: 12, fontWeight: '600', color: '#374151', backgroundColor: '#F3F4F6', border: 'none', padding: '5px 11px', borderRadius: 7, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" },
  footerDeleteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, backgroundColor: 'rgba(55,65,81,0.08)', color: '#374151', border: 'none', borderRadius: 7, cursor: 'pointer' },

  listContainer: { display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 32 },
  listRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: '1px solid #F3F4F6', transition: 'background 0.1s' },
  listThumb: { width: 52, height: 52, borderRadius: 9, overflow: 'hidden', flexShrink: 0, backgroundColor: '#F3F4F6' },
  listThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  listThumbPlaceholder: { width: '100%', height: '100%' },
  listTitle: { fontSize: 13.5, fontWeight: '600', color: '#111827', letterSpacing: '-0.1px' },
  listFeatBadge: { fontSize: 10, fontWeight: '600', color: '#1F2937', backgroundColor: 'rgba(31,41,55,0.09)', padding: '2px 7px', borderRadius: 20 },
  listMeta: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#9CA3AF', flexWrap: 'wrap' },
  listDot: { width: 3, height: 3, borderRadius: '50%', backgroundColor: '#D1D5DB', flexShrink: 0 },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6, letterSpacing: '-0.2px' },
  emptySub: { fontSize: 13.5, color: '#9CA3AF', fontWeight: '400', textAlign: 'center' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', textAlign: 'center' },
  modalIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(55,65,81,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8, letterSpacing: '-0.3px' },
  modalSub: { fontSize: 13, color: '#9CA3AF', lineHeight: 1.65, marginBottom: 22, fontWeight: '400' },
  modalActions: { display: 'flex', gap: 9, justifyContent: 'center' },

  spinner: { width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
};

export default EventsPage;