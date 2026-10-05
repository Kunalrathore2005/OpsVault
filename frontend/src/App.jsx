import { useEffect, useState, useRef, useCallback, useMemo, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, ListTodo, ClipboardCheck, Bell,
  FileWarning, FolderOpen, Box, UserCircle, Menu, LogOut, Plus, Trash2, Check, X, Download, CheckCheck,
  AlertCircle, Clock, CheckCircle2, XCircle, ArrowUpRight, RefreshCw, Layers, ShieldCheck, Activity, HardDrive,
  Zap, ShieldAlert, FileBarChart, Calendar, Play, ChevronLeft, ChevronRight, Sliders, CalendarDays, Filter, Eye, AlertTriangle, PlayCircle,
  Edit2, Key, Lock, Shield, Search, MessageSquare, Send, History, Sparkles, CornerDownLeft, Command, FileText, Info
} from 'lucide-react';
import {
  authService, departmentService, taskService, approvalService,
  notificationService, profileService, userService, incidentService,
  assetService, documentService, automationService, escalationService,
  reportService, reportScheduleService, calendarService, slaService,
  commentService, searchService
} from './services/services';
import LandingPage from './LandingPage/LandingPage';

// Sidebar navigation items (with enterprise additions)
const nav = [
  ['Dashboard', '/', LayoutDashboard],
  ['Tasks', '/tasks', ListTodo],
  ['Requests', '/approvals', ClipboardCheck],
  ['Employees', '/employees', Users, ['ADMIN', 'MANAGER']],
  ['Departments', '/departments', Building2, ['ADMIN', 'MANAGER']],
  ['Incidents', '/incidents', FileWarning],
  ['Documents', '/documents', FolderOpen],
  ['Assets', '/assets', Box],
  ['Automation', '/automations', Zap, ['ADMIN', 'MANAGER']],
  ['Escalations', '/escalations', ShieldAlert, ['ADMIN', 'MANAGER']],
  ['Reports', '/reports', FileBarChart, ['ADMIN', 'MANAGER']],
  ['Profile', '/profile', UserCircle]
];

function useLoad(fn, key = 'load') {
  const [state, set] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    let live = true;
    set(v => ({ ...v, loading: true }));
    fn()
      .then(data => live && set({ loading: false, data, error: null }))
      .catch(e => live && set({ loading: false, data: null, error: e.message }));
    return () => { live = false; };
  }, [key]);
  return state;
}

// ----------------- TOAST NOTIFICATION SYSTEM -----------------

const ToastContext = createContext({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {}
});

export function useToast() {
  return useContext(ToastContext);
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  const content = (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(t => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : t.type === 'warning' ? AlertTriangle : Info;
        return (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <Icon size={18} className="toast-icon" />
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-msg">{t.message}</div>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const newToast = { id, type, message, title };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = useMemo(() => ({
    show: (msg, title) => addToast('info', msg, title),
    success: (msg, title) => addToast('success', msg, title),
    error: (msg, title) => addToast('error', msg, title),
    info: (msg, title) => addToast('info', msg, title),
    warning: (msg, title) => addToast('warning', msg, title),
  }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// ----------------- SKELETON SHIMMER LOADERS -----------------

function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table-wrap">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="skeleton-table-row">
          <div className="skeleton" style={{ height: 16, width: `${25 + (rIdx % 3) * 10}%` }} />
          <div className="skeleton" style={{ height: 16, width: `${15 + (rIdx % 2) * 8}%` }} />
          <div className="skeleton" style={{ height: 16, width: `${20 + (rIdx % 4) * 5}%` }} />
          <div className="skeleton" style={{ height: 16, width: '15%' }} />
          <div className="skeleton" style={{ height: 28, width: 70, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card stat" style={{ padding: 18 }}>
          <div className="skeleton skeleton-circle" style={{ width: 28, height: 28, marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: '50%', height: 12 }} />
          <div className="skeleton" style={{ width: '80%', height: 22 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" style={{ width: '90%' }} />
      <div className="skeleton skeleton-text" style={{ width: '75%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
    </div>
  );
}

// ----------------- UNIVERSAL COMMAND PALETTE (Ctrl + K / Cmd + K) -----------------

function CommandPalette({ open, onClose, user, onNavigate, onOpenCreateTask, onOpenReportIncident, onOpenAddEvent, onToggleTheme }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSearchResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global capture listener for Escape key to ensure it always closes the palette
  useEffect(() => {
    if (!open) return;
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchService.query(query.trim())
        .then(res => {
          setSearchResults(res.results || []);
          setActiveIndex(0);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Quick navigation items filtered by role
  const quickNav = useMemo(() => {
    const pages = [
      { id: 'dashboard', title: 'Dashboard', subtitle: 'Executive overview & operations', url: '/', icon: LayoutDashboard },
      { id: 'tasks', title: 'Tasks', subtitle: 'Task tracking & SLA deadlines', url: '/tasks', icon: ListTodo },
      { id: 'approvals', title: 'Requests & Approvals', subtitle: 'Operational requests & reviews', url: '/approvals', icon: ClipboardCheck },
      { id: 'incidents', title: 'Incidents', subtitle: 'Incident management & outages', url: '/incidents', icon: FileWarning },
      { id: 'documents', title: 'Documents', subtitle: 'File repository & assets', url: '/documents', icon: FolderOpen },
      { id: 'assets', title: 'Assets', subtitle: 'Hardware and equipment inventory', url: '/assets', icon: Box },
      { id: 'profile', title: 'Profile & Security', subtitle: 'User settings, security & calendar', url: '/profile', icon: UserCircle }
    ];
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      pages.splice(3, 0,
        { id: 'employees', title: 'Employees', subtitle: 'Team member directory & governance', url: '/employees', icon: Users },
        { id: 'departments', title: 'Departments', subtitle: 'Organizational teams & assignments', url: '/departments', icon: Building2 },
        { id: 'automations', title: 'Automation Engine', subtitle: 'Event triggers & automated actions', url: '/automations', icon: Zap },
        { id: 'escalations', title: 'Escalations & SLA', subtitle: 'Breach resolution & SLA governance', url: '/escalations', icon: ShieldAlert },
        { id: 'reports', title: 'Business Reports', subtitle: 'Automated schedules & export history', url: '/reports', icon: FileBarChart }
      );
    }
    if (!query.trim()) return pages;
    return pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.subtitle.toLowerCase().includes(query.toLowerCase()));
  }, [user, query]);

  // Quick actions
  const quickActions = useMemo(() => {
    const actions = [
      { id: 'act-task', title: 'Create New Task', subtitle: 'Add personal or assigned task', icon: Plus, action: () => { onClose(); if (onOpenCreateTask) onOpenCreateTask(); } },
      { id: 'act-incident', title: 'Report Incident', subtitle: 'Log a critical issue or outage', icon: FileWarning, action: () => { onClose(); if (onOpenReportIncident) onOpenReportIncident(); } },
      { id: 'act-event', title: 'Add Calendar Event', subtitle: 'Schedule deadline or reminder', icon: Calendar, action: () => { onClose(); if (onOpenAddEvent) onOpenAddEvent(); } },
      { id: 'act-theme', title: 'Toggle Light / Dark Mode', subtitle: 'Switch color theme', icon: Sliders, action: () => { if (onToggleTheme) onToggleTheme(); } },
    ];
    if (!query.trim()) return actions;
    return actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.subtitle.toLowerCase().includes(query.toLowerCase()));
  }, [query, onClose, onOpenCreateTask, onOpenReportIncident, onOpenAddEvent, onToggleTheme]);

  const allItems = useMemo(() => {
    const list = [];
    if (searchResults.length > 0) {
      searchResults.forEach(r => list.push({ ...r, kind: 'search' }));
    }
    quickNav.forEach(n => list.push({ ...n, kind: 'nav' }));
    quickActions.forEach(a => list.push({ ...a, kind: 'action' }));
    return list;
  }, [searchResults, quickNav, quickActions]);

  const handleSelect = (item) => {
    if (!item) return;
    if (item.kind === 'action' && item.action) {
      item.action();
    } else if (item.url) {
      onClose();
      if (onNavigate) onNavigate(item.url);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[activeIndex]) {
        handleSelect(allItems[activeIndex]);
      }
    }
  };

  if (!open) return null;

  const content = (
    <div className="cmd-palette-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-palette" onKeyDown={handleKeyDown}>
        <div className="cmd-search-bar">
          <Search size={18} style={{ color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, incidents, users, or jump to page... (⌘K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button type="button" className="quiet" onClick={() => setQuery('')} style={{ padding: 4 }}>
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className="cmd-kbd"
            onClick={onClose}
            title="Close (ESC)"
            style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: 4, color: 'var(--muted)' }}
          >
            ESC
          </button>
        </div>

        <div className="cmd-results-list">
          {searchResults.length > 0 && (
            <div>
              <div className="cmd-group-label">Matching System Records</div>
              {searchResults.map((item, idx) => {
                const globalIdx = idx;
                const isSelected = activeIndex === globalIdx;
                const Icon = item.type === 'task' ? ListTodo : item.type === 'incident' ? FileWarning : item.type === 'user' ? Users : item.type === 'asset' ? Box : FolderOpen;
                return (
                  <div
                    key={`search-${item.id}-${item.type}`}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelect({ ...item, kind: 'search' })}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-left">
                      <div className="cmd-item-icon"><Icon size={16} /></div>
                      <div className="cmd-item-info">
                        <span className="cmd-item-title">{item.title}</span>
                        {item.subtitle && <span className="cmd-item-subtitle">{item.subtitle}</span>}
                      </div>
                    </div>
                    {item.badge && <span className="badge" style={{ fontSize: 10, padding: '2px 6px' }}>{item.badge}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {quickNav.length > 0 && (
            <div>
              <div className="cmd-group-label">Navigation & Pages</div>
              {quickNav.map((item, idx) => {
                const globalIdx = searchResults.length + idx;
                const isSelected = activeIndex === globalIdx;
                const Icon = item.icon;
                return (
                  <div
                    key={`nav-${item.id}`}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelect({ ...item, kind: 'nav' })}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-left">
                      <div className="cmd-item-icon"><Icon size={16} /></div>
                      <div className="cmd-item-info">
                        <span className="cmd-item-title">{item.title}</span>
                        {item.subtitle && <span className="cmd-item-subtitle">{item.subtitle}</span>}
                      </div>
                    </div>
                    <CornerDownLeft size={13} style={{ color: 'var(--muted)' }} />
                  </div>
                );
              })}
            </div>
          )}

          {quickActions.length > 0 && (
            <div>
              <div className="cmd-group-label">Quick Actions</div>
              {quickActions.map((item, idx) => {
                const globalIdx = searchResults.length + quickNav.length + idx;
                const isSelected = activeIndex === globalIdx;
                const Icon = item.icon;
                return (
                  <div
                    key={`act-${item.id}`}
                    className={`cmd-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelect({ ...item, kind: 'action' })}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                  >
                    <div className="cmd-item-left">
                      <div className="cmd-item-icon"><Icon size={16} /></div>
                      <div className="cmd-item-info">
                        <span className="cmd-item-title">{item.title}</span>
                        {item.subtitle && <span className="cmd-item-subtitle">{item.subtitle}</span>}
                      </div>
                    </div>
                    <span className="cmd-kbd">ACTION</span>
                  </div>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && !loading && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No matching pages, records, or actions found for "{query}".
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-footer-shortcuts">
            <span><kbd className="cmd-kbd">↑</kbd> <kbd className="cmd-kbd">↓</kbd> Navigate</span>
            <span><kbd className="cmd-kbd">↵</kbd> Select</span>
            <span><kbd className="cmd-kbd">ESC</kbd> Close</span>
          </div>
          <div>OpsVault Spotlight</div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

// ----------------- ACTIVITY & COMMENTS SLIDE-OVER DRAWER -----------------

function ActivityDrawer({ open, onClose, targetType, targetItem, user, onUpdate }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open || !targetItem?.id) return;
    setLoading(true);
    commentService.list(targetType, targetItem.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [open, targetType, targetItem?.id]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const newComment = await commentService.create(targetType, targetItem.id, { content: commentText.trim() });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment posted successfully');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  if (!open || !targetItem) return null;

  const title = targetItem.title || targetItem.subject || targetItem.name || `${targetType} #${targetItem.id}`;
  const status = targetItem.status?.value || targetItem.status || 'ACTIVE';
  const priority = targetItem.priority || targetItem.severity || 'MEDIUM';

  const content = (
    <div className="drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer">
        <div className="drawer-header">
          <div className="drawer-header-title">
            <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
            <h3>{title}</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-overview-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Badge value={status} />
              <Badge value={priority} />
            </div>
            <div className="drawer-overview-grid">
              <div className="drawer-overview-item">
                <span>Record Type</span>
                <b>{targetType}</b>
              </div>
              <div className="drawer-overview-item">
                <span>Record ID</span>
                <b>#{targetItem.id}</b>
              </div>
              {targetItem.created_at && (
                <div className="drawer-overview-item">
                  <span>Created</span>
                  <b>{new Date(targetItem.created_at).toLocaleDateString()}</b>
                </div>
              )}
              {targetItem.due_date && (
                <div className="drawer-overview-item">
                  <span>Due Date</span>
                  <b>{new Date(targetItem.due_date).toLocaleDateString()}</b>
                </div>
              )}
            </div>
            {targetItem.description && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {targetItem.description}
              </div>
            )}
            {targetItem.details && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {targetItem.details}
              </div>
            )}
          </div>

          <div>
            <div className="drawer-section-title">
              <History size={13} />
              Discussion & Activity ({comments.length})
            </div>

            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                <span className="btn-spinner" style={{ marginRight: 8 }} /> Loading conversation...
              </div>
            ) : comments.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text)' }}>No comments yet</p>
                <span>Start the conversation by posting an update below.</span>
              </div>
            ) : (
              <div className="comments-list">
                {comments.map(c => {
                  const initial = c.author_name ? c.author_name.charAt(0).toUpperCase() : 'U';
                  return (
                    <div key={c.id} className="comment-card">
                      <div className="comment-avatar">{initial}</div>
                      <div className="comment-bubble">
                        <div className="comment-bubble-header">
                          <span className="comment-author-name">
                            {c.author_name}
                            <span className="badge" style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px' }}>
                              {c.author_role}
                            </span>
                          </span>
                          <span className="comment-time">{timeAgo(c.created_at)}</span>
                        </div>
                        <div className="comment-text">{c.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form className="comment-form" onSubmit={handlePostComment}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Add a note or comment
            </label>
            <textarea
              placeholder="Write a message, note or resolution update... (Press ⌘+Enter to send)"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              rows={3}
            />
            <div className="comment-form-footer">
              <span className="comment-form-hint">⌘+Enter to post</span>
              <button type="submit" disabled={posting || !commentText.trim()}>
                {posting ? <span className="btn-spinner" /> : <Send size={14} />}
                Post Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

// ----------------- CUSTOM DAY/NIGHT SWITCH (MATCHING IMAGE 2) -----------------

function ThemeToggleSwitch({ dark, onToggle }) {
  return (
    <button
      type="button"
      className={`theme-switch-btn ${dark ? 'dark' : 'light'}`}
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="theme-switch-bg">
        {!dark ? (
          <div className="switch-clouds" />
        ) : (
          <div className="switch-stars">
            <span className="switch-star-dot" style={{ top: 2, left: 3 }} />
            <span className="switch-star-dot" style={{ top: 8, left: 9, width: 1.5, height: 1.5 }} />
            <span className="switch-star-dot" style={{ top: 4, left: 14 }} />
          </div>
        )}
      </div>
      <div className="theme-switch-thumb">
        {dark && (
          <>
            <span className="moon-crater crater-1" />
            <span className="moon-crater crater-2" />
            <span className="moon-crater crater-3" />
          </>
        )}
      </div>
    </button>
  );
}

// ----------------- CENTER-SCREEN THEME TRANSITION OVERLAY (0.5s DURATION) -----------------

function ThemeCenterOverlay({ type, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 500); // Exactly 0.5s duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!type) return null;

  return (
    <div className="theme-center-overlay" aria-hidden="true">
      {type === 'to-dark' ? (
        <div className="theme-center-card theme-center-night">
          <div className="center-stars-wrap">
            <span className="center-star" style={{ top: '15%', left: '20%', width: 4, height: 4 }} />
            <span className="center-star" style={{ top: '35%', left: '15%', width: 5, height: 5, animationDelay: '100ms' }} />
            <span className="center-star" style={{ top: '75%', left: '25%', width: 3, height: 3, animationDelay: '200ms' }} />
            <span className="center-star" style={{ top: '20%', right: '20%', width: 4, height: 4, animationDelay: '150ms' }} />
            <span className="center-star" style={{ top: '65%', right: '15%', width: 5, height: 5, animationDelay: '250ms' }} />
          </div>
          <div className="center-moon">
            <span className="moon-crater crater-1" />
            <span className="moon-crater crater-2" />
            <span className="moon-crater crater-3" />
          </div>
        </div>
      ) : (
        <div className="theme-center-card theme-center-day">
          <div className="center-sun" />
          <div className="center-bird" style={{ top: '25%', left: '20%' }} />
          <div className="center-bird" style={{ top: '35%', left: '40%', animationDelay: '70ms', transform: 'scale(0.8)' }} />
          <div className="center-bird" style={{ top: '15%', left: '30%', animationDelay: '140ms', transform: 'scale(0.6)' }} />
        </div>
      )}
    </div>
  );
}

// ----------------- NOTIFICATION BELL & DROPDOWN -----------------

function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const notifState = useLoad(() => notificationService.list(), `header-notifs-${revision}`);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const notifications = notifState.data || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.read(id);
      setRevision(v => v + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.is_read);
    try {
      await Promise.all(unreadItems.map(n => notificationService.read(n.id)));
      setRevision(v => v + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.remove(id);
      setRevision(v => v + 1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="icon"
        onClick={() => {
          setOpen(!open);
          if (!open) setRevision(v => v + 1);
        }}
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge" />}
      </button>

      {open && (
        <div className="notif-popup" role="dialog" aria-label="Notifications dropdown">
          <div className="notif-header">
            <h3>
              Notifications
              {unreadCount > 0 && (
                <span className="badge pending" style={{ padding: '2px 6px', fontSize: 10 }}>
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="quiet"
                onClick={handleMarkAllRead}
                style={{ fontSize: 11, padding: '4px 8px' }}
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-body">
            {notifState.loading ? (
              <div className="notif-empty">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={!n.is_read ? (e) => handleMarkRead(n.id, e) : undefined}
                >
                  {!n.is_read && <span className="notif-unread-dot" />}
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-desc">{n.body}</div>
                    <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <div className="notif-item-actions">
                    {!n.is_read && (
                      <button
                        type="button"
                        className="quiet"
                        onClick={(e) => handleMarkRead(n.id, e)}
                        title="Mark as read"
                        style={{ padding: '4px 6px' }}
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="quiet"
                      onClick={(e) => handleDelete(n.id, e)}
                      title="Delete notification"
                      style={{ padding: '4px 6px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------- QUICK EVENT MODAL & CALENDAR POPUP -----------------

function QuickEventModal({ defaultDate, close, onSaved }) {
  const dateStr = defaultDate ? defaultDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const [data, setData] = useState({
    title: '',
    description: '',
    start_time: `${dateStr}T09:00`,
    end_time: `${dateStr}T10:00`,
    event_type: 'PERSONAL',
    reminder_minutes: 15,
    is_all_day: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await calendarService.create({
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: data.end_time ? new Date(data.end_time).toISOString() : null
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Calendar Event" close={close}>
      <form onSubmit={submit}>
        {error && <Error text={error} />}
        <label>
          Event Title *
          <input
            type="text"
            required
            placeholder="e.g., Team Sync, Server Maintenance, Review"
            value={data.title}
            onChange={e => setData({ ...data, title: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            placeholder="Notes or agenda..."
            value={data.description}
            onChange={e => setData({ ...data, description: e.target.value })}
            rows={2}
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Event Type
            <select
              value={data.event_type}
              onChange={e => setData({ ...data, event_type: e.target.value })}
            >
              <option value="PERSONAL">Personal Note</option>
              <option value="MEETING">Meeting</option>
              <option value="DEADLINE">Deadline</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="REMINDER">Reminder</option>
            </select>
          </label>
          <label>
            Reminder
            <select
              value={data.reminder_minutes}
              onChange={e => setData({ ...data, reminder_minutes: Number(e.target.value) })}
            >
              <option value="0">No reminder</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Start Date & Time *
            <input
              type="datetime-local"
              required
              value={data.start_time}
              onChange={e => setData({ ...data, start_time: e.target.value })}
            />
          </label>
          <label>
            End Date & Time
            <input
              type="datetime-local"
              value={data.end_time}
              onChange={e => setData({ ...data, end_time: e.target.value })}
            />
          </label>
        </div>
        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="quiet" onClick={close} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : <Plus size={15} />}
            Create Event
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CalendarPopup({ user }) {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [revision, setRevision] = useState(0);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const startMonthStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  const endMonthStr = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const eventsState = useLoad(() => calendarService.list(startMonthStr, endMonthStr), `cal-popup-${currentDate.getMonth()}-${revision}`);
  const events = eventsState.data || [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
  }

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const isSelected = (d) => {
    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  };

  const hasEventsOnDate = (d) => {
    const dateStr = d.toISOString().slice(0, 10);
    return events.some(e => {
      const eDate = e.start_time ? e.start_time.slice(0, 10) : '';
      return eDate === dateStr;
    });
  };

  const selectedDateEvents = events.filter(e => {
    const dStr = selectedDate.toISOString().slice(0, 10);
    const eDate = e.start_time ? e.start_time.slice(0, 10) : '';
    return eDate === dStr;
  });

  return (
    <div className="cal-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="icon"
        onClick={() => {
          setOpen(!open);
          if (!open) setRevision(v => v + 1);
        }}
        aria-label="Personal Calendar"
        title="Personal Calendar & Deadlines"
      >
        <Calendar size={18} />
      </button>

      {open && (
        <div className="cal-popup" role="dialog" aria-label="Calendar dropdown">
          <div className="cal-popup-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="quiet"
                style={{ padding: 4 }}
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                <ChevronLeft size={14} />
              </button>
              <strong>{currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong>
              <button
                type="button"
                className="quiet"
                style={{ padding: 4 }}
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <button
              type="button"
              className="quiet"
              style={{ fontSize: 11, padding: '4px 8px' }}
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDate(now);
              }}
            >
              Today
            </button>
          </div>

          <div className="cal-mini-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} className="cal-mini-day-name">{d}</span>
            ))}
            {days.map((item, idx) => (
              <div
                key={idx}
                className={`cal-mini-day ${!item.currentMonth ? 'other-month' : ''} ${isToday(item.date) ? 'today' : ''} ${isSelected(item.date) ? 'selected' : ''}`}
                onClick={() => setSelectedDate(item.date)}
              >
                {item.day}
                {hasEventsOnDate(item.date) && <span className="cal-mini-dot" />}
              </div>
            ))}
          </div>

          <div className="cal-popup-events">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 2 }}>
              Events for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
            </div>
            {selectedDateEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }}>
                No events or deadlines on this day.
              </div>
            ) : (
              selectedDateEvents.map(e => (
                <div key={e.id} className="cal-popup-event-item">
                  <span className="cal-item-title">{e.title}</span>
                  <span className={`badge ${e.source ? e.source.toLowerCase() : 'event'}`} style={{ fontSize: 10, padding: '1px 5px' }}>
                    {e.source || e.event_type || 'Event'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="cal-popup-footer">
            <button
              type="button"
              className="quiet"
              style={{ fontSize: 12, padding: '4px 8px' }}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={13} /> Add event
            </button>
            <NavLink
              to="/profile"
              style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
              onClick={() => setOpen(false)}
            >
              Open Full Calendar →
            </NavLink>
          </div>
        </div>
      )}

      {showAddModal && (
        <QuickEventModal
          defaultDate={selectedDate}
          close={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            setRevision(v => v + 1);
          }}
        />
      )}
    </div>
  );
}

// ----------------- MAIN SHELL LAYOUT -----------------

function Shell({ profile, children, dark, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const links = nav.filter(x => !x[3] || (Array.isArray(x[3]) ? x[3].includes(profile.role) : x[3] === profile.role));

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={open ? 'open' : ''}>
        <div className="brand">◈ OpsVault</div>
        <nav>
          {links.map(([label, to, Icon]) => (
            <NavLink onClick={() => setOpen(false)} key={to} to={to} end>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="quiet logout" onClick={() => { authService.logout(); location.href = '/login'; }}>
          <LogOut size={18} />Sign out
        </button>
      </aside>

      <main>
        <header>
          <button className="icon mobile" onClick={() => setOpen(!open)} aria-label="Toggle navigation menu">
            <Menu size={20} />
          </button>
          <div>
            <strong>Operations workspace</strong>
            <span className="muted">Secure, API-first management ({profile.role})</span>
          </div>

          <button
            type="button"
            className="nav-search-btn"
            onClick={() => setCmdOpen(true)}
            aria-label="Quick search and command palette (Ctrl+K)"
            title="Search anything (⌘K)"
          >
            <Search size={14} className="nav-search-icon" />
            <span>Search anything...</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="header-right">
            {/* Custom Day/Night Pill Switch matching Image 2 */}
            <ThemeToggleSwitch dark={dark} onToggle={onToggleTheme} />

            <CalendarPopup user={profile} />

            <NotificationBell user={profile} />

            <NavLink className="avatar" to="/profile" aria-label="View Profile" title="View Profile">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </NavLink>
          </div>
        </header>

        {children}
      </main>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        user={profile}
        onNavigate={(url) => navigate(url)}
        onOpenCreateTask={() => navigate('/tasks')}
        onOpenReportIncident={() => navigate('/incidents')}
        onOpenAddEvent={() => navigate('/profile')}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}

// ----------------- DATE & TIME HELPERS -----------------

function formatCurrentDate() {
  const now = new Date();
  const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  return now.toLocaleDateString('en-US', options);
}

function timeAgo(dateString) {
  if (!dateString) return 'recently';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return past.toLocaleDateString();
}

// ----------------- NATIVE SVG DONUT CHART -----------------

function DonutChart({ data = [], total, centerLabel = "Total", size = 170, thickness = 20, unit = "" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const sum = total !== undefined ? total : data.reduce((acc, cur) => acc + (cur.value || 0), 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-box" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="donut-svg">
          {/* Base background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={thickness}
            opacity="0.35"
          />

          {sum === 0 ? (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--border)"
              strokeWidth={thickness}
              strokeDasharray={circumference}
              strokeDashoffset="0"
            />
          ) : (
            data.map((item, idx) => {
              if (!item.value || item.value <= 0) return null;
              const percent = item.value / sum;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={item.label || idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? thickness + 3 : thickness}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: 'stroke-width 180ms ease, opacity 180ms ease',
                    opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                    cursor: 'pointer'
                  }}
                />
              );
            })
          )}
        </svg>

        {/* Centered summary readout */}
        <div className="donut-center-info">
          <span className="donut-center-val">
            {hoveredIdx !== null && data[hoveredIdx]
              ? data[hoveredIdx].value
              : sum}
            {unit}
          </span>
          <span className="donut-center-lbl">
            {hoveredIdx !== null && data[hoveredIdx]
              ? data[hoveredIdx].label
              : centerLabel}
          </span>
        </div>
      </div>

      {/* Structured Legend */}
      <div className="donut-legend-list">
        {data.map((item, idx) => {
          const percent = sum > 0 ? Math.round(((item.value || 0) / sum) * 100) : 0;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.label || idx}
              className={`donut-legend-row ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="donut-legend-left">
                <span className="donut-dot" style={{ backgroundColor: item.color }} />
                <span className="donut-name">{item.label}</span>
              </div>
              <div className="donut-legend-right">
                <span className="donut-val">{item.value || 0}</span>
                <span className="donut-pct">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------- OPERATIONS DATA HOOK -----------------

function useOperationsData(role, revision) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let live = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    Promise.allSettled([
      taskService.list(),
      approvalService.list(),
      departmentService.list(),
      userService.list().catch(() => ({ items: [] })),
      incidentService.list().catch(() => ({ items: [] })),
      assetService.list().catch(() => ({ items: [] })),
      documentService.list().catch(() => []),
      notificationService.list().catch(() => []),
      slaService.summary().catch(() => null),
      escalationService.list().catch(() => []),
      automationService.list().catch(() => []),
      reportScheduleService.list().catch(() => [])
    ]).then(([tasksRes, approvalsRes, deptsRes, usersRes, incidentsRes, assetsRes, docsRes, notifsRes, slaRes, escRes, autoRes, schedRes]) => {
      if (!live) return;

      const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value?.items || tasksRes.value || []) : [];
      const approvals = approvalsRes.status === 'fulfilled' ? (approvalsRes.value || []) : [];
      const departments = deptsRes.status === 'fulfilled' ? (deptsRes.value || []) : [];
      const users = usersRes.status === 'fulfilled' ? (usersRes.value?.items || usersRes.value || []) : [];
      const incidents = incidentsRes.status === 'fulfilled' ? (incidentsRes.value?.items || incidentsRes.value || []) : [];
      const assets = assetsRes.status === 'fulfilled' ? (assetsRes.value?.items || assetsRes.value || []) : [];
      const documents = docsRes.status === 'fulfilled' ? (docsRes.value || []) : [];
      const notifications = notifsRes.status === 'fulfilled' ? (notifsRes.value || []) : [];
      const slaSummary = slaRes.status === 'fulfilled' ? slaRes.value : null;
      const escalations = escRes.status === 'fulfilled' ? (escRes.value || []) : [];
      const automations = autoRes.status === 'fulfilled' ? (autoRes.value || []) : [];
      const reportSchedules = schedRes.status === 'fulfilled' ? (schedRes.value || []) : [];

      setState({
        loading: false,
        error: null,
        data: {
          tasks,
          approvals,
          departments,
          users,
          incidents,
          assets,
          documents,
          notifications,
          slaSummary,
          escalations,
          automations,
          reportSchedules
        }
      });
    }).catch(err => {
      if (live) setState({ loading: false, data: null, error: err.message });
    });

    return () => { live = false; };
  }, [revision, role]);

  return state;
}

// ----------------- OPERATIONS CONTROL CENTER (ADMIN & MANAGER) -----------------

function OperationsDashboard({ profile }) {
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const role = profile.profile?.role || profile.role;
  const firstName = (profile.profile?.full_name || profile.full_name || 'Admin').split(' ')[0];

  const { loading, data, error } = useOperationsData(role, revision);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRevision(v => v + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const tasks = data?.tasks || [];
  const approvals = data?.approvals || [];
  const departments = data?.departments || [];
  const users = data?.users || [];
  const incidents = data?.incidents || [];
  const assets = data?.assets || [];
  const documents = data?.documents || [];
  const escalations = data?.escalations || [];
  const automations = data?.automations || [];
  const reportSchedules = data?.reportSchedules || [];
  const slaSummary = data?.slaSummary;

  // 1. KPI Metrics
  const totalEmployees = users.length || departments.reduce((acc, d) => acc + (d.employee_count || d.employees?.length || 0), 0);
  const totalDepartments = departments.length;
  const activeTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const pendingRequests = approvals.filter(a => a.status === 'PENDING').length;
  const openEscalationsCount = escalations.filter(e => e.status === 'OPEN').length;

  // 2. Task breakdown
  const pendingTasksCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const droppedTasksCount = tasks.filter(t => t.status === 'CANCELLED').length;

  const taskChartData = [
    { label: 'Pending', value: pendingTasksCount, color: '#f59e0b' },
    { label: 'In Progress', value: inProgressTasksCount, color: '#3b82f6' },
    { label: 'Completed', value: completedTasksCount, color: '#10b981' },
    { label: 'Dropped', value: droppedTasksCount, color: '#ef4444' }
  ];

  // 3. Attention items & SLA metrics
  const overdueTasksCount = tasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
  }).length;

  const openIncidentsCount = incidents.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

  const tasksWithDueDate = tasks.filter(t => t.due_date);
  const tasksOnTrackCount = tasksWithDueDate.filter(t => {
    if (t.status === 'COMPLETED') return true;
    return new Date(t.due_date) >= new Date();
  }).length;
  const tasksSlaPct = tasksWithDueDate.length > 0 ? Math.round((tasksOnTrackCount / tasksWithDueDate.length) * 100) : 100;

  const requestsOnTrackCount = approvals.filter(a => {
    if (a.status !== 'PENDING') return true;
    const hoursOld = (new Date() - new Date(a.created_at)) / (3600 * 1000);
    return hoursOld <= 48;
  }).length;
  const requestsOverdueCount = approvals.filter(a => {
    if (a.status !== 'PENDING') return false;
    const hoursOld = (new Date() - new Date(a.created_at)) / (3600 * 1000);
    return hoursOld > 48;
  }).length;
  const requestsSlaPct = approvals.length > 0 ? Math.round((requestsOnTrackCount / approvals.length) * 100) : 100;
  const overallCompliancePct = Math.round((tasksSlaPct + requestsSlaPct) / 2);

  // 4. Employee Workload (Top 5)
  const employeeWorkload = useMemo(() => {
    const map = new Map();
    users.forEach(u => {
      map.set(u.id, {
        id: u.id,
        name: u.full_name,
        department: u.department_name || (departments.find(d => d.id === u.department_id)?.name) || 'Operations',
        pending: 0,
        in_progress: 0,
        completed: 0,
        total: 0
      });
    });

    tasks.forEach(t => {
      if (t.assignee_id && map.has(t.assignee_id)) {
        const item = map.get(t.assignee_id);
        item.total += 1;
        if (t.status === 'PENDING') item.pending += 1;
        else if (t.status === 'IN_PROGRESS') item.in_progress += 1;
        else if (t.status === 'COMPLETED') item.completed += 1;
      } else if (t.assignee_id) {
        const name = t.assignee_name || `User #${t.assignee_id}`;
        map.set(t.assignee_id, {
          id: t.assignee_id,
          name,
          department: 'Operations',
          pending: t.status === 'PENDING' ? 1 : 0,
          in_progress: t.status === 'IN_PROGRESS' ? 1 : 0,
          completed: t.status === 'COMPLETED' ? 1 : 0,
          total: 1
        });
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    return list.slice(0, 5);
  }, [tasks, users, departments]);

  const maxEmployeeTasks = Math.max(1, ...employeeWorkload.map(e => e.total));

  // 5. Department Overview
  const departmentOverview = useMemo(() => {
    return departments.map(d => {
      const memberCount = d.employee_count || (d.employees ? d.employees.length : 0);
      const deptTasks = tasks.filter(t => t.department_id === d.id);
      const activeDeptTasks = deptTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
      return {
        id: d.id,
        name: d.name,
        members: memberCount,
        activeTasks: activeDeptTasks,
        totalTasks: deptTasks.length
      };
    }).sort((a, b) => (b.members + b.activeTasks) - (a.members + a.activeTasks)).slice(0, 5);
  }, [departments, tasks]);

  const maxDeptScore = Math.max(1, ...departmentOverview.map(d => d.members + d.activeTasks));

  // 6. Requests Overview
  const approvedRequestsCount = approvals.filter(a => a.status === 'APPROVED').length;
  const rejectedRequestsCount = approvals.filter(a => a.status === 'REJECTED').length;

  const requestChartData = [
    { label: 'Pending', value: pendingRequests, color: '#f59e0b' },
    { label: 'Approved', value: approvedRequestsCount, color: '#10b981' },
    { label: 'Rejected', value: rejectedRequestsCount, color: '#ef4444' }
  ];

  // 7. Incident Overview
  const openIncCount = incidents.filter(i => i.status === 'OPEN').length;
  const inProgIncCount = incidents.filter(i => i.status === 'IN_PROGRESS').length;
  const resolvedIncCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const closedIncCount = incidents.filter(i => i.status === 'CLOSED').length;

  const incidentChartData = [
    { label: 'Open', value: openIncCount, color: '#ef4444' },
    { label: 'In Progress', value: inProgIncCount, color: '#f59e0b' },
    { label: 'Resolved', value: resolvedIncCount, color: '#10b981' },
    { label: 'Closed', value: closedIncCount, color: '#64748b' }
  ];

  // 8. Assets & Documents
  const availableAssetsCount = assets.filter(a => a.status === 'AVAILABLE').length;
  const assignedAssetsCount = assets.filter(a => a.status === 'ASSIGNED').length;
  const maintenanceAssetsCount = assets.filter(a => a.status === 'MAINTENANCE').length;

  const totalDocBytes = documents.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalDocSizeMB = (totalDocBytes / (1024 * 1024)).toFixed(2);
  const recentDocsCount = documents.filter(d => (new Date() - new Date(d.created_at)) < 7 * 24 * 3600 * 1000).length;

  // 9. Recent Activity Timeline (includes tasks, requests, incidents, documents, escalations)
  const recentActivities = useMemo(() => {
    const list = [];

    tasks.forEach(t => {
      list.push({
        id: `t-${t.id}-${t.updated_at || t.created_at}`,
        type: 'TASK',
        title: t.title,
        sub: t.assignee_name ? `Assigned to ${t.assignee_name}` : (t.status === 'COMPLETED' ? 'Task marked as completed' : 'Created in workspace'),
        badge: t.status,
        timestamp: t.updated_at || t.created_at,
        to: '/tasks',
        Icon: ListTodo
      });
    });

    approvals.forEach(a => {
      list.push({
        id: `a-${a.id}`,
        type: 'REQUEST',
        title: a.subject,
        sub: a.status === 'PENDING'
          ? `Submitted by ${a.requester_name || 'Employee'}`
          : `Reviewed by ${a.reviewer_name || 'Management'}`,
        badge: a.status,
        timestamp: a.created_at,
        to: '/approvals',
        Icon: ClipboardCheck
      });
    });

    incidents.forEach(inc => {
      list.push({
        id: `inc-${inc.id}`,
        type: 'INCIDENT',
        title: inc.title,
        sub: `Reported by ${inc.reporter_name || 'Staff'} · ${inc.severity} priority`,
        badge: inc.status,
        timestamp: inc.created_at,
        to: '/incidents',
        Icon: FileWarning
      });
    });

    escalations.forEach(esc => {
      list.push({
        id: `esc-${esc.id}`,
        type: 'ESCALATION',
        title: esc.title,
        sub: `Level: ${esc.level} · ${esc.reason}`,
        badge: esc.status,
        timestamp: esc.created_at,
        to: '/escalations',
        Icon: ShieldAlert
      });
    });

    documents.forEach(doc => {
      list.push({
        id: `doc-${doc.id}`,
        type: 'DOCUMENT',
        title: doc.original_name,
        sub: `Uploaded by ${doc.owner_name || 'User'} (${(doc.size_bytes / 1024).toFixed(1)} KB)`,
        badge: 'AVAILABLE',
        timestamp: doc.created_at,
        to: '/documents',
        Icon: FolderOpen
      });
    });

    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return list.slice(0, 6);
  }, [tasks, approvals, incidents, escalations, documents]);

  return (
    <div className="page">
      <div className="ops-dashboard">
        {/* ================= 1. HEADER ================= */}
        <div className="ops-header">
          <div className="ops-header-left">
            <div className="ops-greeting">
              <h1>Good day, {firstName}</h1>
              <span className="ops-role-pill">{role === 'ADMIN' ? 'Org Administrator' : 'Operations Manager'}</span>
            </div>
            <p className="ops-subtitle">
              {role === 'ADMIN'
                ? "Here's what's happening across company operations today."
                : "Here's what's happening across your managed department operations."}
            </p>
          </div>

          <div className="ops-header-meta">
            <div className="ops-date-chip">
              <span className="ops-live-dot" />
              <span>{formatCurrentDate()}</span>
            </div>
            <button
              type="button"
              className="quiet ops-refresh-btn"
              onClick={handleManualRefresh}
              title="Refresh operational telemetry"
              aria-label="Refresh operational telemetry"
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {error && <Error text={error} />}

        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <Loading />
          </div>
        ) : (
          <>
            {/* ================= 2. KPI STRIP ================= */}
            <section className="ops-section">
              <div className="ops-kpi-grid">
                <div className="ops-kpi-card" onClick={() => navigate('/employees')} role="button" tabIndex={0}>
                  <div className="ops-kpi-top">
                    <span className="ops-kpi-title">Employees</span>
                    <div className="ops-kpi-icon-wrap"><Users size={16} /></div>
                  </div>
                  <div className="ops-kpi-val">{totalEmployees}</div>
                  <div className="ops-kpi-sub">
                    <span>{role === 'ADMIN' ? 'Active organization staff' : 'Department personnel'}</span>
                  </div>
                </div>

                <div className="ops-kpi-card" onClick={() => navigate('/departments')} role="button" tabIndex={0}>
                  <div className="ops-kpi-top">
                    <span className="ops-kpi-title">Departments</span>
                    <div className="ops-kpi-icon-wrap"><Building2 size={16} /></div>
                  </div>
                  <div className="ops-kpi-val">{totalDepartments}</div>
                  <div className="ops-kpi-sub">
                    <span>Operational business units</span>
                  </div>
                </div>

                <div className="ops-kpi-card" onClick={() => navigate('/tasks')} role="button" tabIndex={0}>
                  <div className="ops-kpi-top">
                    <span className="ops-kpi-title">Active Tasks</span>
                    <div className="ops-kpi-icon-wrap"><ListTodo size={16} /></div>
                  </div>
                  <div className="ops-kpi-val">{activeTasks}</div>
                  <div className="ops-kpi-sub">
                    <span>{pendingTasksCount} pending · {inProgressTasksCount} in progress</span>
                  </div>
                </div>

                <div className="ops-kpi-card" onClick={() => navigate('/approvals')} role="button" tabIndex={0}>
                  <div className="ops-kpi-top">
                    <span className="ops-kpi-title">Pending Requests</span>
                    <div className="ops-kpi-icon-wrap"><ClipboardCheck size={16} /></div>
                  </div>
                  <div className="ops-kpi-val" style={{ color: pendingRequests > 0 ? 'var(--warning)' : 'var(--text)' }}>
                    {pendingRequests}
                  </div>
                  <div className="ops-kpi-sub">
                    <span>{pendingRequests > 0 ? 'Awaiting management review' : 'All requests reviewed'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= 3. OPERATIONS OVERVIEW (60/40) ================= */}
            <section className="ops-section">
              <div className="ops-section-head">
                <h2><Activity size={15} />Operations Overview</h2>
              </div>

              <div className="ops-grid-60-40">
                {/* Left: Task Operations Donut */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><ListTodo size={16} />Task Operations</h3>
                      <p>Distribution of tasks by current workflow status</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/tasks')}>
                      View all <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <DonutChart
                    data={taskChartData}
                    total={tasks.length}
                    centerLabel="Total Tasks"
                    size={170}
                  />
                </div>

                {/* Right: Attention Required */}
                <div className="ops-card attention-card">
                  <div className="ops-card-head">
                    <div>
                      <h3 style={{ color: 'var(--text)' }}><AlertCircle size={16} color="var(--warning)" />Attention Required</h3>
                      <p>High-priority operational action items</p>
                    </div>
                  </div>

                  {pendingRequests === 0 && overdueTasksCount === 0 && openIncidentsCount === 0 && openEscalationsCount === 0 ? (
                    <div className="attention-empty-state">
                      <CheckCircle2 size={36} />
                      <strong>All systems up to date</strong>
                      <p>No bottlenecks or urgent items requiring action.</p>
                    </div>
                  ) : (
                    <div className="attention-list">
                      {openEscalationsCount > 0 && (
                        <div className="attention-item" onClick={() => navigate('/escalations')} role="button" tabIndex={0}>
                          <div className="attention-item-left">
                            <div className="attention-icon-badge danger"><ShieldAlert size={15} /></div>
                            <div>
                              <div className="attention-title">Active Escalations</div>
                              <div className="attention-desc">SLA breaches & operational triggers</div>
                            </div>
                          </div>
                          <span className="attention-count-badge danger">{openEscalationsCount} active</span>
                        </div>
                      )}

                      {pendingRequests > 0 && (
                        <div className="attention-item" onClick={() => navigate('/approvals')} role="button" tabIndex={0}>
                          <div className="attention-item-left">
                            <div className="attention-icon-badge warning"><ClipboardCheck size={15} /></div>
                            <div>
                              <div className="attention-title">Pending Requests</div>
                              <div className="attention-desc">Employee requests awaiting decision</div>
                            </div>
                          </div>
                          <span className="attention-count-badge warning">{pendingRequests} review</span>
                        </div>
                      )}

                      {overdueTasksCount > 0 && (
                        <div className="attention-item" onClick={() => navigate('/tasks')} role="button" tabIndex={0}>
                          <div className="attention-item-left">
                            <div className="attention-icon-badge danger"><Clock size={15} /></div>
                            <div>
                              <div className="attention-title">Overdue Tasks</div>
                              <div className="attention-desc">Past targeted completion schedule</div>
                            </div>
                          </div>
                          <span className="attention-count-badge danger">{overdueTasksCount} overdue</span>
                        </div>
                      )}

                      {openIncidentsCount > 0 && (
                        <div className="attention-item" onClick={() => navigate('/incidents')} role="button" tabIndex={0}>
                          <div className="attention-item-left">
                            <div className="attention-icon-badge danger"><FileWarning size={15} /></div>
                            <div>
                              <div className="attention-title">Open Incidents</div>
                              <div className="attention-desc">Active outages & operational issues</div>
                            </div>
                          </div>
                          <span className="attention-count-badge danger">{openIncidentsCount} open</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ================= 4. WORKLOAD & ORGANIZATION (50/50) ================= */}
            <section className="ops-section">
              <div className="ops-section-head">
                <h2><Layers size={15} />Workload & Organization</h2>
              </div>

              <div className="ops-grid-equal">
                {/* Left: Employee Workload */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><Users size={16} />Employee Workload</h3>
                      <p>Task distribution across active team members</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/employees')}>
                      Manage <ArrowUpRight size={13} />
                    </button>
                  </div>

                  {employeeWorkload.length === 0 ? (
                    <Empty text="No employee workload recorded yet." />
                  ) : (
                    <div className="workload-list">
                      {employeeWorkload.map(emp => {
                        const pendingPct = (emp.pending / maxEmployeeTasks) * 100;
                        const inProgPct = (emp.in_progress / maxEmployeeTasks) * 100;
                        const compPct = (emp.completed / maxEmployeeTasks) * 100;

                        return (
                          <div key={emp.id} className="workload-item">
                            <div className="workload-item-meta">
                              <div>
                                <span className="workload-name">{emp.name}</span>
                                <span className="workload-sub">· {emp.department}</span>
                              </div>
                              <span className="workload-counts">
                                {emp.total} tasks ({emp.in_progress} active)
                              </span>
                            </div>

                            <div className="workload-bar-track" title={`${emp.name}: ${emp.pending} Pending, ${emp.in_progress} In Progress, ${emp.completed} Completed`}>
                              <div className="workload-bar-seg completed" style={{ width: `${compPct}%` }} />
                              <div className="workload-bar-seg in-progress" style={{ width: `${inProgPct}%` }} />
                              <div className="workload-bar-seg pending" style={{ width: `${pendingPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Department Overview */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><Building2 size={16} />Department Overview</h3>
                      <p>Staff capacity and operational task engagement</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/departments')}>
                      Manage <ArrowUpRight size={13} />
                    </button>
                  </div>

                  {departmentOverview.length === 0 ? (
                    <Empty text="No departments configured." />
                  ) : (
                    <div className="workload-list">
                      {departmentOverview.map(dept => {
                        const totalScore = dept.members + dept.activeTasks;
                        const pct = Math.round((totalScore / maxDeptScore) * 100);

                        return (
                          <div key={dept.id} className="workload-item">
                            <div className="workload-item-meta">
                              <div>
                                <span className="workload-name">{dept.name}</span>
                                <span className="workload-sub">· {dept.members} staff</span>
                              </div>
                              <span className="workload-counts">
                                {dept.activeTasks} active / {dept.totalTasks} total tasks
                              </span>
                            </div>

                            <div className="workload-bar-track">
                              <div className="workload-bar-seg in-progress" style={{ width: `${Math.max(8, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ================= 5. OPERATIONS STATUS (50/50) ================= */}
            <section className="ops-section">
              <div className="ops-section-head">
                <h2><ShieldCheck size={15} />Operations Status</h2>
              </div>

              <div className="ops-grid-equal">
                {/* Left: Requests Donut */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><ClipboardCheck size={16} />Requests & Approvals</h3>
                      <p>Query submissions & decision resolutions</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/approvals')}>
                      Review <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <DonutChart
                    data={requestChartData}
                    total={approvals.length}
                    centerLabel="Total Requests"
                    size={150}
                  />
                </div>

                {/* Right: Incidents Donut */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><FileWarning size={16} />Incident Overview</h3>
                      <p>System stability & incident lifecycle resolution</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/incidents')}>
                      Manage <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <DonutChart
                    data={incidentChartData}
                    total={incidents.length}
                    centerLabel="Total Incidents"
                    size={150}
                  />
                </div>
              </div>
            </section>

            {/* ================= 6. RESOURCE OVERVIEW ================= */}
            <section className="ops-section">
              <div className="ops-section-head">
                <h2><HardDrive size={15} />Resource Overview</h2>
              </div>

              <div className="ops-grid-equal">
                {/* Left: Assets */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><Box size={16} />Asset Inventory</h3>
                      <p>Equipment, hardware & device allocation</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/assets')}>
                      Inventory <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <div className="resource-summary-box">
                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Total Assets</span>
                      <b className="resource-stat-num">{assets.length}</b>
                      <span className="resource-stat-desc">Tracked hardware units</span>
                    </div>

                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Assigned</span>
                      <b className="resource-stat-num" style={{ color: 'var(--primary)' }}>{assignedAssetsCount}</b>
                      <span className="resource-stat-desc">In active employee use</span>
                    </div>

                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Available</span>
                      <b className="resource-stat-num" style={{ color: 'var(--success)' }}>{availableAssetsCount}</b>
                      <span className="resource-stat-desc">Ready for deployment</span>
                    </div>

                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Maintenance</span>
                      <b className="resource-stat-num" style={{ color: maintenanceAssetsCount > 0 ? 'var(--warning)' : 'var(--text)' }}>
                        {maintenanceAssetsCount}
                      </b>
                      <span className="resource-stat-desc">Under repair or audit</span>
                    </div>
                  </div>
                </div>

                {/* Right: Documents */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><FolderOpen size={16} />Document Repository</h3>
                      <p>Compliance files, contracts & attachments</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/documents')}>
                      Repository <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <div className="resource-summary-box">
                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Total Files</span>
                      <b className="resource-stat-num">{documents.length}</b>
                      <span className="resource-stat-desc">Permitted documents</span>
                    </div>

                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Storage Volume</span>
                      <b className="resource-stat-num" style={{ color: 'var(--primary)' }}>{totalDocSizeMB} MB</b>
                      <span className="resource-stat-desc">Encrypted file storage</span>
                    </div>

                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Recent Uploads</span>
                      <b className="resource-stat-num" style={{ color: 'var(--success)' }}>{recentDocsCount}</b>
                      <span className="resource-stat-desc">Added in last 7 days</span>
                    </div>

                    <div className="resource-mini-stat">
                      <span className="resource-stat-label">Document Types</span>
                      <b className="resource-stat-num">
                        {new Set(documents.map(d => d.content_type?.split('/')[1] || 'other')).size}
                      </b>
                      <span className="resource-stat-desc">Formats supported</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= 7. SLA HEALTH & AUTOMATIONS (50/50) ================= */}
            <section className="ops-section">
              <div className="ops-section-head">
                <h2><Zap size={15} />SLA Health & Automation Intelligence</h2>
              </div>

              <div className="ops-grid-equal">
                {/* Left: SLA Compliance */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><ShieldCheck size={16} />SLA & Compliance Health</h3>
                      <p>Adherence to operational resolution targets</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/escalations')}>
                      Escalations ({openEscalationsCount}) <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <div className="workload-list">
                    <div className="workload-item">
                      <div className="workload-item-meta">
                        <div>
                          <span className="workload-name">Overall SLA Compliance</span>
                          <span className="workload-sub">· Combined operational targets</span>
                        </div>
                        <span className="workload-counts" style={{ fontWeight: 600, color: overallCompliancePct >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                          {overallCompliancePct}%
                        </span>
                      </div>
                      <div className="workload-bar-track">
                        <div
                          className="workload-bar-seg completed"
                          style={{
                            width: `${overallCompliancePct}%`,
                            background: overallCompliancePct >= 80 ? 'var(--success)' : 'var(--warning)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="workload-item">
                      <div className="workload-item-meta">
                        <div>
                          <span className="workload-name">Task Schedules On Track</span>
                          <span className="workload-sub">· {tasksOnTrackCount} of {tasksWithDueDate.length || 0} scheduled</span>
                        </div>
                        <span className="workload-counts">{tasksSlaPct}%</span>
                      </div>
                      <div className="workload-bar-track">
                        <div className="workload-bar-seg completed" style={{ width: `${tasksSlaPct}%` }} />
                      </div>
                    </div>

                    <div className="workload-item">
                      <div className="workload-item-meta">
                        <div>
                          <span className="workload-name">Requests Reviewed Within SLA</span>
                          <span className="workload-sub">· &lt; 48h turnaround</span>
                        </div>
                        <span className="workload-counts">{requestsSlaPct}%</span>
                      </div>
                      <div className="workload-bar-track">
                        <div className="workload-bar-seg in-progress" style={{ width: `${requestsSlaPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Automation Engine & Schedules */}
                <div className="ops-card">
                  <div className="ops-card-head">
                    <div>
                      <h3><Zap size={16} />Active Automations & Reports</h3>
                      <p>Trigger-action workflows & automated schedules</p>
                    </div>
                    <button type="button" className="ops-section-link" onClick={() => navigate('/automations')}>
                      Rules ({automations.filter(a => a.is_active).length}) <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <div className="resource-summary-box">
                    <div className="resource-mini-stat" onClick={() => navigate('/automations')} style={{ cursor: 'pointer' }}>
                      <span className="resource-stat-label">Active Rules</span>
                      <b className="resource-stat-num" style={{ color: 'var(--primary)' }}>
                        {automations.filter(a => a.is_active).length}
                      </b>
                      <span className="resource-stat-desc">Of {automations.length} configured</span>
                    </div>

                    <div className="resource-mini-stat" onClick={() => navigate('/escalations')} style={{ cursor: 'pointer' }}>
                      <span className="resource-stat-label">Open Escalations</span>
                      <b className="resource-stat-num" style={{ color: openEscalationsCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {openEscalationsCount}
                      </b>
                      <span className="resource-stat-desc">Requiring intervention</span>
                    </div>

                    <div className="resource-mini-stat" onClick={() => navigate('/reports')} style={{ cursor: 'pointer' }}>
                      <span className="resource-stat-label">Scheduled Reports</span>
                      <b className="resource-stat-num" style={{ color: 'var(--success)' }}>
                        {reportSchedules.filter(s => s.is_active).length}
                      </b>
                      <span className="resource-stat-desc">Active recurring jobs</span>
                    </div>

                    <div className="resource-mini-stat" onClick={() => navigate('/reports')} style={{ cursor: 'pointer' }}>
                      <span className="resource-stat-label">Report Templates</span>
                      <b className="resource-stat-num">7</b>
                      <span className="resource-stat-desc">Standard analytical reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= 8. RECENT ACTIVITY ================= */}
            <section className="ops-section">
              <div className="ops-section-head">
                <h2><Activity size={15} />Recent Activity Stream</h2>
              </div>

              <div className="ops-card" style={{ padding: '8px 12px' }}>
                {recentActivities.length === 0 ? (
                  <Empty text="No recent operational events recorded." />
                ) : (
                  <div className="activity-feed">
                    {recentActivities.map(item => {
                      const ItemIcon = item.Icon;
                      return (
                        <div
                          key={item.id}
                          className="activity-feed-row"
                          onClick={() => navigate(item.to)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="activity-left">
                            <div className="activity-type-icon">
                              <ItemIcon size={15} />
                            </div>
                            <div className="activity-text-box">
                              <div className="activity-title">{item.title}</div>
                              <div className="activity-sub">{item.sub}</div>
                            </div>
                          </div>

                          <div className="activity-right">
                            <Badge value={item.badge} />
                            <span className="activity-time">{timeAgo(item.timestamp)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ----------------- EMPLOYEE DASHBOARD (GAMIFICATION PRESERVED) -----------------

function EmployeeDashboard({ profile }) {
  const cards = [
    ['Active tasks', profile.active_tasks, ListTodo],
    ['Completed', profile.completed_tasks, ClipboardCheck],
    ['XP', profile.profile.xp, Plus],
    ['Level', profile.level, UserCircle]
  ];

  return (
    <Page title={`Good day, ${profile.profile.full_name.split(' ')[0]}`} text="Your personal operational snapshot.">
      <div className="stats">
        {cards.map(([n, v, I]) => (
          <article className="card stat" key={n}>
            <I size={20} /><span>{n}</span><b>{v}</b>
          </article>
        ))}
      </div>
      <section className="card">
        <h2>XP Level Progress</h2>
        <p className="muted" style={{ marginTop: 4 }}>Level {profile.level} · {profile.profile.xp.toLocaleString()} Total XP</p>
        <div className="progress"><i style={{ width: `${profile.xp_progress}%` }} /></div>
      </section>
    </Page>
  );
}

// ----------------- DASHBOARD ROUTER -----------------

function Dashboard({ profile }) {
  const role = profile?.profile?.role || profile?.role;
  if (role === 'EMPLOYEE') {
    return <EmployeeDashboard profile={profile} />;
  }
  return <OperationsDashboard profile={profile} />;
}

function Page({ title, text, action, children }) {
  return (
    <div className="page">
      <div className="title">
        <div><h1>{title}</h1><p>{text}</p></div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ----------------- TASKS -----------------

function Tasks({ user }) {
  const [revision, setRevision] = useState(0);
  const tasksLoad = useLoad(() => taskService.list(), `tasks-${revision}`);
  const usersLoad = useLoad(() => (user.role !== 'EMPLOYEE' ? userService.list() : Promise.resolve({ items: [] })), 'task-users');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ priority: 'MEDIUM', difficulty: 'MEDIUM' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const toast = useToast();

  const isEmployee = user.role === 'EMPLOYEE';
  const allTasks = tasksLoad.data?.items || [];
  const assignedTasks = allTasks.filter(t => t.creator_id !== user.id);
  const personalTasks = allTasks.filter(t => t.creator_id === user.id);
  const allUsers = usersLoad.data?.items || [];

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const payload = isEmployee
        ? { title: form.title, description: form.description || null }
        : {
            title: form.title,
            description: form.description || null,
            assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
            priority: form.priority || 'MEDIUM',
            difficulty: form.difficulty || 'MEDIUM',
            due_date: form.due_date ? new Date(form.due_date).toISOString() : null
          };
      await taskService.create(payload);
      setShowCreate(false);
      setForm({ priority: 'MEDIUM', difficulty: 'MEDIUM' });
      setRevision(v => v + 1);
      toast.success('Task created successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await taskService.update(id, { status });
      setRevision(v => v + 1);
      toast.success(`Task status changed to ${status}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update task');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await taskService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  }

  const renderStatusSelect = (task) => (
    <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
      <option value="PENDING">Pending</option>
      <option value="IN_PROGRESS">Work In Progress</option>
      <option value="COMPLETED">Completed</option>
      <option value="CANCELLED">Dropped</option>
    </select>
  );

  return (
    <Page
      title="Tasks"
      text={isEmployee ? "View your assigned work and manage your personal tasks." : "Manage and assign operational tasks."}
      action={
        <button onClick={() => setShowCreate(true)}>
          <Plus size={17} />{isEmployee ? "Create Personal Task" : "Create Task"}
        </button>
      }
    >
      {tasksLoad.loading ? (
        <SkeletonTable rows={5} />
      ) : tasksLoad.error ? (
        <Error text={tasksLoad.error} />
      ) : isEmployee ? (
        <>
          <div className="section-head">
            <h2>Assigned Tasks</h2>
          </div>
          <div className="card table-wrap">
            {assignedTasks.length === 0 ? (
              <div className="empty">
                <p>No assigned tasks from management yet.</p>
                <button onClick={() => setShowCreate(true)} style={{ marginTop: 10 }}>
                  <Plus size={16} />Create Personal Task
                </button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Assigned By</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedTasks.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.title}</strong></td>
                      <td>{renderStatusSelect(t)}</td>
                      <td>{t.description || '—'}</td>
                      <td>{t.creator_name || 'Management'}</td>
                      <td><Badge value={t.priority} /></td>
                      <td className="actions">
                        <button type="button" className="quiet" onClick={() => setSelectedTask(t)} title="Discussion & activity">
                          <MessageSquare size={14} />Activity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="section-head">
            <h2>Personal Tasks</h2>
          </div>
          <div className="card table-wrap">
            {personalTasks.length === 0 ? (
              <Empty text="No personal tasks created yet." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {personalTasks.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.title}</strong></td>
                      <td>{renderStatusSelect(t)}</td>
                      <td>{t.description || '—'}</td>
                      <td className="actions">
                        <button type="button" className="quiet" onClick={() => setSelectedTask(t)} title="Discussion & activity">
                          <MessageSquare size={14} />Activity
                        </button>
                        <button className="danger" onClick={() => setConfirmDelete(t.id)}>
                          <Trash2 size={15} />Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="card table-wrap">
          {allTasks.length === 0 ? (
            <Empty text="No tasks found." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allTasks.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.title}</strong></td>
                    <td>{t.assignee_name || (t.assignee_id ? `User #${t.assignee_id}` : 'Unassigned')}</td>
                    <td>{renderStatusSelect(t)}</td>
                    <td><Badge value={t.priority} /></td>
                    <td>{t.description || '—'}</td>
                    <td className="actions">
                      <button type="button" className="quiet" onClick={() => setSelectedTask(t)} title="Discussion & activity">
                        <MessageSquare size={14} />Activity
                      </button>
                      <button className="danger" onClick={() => setConfirmDelete(t.id)}>
                        <Trash2 size={15} />Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ActivityDrawer
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        targetType="TASK"
        targetItem={selectedTask}
        user={user}
        onUpdate={() => setRevision(v => v + 1)}
      />

      {showCreate && (
        <Modal title={isEmployee ? "Create Personal Task" : "Create Task"} close={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Title
              <input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
            </label>
            <label>
              Description
              <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task description..." />
            </label>

            {!isEmployee && (
              <>
                <label>
                  Assign to Employee
                  <select value={form.assignee_id || ''} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                    <option value="">Unassigned</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select value={form.priority || 'MEDIUM'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
                <label>
                  Difficulty
                  <select value={form.difficulty || 'MEDIUM'} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="EASY">Easy (50 XP)</option>
                    <option value="MEDIUM">Medium (100 XP)</option>
                    <option value="HARD">Hard (200 XP)</option>
                  </select>
                </label>
                <label>
                  Due Date
                  <input type="datetime-local" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </label>
              </>
            )}

            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit">
                <Plus size={15} />
                {isEmployee ? "Create Personal Task" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- APPROVALS / REQUESTS -----------------

function Approvals({ user }) {
  const [revision, setRevision] = useState(0);
  const load = useLoad(() => approvalService.list(), `approvals-${revision}`);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const [decideModal, setDecideModal] = useState(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const toast = useToast();

  const items = load.data || [];
  const isEmployee = user.role === 'EMPLOYEE';

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await approvalService.create(form);
      setShowCreate(false);
      setForm({});
      setRevision(v => v + 1);
      toast.success('Request submitted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  }

  async function handleDecision() {
    if (!decideModal) return;
    setActionLoading(true);
    try {
      await approvalService.decide(decideModal.id, {
        approved: decideModal.approved,
        comment: decisionComment || null
      });
      const actionText = decideModal.approved ? 'accepted' : 'rejected';
      setDecideModal(null);
      setDecisionComment('');
      setRevision(v => v + 1);
      toast.success(`Request #${decideModal.id} ${actionText}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await approvalService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
      toast.success('Request deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete request');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Page
      title="Requests & Approvals"
      text={isEmployee ? "Submit queries or requests to management and track status." : "Review, accept, or reject operational requests."}
      action={
        <button onClick={() => setShowCreate(true)}>
          <Plus size={17} />New Request
        </button>
      }
    >
      <div className="card table-wrap">
        {load.loading ? (
          <SkeletonTable rows={5} />
        ) : load.error ? (
          <Error text={load.error} />
        ) : items.length === 0 ? (
          <Empty text="No requests submitted yet." />
        ) : (
          <table>
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Subject</th>
                <th>Details</th>
                <th>Status</th>
                <th>Date</th>
                <th>Decision / Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(v => (
                <tr key={v.id}>
                  {!isEmployee && (
                    <td>
                      <strong>{v.requester_name || `User #${v.requester_id}`}</strong>
                      {v.requester_email && <div className="muted" style={{ fontSize: 12 }}>{v.requester_email}</div>}
                    </td>
                  )}
                  <td><strong>{v.subject}</strong></td>
                  <td>{v.details}</td>
                  <td><Badge value={v.status} /></td>
                  <td><small>{new Date(v.created_at).toLocaleDateString()}</small></td>
                  <td>
                    {v.comment ? (
                      <span>{v.comment} {v.reviewer_name && <small className="muted">({v.reviewer_name})</small>}</span>
                    ) : v.status !== 'PENDING' ? (
                      <span className="muted">{v.reviewer_name ? `Decided by ${v.reviewer_name}` : 'Decided'}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="actions">
                    <button type="button" className="quiet" onClick={() => setSelectedRequest(v)} title="Discussion & activity">
                      <MessageSquare size={14} />Activity
                    </button>
                    {!isEmployee && v.status === 'PENDING' && (
                      <>
                        <button onClick={() => setDecideModal({ id: v.id, approved: true })} style={{ background: '#16814a' }}>
                          <Check size={15} />Accept
                        </button>
                        <button className="danger" onClick={() => setDecideModal({ id: v.id, approved: false })}>
                          <X size={15} />Reject
                        </button>
                      </>
                    )}
                    {(user.role === 'ADMIN' || (isEmployee && v.status === 'PENDING')) && (
                      <button className="danger" onClick={() => setConfirmDelete(v.id)}>
                        <Trash2 size={15} />Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ActivityDrawer
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        targetType="REQUEST"
        targetItem={selectedRequest}
        user={user}
        onUpdate={() => setRevision(v => v + 1)}
      />

      {showCreate && (
        <Modal title="Submit Request / Query" close={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Subject / Request Title
              <input required value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Equipment Request" />
            </label>
            <label>
              Details / Description
              <textarea required value={form.details || ''} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Explain what you need or what you are reporting..." rows={3} />
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit">
                <Plus size={15} />
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {decideModal && (
        <Modal title={decideModal.approved ? "Accept Request" : "Reject Request"} close={() => setDecideModal(null)}>
          <p>Provide an optional comment or note for this decision:</p>
          <label>
            Comment / Reason
            <textarea
              value={decisionComment}
              onChange={e => setDecisionComment(e.target.value)}
              placeholder={decideModal.approved ? "Approval notes..." : "Reason for rejection..."}
            />
          </label>
          <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 15 }}>
            <button type="button" className="quiet" onClick={() => setDecideModal(null)} disabled={actionLoading}>Cancel</button>
            <button
              type="button"
              style={{ background: decideModal.approved ? '#16814a' : 'var(--danger)' }}
              onClick={handleDecision}
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : (decideModal.approved ? 'Confirm Accept' : 'Confirm Reject')}
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Request"
          message="Are you sure you want to delete this request?"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- EMPLOYEES -----------------

function Employees({ user }) {
  const [revision, setRevision] = useState(0);
  const users = useLoad(() => userService.list(), `users-${revision}`);
  const departments = useLoad(() => departmentService.list(), 'employee-departments');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ role: 'EMPLOYEE' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const values = users.data?.items || [];
  const deptList = departments.data || [];

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await userService.create({
        ...form,
        department_id: form.department_id ? Number(form.department_id) : null
      });
      setShowCreate(false);
      setForm({ role: 'EMPLOYEE' });
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAssignDept(userId, departmentId) {
    try {
      await userService.update(userId, {
        department_id: departmentId ? Number(departmentId) : null
      });
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await userService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Page
      title="Employees"
      text="Manage personnel accounts and departmental assignments."
      action={
        user.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)}>
            <Plus size={17} />Create User
          </button>
        )
      }
    >
      <div className="card table-wrap">
        {users.loading ? (
          <Loading />
        ) : users.error ? (
          <Error text={users.error} />
        ) : values.length === 0 ? (
          <Empty text="No employees found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Department</th>
                {user.role === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {values.map(val => (
                <tr key={val.id}>
                  <td><strong>{val.full_name}</strong></td>
                  <td><Badge value={val.role} /></td>
                  <td>{val.email}</td>
                  <td>
                    <select
                      value={val.department_id || ''}
                      onChange={e => handleAssignDept(val.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {deptList.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  {user.role === 'ADMIN' && (
                    <td className="actions">
                      {val.id !== user.id && (
                        <button className="danger" onClick={() => setConfirmDelete(val.id)}>
                          <Trash2 size={15} />Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <Modal title="Create User" close={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Full name
              <input required value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Jane Doe" />
            </label>
            <label>
              Email
              <input type="email" required value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
            </label>
            <label>
              Password (min 8 chars)
              <input type="password" required minLength={8} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Role
                <select value={form.role || 'EMPLOYEE'} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label>
                Department
                <select value={form.department_id || ''} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {deptList.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit">
                <Plus size={15} />
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete User"
          message="Are you sure you want to delete this user? Their assigned tasks and assets will be unlinked."
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- DEPARTMENTS -----------------

function Departments({ user }) {
  const [revision, setRevision] = useState(0);
  const load = useLoad(() => departmentService.list(), `departments-${revision}`);
  const usersLoad = useLoad(() => userService.list(), `dept-users-${revision}`);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({});
  const [assignModal, setAssignModal] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const depts = load.data || [];
  const allUsers = usersLoad.data?.items || [];

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await departmentService.create(createForm);
      setShowCreate(false);
      setCreateForm({});
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAssignEmployee(e) {
    e.preventDefault();
    if (!assignModal || !selectedUserId) return;
    setActionLoading(true);
    try {
      await departmentService.assignEmployee(assignModal.id, Number(selectedUserId));
      setAssignModal(null);
      setSelectedUserId('');
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveEmployee(deptId, empId) {
    if (!confirm("Remove this employee from the department?")) return;
    try {
      await departmentService.removeEmployee(deptId, empId);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await departmentService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Page
      title="Departments"
      text="Manage organizational units and staff assignments."
      action={
        user.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)}>
            <Plus size={17} />Create Department
          </button>
        )
      }
    >
      <div className="card table-wrap">
        {load.loading ? (
          <Loading />
        ) : load.error ? (
          <Error text={load.error} />
        ) : depts.length === 0 ? (
          <Empty text="No departments created." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Description</th>
                <th>Assigned Employees</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.description || '—'}</td>
                  <td>
                    {d.employees && d.employees.length > 0 ? (
                      <div>
                        {d.employees.map(emp => (
                          <span key={emp.id} className="chip">
                            {emp.full_name}
                            {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                              <button
                                type="button"
                                title="Unassign"
                                onClick={() => handleRemoveEmployee(d.id, emp.id)}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">No employees assigned</span>
                    )}
                  </td>
                  <td><Badge value={`${d.employee_count || d.employees?.length || 0} members`} /></td>
                  <td className="actions">
                    {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                      <button onClick={() => { setAssignModal(d); setSelectedUserId(''); }}>
                        <Plus size={15} />Assign
                      </button>
                    )}
                    {user.role === 'ADMIN' && (
                      <button className="danger" onClick={() => setConfirmDelete(d.id)}>
                        <Trash2 size={15} />Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <Modal title="Create Department" close={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Department Name
              <input required value={createForm.name || ''} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g., Engineering" />
            </label>
            <label>
              Description
              <textarea value={createForm.description || ''} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Department goals and scope..." rows={3} />
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit">
                <Plus size={15} />
                Create Department
              </button>
            </div>
          </form>
        </Modal>
      )}

      {assignModal && (
        <Modal title={`Assign Employee to ${assignModal.name}`} close={() => setAssignModal(null)}>
          <form onSubmit={handleAssignEmployee}>
            <label>
              Select Employee
              <select required value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value="">Select an employee...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) {u.department_id === assignModal.id ? '— Already assigned' : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 15 }}>
              <button type="button" className="quiet" onClick={() => setAssignModal(null)} disabled={actionLoading}>Cancel</button>
              <button type="submit" disabled={actionLoading || !selectedUserId}>
                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Department"
          message="Are you sure you want to delete this department? Make sure all members have been reassigned first."
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- INCIDENTS -----------------

function Incidents({ user }) {
  const [revision, setRevision] = useState(0);
  const load = useLoad(() => incidentService.list(), `incidents-${revision}`);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ severity: 'MEDIUM' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const toast = useToast();

  const items = load.data?.items || [];

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await incidentService.create(form);
      setShowCreate(false);
      setForm({ severity: 'MEDIUM' });
      setRevision(v => v + 1);
      toast.success('Incident reported successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to report incident');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await incidentService.update(id, { status });
      setRevision(v => v + 1);
      toast.success(`Incident status updated to ${status}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update incident');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await incidentService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
      toast.success('Incident deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete incident');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Page
      title="Incidents"
      text="Track operational issues, system outages, and resolutions."
      action={
        <button onClick={() => setShowCreate(true)}>
          <Plus size={17} />Report Incident
        </button>
      }
    >
      <div className="card table-wrap">
        {load.loading ? (
          <SkeletonTable rows={5} />
        ) : load.error ? (
          <Error text={load.error} />
        ) : items.length === 0 ? (
          <Empty text="No incidents reported." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Reporter</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(inc => (
                <tr key={inc.id}>
                  <td><strong>{inc.title}</strong></td>
                  <td>
                    <select value={inc.status} onChange={e => handleStatusChange(inc.id, e.target.value)}>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </td>
                  <td><Badge value={inc.severity} /></td>
                  <td>{inc.reporter_name || `User #${inc.reporter_id}`}</td>
                  <td>{inc.description}</td>
                  <td className="actions">
                    <button type="button" className="quiet" onClick={() => setSelectedIncident(inc)} title="Discussion & activity">
                      <MessageSquare size={14} />Activity
                    </button>
                    <button className="danger" onClick={() => setConfirmDelete(inc.id)}>
                      <Trash2 size={15} />Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ActivityDrawer
        open={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        targetType="INCIDENT"
        targetItem={selectedIncident}
        user={user}
        onUpdate={() => setRevision(v => v + 1)}
      />

      {showCreate && (
        <Modal title="Report Incident" close={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Title
              <input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., VPN outage" />
            </label>
            <label>
              Severity
              <select value={form.severity || 'MEDIUM'} onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <label>
              Description
              <textarea required value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident..." rows={3} />
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit">
                <Plus size={15} />
                Report Incident
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Incident"
          message="Delete this incident record?"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- ASSETS -----------------

function Assets({ user }) {
  const [revision, setRevision] = useState(0);
  const load = useLoad(() => assetService.list(), `assets-${revision}`);
  const usersLoad = useLoad(() => (user.role !== 'EMPLOYEE' ? userService.list() : Promise.resolve({ items: [] })), 'asset-users');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ status: 'AVAILABLE' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const items = load.data?.items || [];
  const allUsers = usersLoad.data?.items || [];
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await assetService.create({
        ...form,
        assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null
      });
      setShowCreate(false);
      setForm({ status: 'AVAILABLE' });
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await assetService.update(id, { status });
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await assetService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Page
      title="Assets"
      text="Inventory of equipment and organizational devices."
      action={
        canManage && (
          <button onClick={() => setShowCreate(true)}>
            <Plus size={17} />Add Asset
          </button>
        )
      }
    >
      <div className="card table-wrap">
        {load.loading ? (
          <Loading />
        ) : load.error ? (
          <Error text={load.error} />
        ) : items.length === 0 ? (
          <Empty text="No assets found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Asset Tag</th>
                <th>Status</th>
                <th>Assigned To</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><code>{a.asset_tag}</code></td>
                  <td>
                    {canManage ? (
                      <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)}>
                        <option value="AVAILABLE">Available</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    ) : (
                      <Badge value={a.status} />
                    )}
                  </td>
                  <td>{a.assigned_to_name || (a.assigned_to_id ? `User #${a.assigned_to_id}` : 'Unassigned')}</td>
                  {canManage && (
                    <td className="actions">
                      <button className="danger" onClick={() => setConfirmDelete(a.id)}>
                        <Trash2 size={15} />Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <Modal title="Add Asset" close={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <label>
              Asset Name
              <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., MacBook Pro 16" />
            </label>
            <label>
              Asset Tag (Unique)
              <input required value={form.asset_tag || ''} onChange={e => setForm({ ...form, asset_tag: e.target.value })} placeholder="e.g., OPS-2026-001" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Status
                <select value={form.status || 'AVAILABLE'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </label>
              <label>
                Assigned User
                <select value={form.assigned_to_id || ''} onChange={e => setForm({ ...form, assigned_to_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit">
                <Plus size={15} />
                Add Asset
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Asset"
          message="Delete this asset record?"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- DOCUMENTS -----------------

function Documents({ user }) {
  const [revision, setRevision] = useState(0);
  const load = useLoad(() => documentService.list(), `documents-${revision}`);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const items = load.data || [];

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      await documentService.upload(file);
      setFile(null);
      e.target.reset();
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    try {
      await documentService.download(doc.id, doc.original_name);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await documentService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Page title="Documents" text="Upload, download, and manage permitted documents.">
      <form className="card upload" onSubmit={handleUpload} style={{ marginBottom: 20 }}>
        <label>
          Upload Document (PDF, text, PNG, JPEG, DOCX up to 10 MB)
          <input
            type="file"
            required
            onChange={e => setFile(e.target.files[0])}
            accept=".pdf,.txt,.png,.jpg,.jpeg,.docx"
          />
        </label>
        <button type="submit" disabled={uploading || !file}>
          {uploading ? (
            <>
              <span className="btn-spinner" />
              Uploading...
            </>
          ) : 'Upload'}
        </button>
      </form>

      <div className="card table-wrap">
        {load.loading ? (
          <Loading />
        ) : load.error ? (
          <Error text={load.error} />
        ) : items.length === 0 ? (
          <Empty text="No documents uploaded." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Size</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.original_name}</strong></td>
                  <td><code>{d.content_type}</code></td>
                  <td>{(d.size_bytes / 1024).toFixed(1)} KB</td>
                  <td>{d.owner_name || `User #${d.owner_id}`}</td>
                  <td className="actions">
                    <button type="button" onClick={() => handleDownload(d)}>
                      <Download size={15} />Download
                    </button>
                    {(user.role === 'ADMIN' || d.owner_id === user.id) && (
                      <button type="button" className="danger" onClick={() => setConfirmDelete(d.id)}>
                        <Trash2 size={15} />Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Document"
          message="Delete this document permanently?"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- AUTOMATION ENGINE -----------------

function Automations({ user }) {
  const [activeTab, setActiveTab] = useState('rules');
  const [revision, setRevision] = useState(0);
  const rulesState = useLoad(() => automationService.list(), `automations-${revision}`);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRuleLogs, setSelectedRuleLogs] = useState(null);
  const logsState = useLoad(() => selectedRuleLogs ? automationService.executions(selectedRuleLogs) : Promise.resolve([]), `rule-logs-${selectedRuleLogs}`);

  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_type: 'TASK_CREATED',
    conditions: [{ field: 'priority', operator: 'equals', value: 'HIGH' }],
    actions: [{ type: 'NOTIFY_MANAGER', message: 'High priority task created' }],
    enabled: true
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const rules = rulesState.data || [];

  const handleToggle = async (ruleId) => {
    try {
      await automationService.toggle(ruleId);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await automationService.remove(confirmDelete);
      setConfirmDelete(null);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await automationService.create(form);
      setShowCreate(false);
      setRevision(v => v + 1);
      setForm({
        name: '',
        description: '',
        trigger_type: 'TASK_CREATED',
        conditions: [{ field: 'priority', operator: 'equals', value: 'HIGH' }],
        actions: [{ type: 'NOTIFY_MANAGER', message: 'High priority task created' }],
        enabled: true
      });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const addCondition = () => {
    setForm({
      ...form,
      conditions: [...form.conditions, { field: 'status', operator: 'equals', value: 'PENDING' }]
    });
  };

  const removeCondition = (idx) => {
    setForm({
      ...form,
      conditions: form.conditions.filter((_, i) => i !== idx)
    });
  };

  const updateCondition = (idx, key, val) => {
    const updated = [...form.conditions];
    updated[idx][key] = val;
    setForm({ ...form, conditions: updated });
  };

  const addAction = () => {
    setForm({
      ...form,
      actions: [...form.actions, { type: 'CREATE_ESCALATION', level: 'HIGH', message: 'Triggered by automation' }]
    });
  };

  const removeAction = (idx) => {
    setForm({
      ...form,
      actions: form.actions.filter((_, i) => i !== idx)
    });
  };

  const updateAction = (idx, key, val) => {
    const updated = [...form.actions];
    updated[idx][key] = val;
    setForm({ ...form, actions: updated });
  };

  return (
    <Page title="Automation Engine" text="Define event-driven rules, automated notifications, and operational escalations.">
      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Zap size={15} /> Active Rules ({rules.length})
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Clock size={15} /> Execution Logs
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button type="button" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Automation Rule
        </button>
      </div>

      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rulesState.loading ? (
            <Loading />
          ) : rulesState.error ? (
            <Error text={rulesState.error} />
          ) : rules.length === 0 ? (
            <Empty text="No automation rules configured yet. Create a rule to automate workflows.">
              <button type="button" onClick={() => setShowCreate(true)} style={{ marginTop: 12 }}>
                <Plus size={15} /> Create First Rule
              </button>
            </Empty>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="rule-card">
                <div className="rule-header-row">
                  <div className="rule-title-group">
                    <span style={{ color: rule.enabled ? 'var(--primary)' : 'var(--muted)' }}><Zap size={18} /></span>
                    <div>
                      <h3 style={{ margin: 0 }}>{rule.name}</h3>
                      {rule.description && <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{rule.description}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      className={`quiet ${rule.enabled ? 'success' : 'muted'}`}
                      onClick={() => handleToggle(rule.id)}
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      {rule.enabled ? '● Enabled' : '○ Disabled'}
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      onClick={() => { setSelectedRuleLogs(rule.id); setActiveTab('logs'); }}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      title="View Rule Executions"
                    >
                      <Eye size={14} /> Logs
                    </button>
                    <button
                      type="button"
                      className="quiet danger"
                      onClick={() => setConfirmDelete(rule.id)}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      title="Delete Rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="rule-flow">
                  <span className="rule-tag when">WHEN</span>
                  <code>{rule.trigger_type}</code>
                  {rule.conditions && rule.conditions.length > 0 && (
                    <>
                      <span className="rule-tag if">IF</span>
                      {rule.conditions.map((c, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 500 }}>
                          <code>{c.field} {c.operator} "{c.value}"</code>
                          {i < rule.conditions.length - 1 ? ' AND ' : ''}
                        </span>
                      ))}
                    </>
                  )}
                  <span className="rule-tag then">THEN</span>
                  {rule.actions.map((a, i) => (
                    <span key={i} className="badge pending" style={{ fontSize: 11 }}>
                      {a.type} {a.level ? `(${a.level})` : ''}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  <span>Executions: <strong>{rule.execution_count || 0}</strong></span>
                  <span>Last run: {rule.last_run_at ? new Date(rule.last_run_at).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card table-wrap">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{selectedRuleLogs ? `Logs for Rule #${selectedRuleLogs}` : 'Recent Automation Executions'}</span>
            {selectedRuleLogs && (
              <button type="button" className="quiet" style={{ fontSize: 12 }} onClick={() => setSelectedRuleLogs(null)}>
                Clear Filter
              </button>
            )}
          </div>
          {logsState.loading ? (
            <Loading />
          ) : logsState.data?.length === 0 ? (
            <Empty text="No automation execution logs found." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Rule Name</th>
                  <th>Triggered By</th>
                  <th>Status</th>
                  <th>Execution Details</th>
                </tr>
              </thead>
              <tbody>
                {(logsState.data || []).map(log => (
                  <tr key={log.id}>
                    <td><small>{new Date(log.executed_at).toLocaleString()}</small></td>
                    <td><strong>{log.rule_name}</strong></td>
                    <td><code>{log.triggered_by}</code></td>
                    <td>
                      <span className={`badge ${log.status === 'SUCCESS' ? 'completed' : 'danger'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td><span className="muted" style={{ fontSize: 12 }}>{log.details || 'Executed successfully'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Automation Rule" size="lg" close={() => setShowCreate(false)}>
          <form onSubmit={handleCreateSubmit}>
            {createError && <Error text={createError} />}
            <label>
              Rule Name *
              <input
                type="text"
                required
                placeholder="e.g., Auto-Escalate Overdue Tasks"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Description
              <input
                type="text"
                placeholder="Explain the purpose of this rule..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label>
              WHEN (Trigger Event) *
              <select
                value={form.trigger_type}
                onChange={e => setForm({ ...form, trigger_type: e.target.value })}
              >
                <option value="TASK_CREATED">Task Created</option>
                <option value="TASK_OVERDUE">Task Becomes Overdue</option>
                <option value="TASK_STATUS_CHANGED">Task Status Changed</option>
                <option value="INCIDENT_CREATED">Incident Reported</option>
                <option value="REQUEST_SUBMITTED">Approval Request Submitted</option>
                <option value="REQUEST_DECIDED">Approval Request Decided</option>
              </select>
            </label>

            <div style={{ marginTop: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>IF (Conditions)</strong>
                <button type="button" className="quiet" style={{ fontSize: 12 }} onClick={addCondition}>
                  <Plus size={13} /> Add Condition
                </button>
              </div>
              {form.conditions.map((c, idx) => (
                <div key={idx} className="auto-condition-row">
                  <input
                    type="text"
                    placeholder="field (e.g., priority)"
                    value={c.field}
                    onChange={e => updateCondition(idx, 'field', e.target.value)}
                  />
                  <select
                    value={c.operator}
                    onChange={e => updateCondition(idx, 'operator', e.target.value)}
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="contains">contains</option>
                    <option value="greater_than">&gt; (greater)</option>
                    <option value="less_than">&lt; (less)</option>
                  </select>
                  <input
                    type="text"
                    className="auto-row-val"
                    placeholder="value (e.g., HIGH)"
                    value={c.value}
                    onChange={e => updateCondition(idx, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    className="quiet danger auto-row-del-btn"
                    title="Remove condition"
                    onClick={() => removeCondition(idx)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>THEN (Actions) *</strong>
                <button type="button" className="quiet" style={{ fontSize: 12 }} onClick={addAction}>
                  <Plus size={13} /> Add Action
                </button>
              </div>
              {form.actions.map((a, idx) => (
                <div key={idx} className="auto-action-row">
                  <select
                    value={a.type}
                    onChange={e => updateAction(idx, 'type', e.target.value)}
                  >
                    <option value="NOTIFY_MANAGER">Notify Assigned Manager</option>
                    <option value="NOTIFY_USER">Notify Assignee / Reporter</option>
                    <option value="NOTIFY_ADMIN">Notify System Admin</option>
                    <option value="CREATE_ESCALATION">Create Operational Escalation</option>
                    <option value="AUDIT_LOG">Record Audit Event</option>
                  </select>
                  <input
                    type="text"
                    className="auto-row-val"
                    placeholder="Custom message or note..."
                    value={a.message || ''}
                    onChange={e => updateAction(idx, 'message', e.target.value)}
                  />
                  <button
                    type="button"
                    className="quiet danger auto-row-del-btn"
                    title="Remove action"
                    onClick={() => removeAction(idx)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
              <button type="submit" disabled={creating}>
                {creating ? <span className="btn-spinner" /> : <Zap size={15} />}
                Create Automation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Automation Rule"
          message="Are you sure you want to delete this automation rule? Active executions will stop."
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}

// ----------------- ESCALATIONS -----------------

function Escalations({ user }) {
  const [revision, setRevision] = useState(0);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const escalationsState = useLoad(() => escalationService.list(), `escalations-${revision}`);
  const navigate = useNavigate();

  const escalations = escalationsState.data || [];

  const filtered = escalations.filter(e => {
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    if (filterLevel !== 'ALL' && e.level !== filterLevel) return false;
    return true;
  });

  const openCount = escalations.filter(e => e.status === 'OPEN').length;
  const criticalCount = escalations.filter(e => e.level === 'CRITICAL' && e.status !== 'RESOLVED').length;
  const investigatingCount = escalations.filter(e => e.status === 'INVESTIGATING').length;
  const resolvedCount = escalations.filter(e => e.status === 'RESOLVED').length;

  const handleAcknowledge = async (id) => {
    try {
      await escalationService.update(id, { status: 'INVESTIGATING' });
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;
    setResolving(true);
    try {
      await escalationService.resolve(resolveModal.id, resolutionNote);
      setResolveModal(null);
      setResolutionNote('');
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <Page title="SLA & Escalations Management" text="Monitor operational bottlenecks, SLA breach risks, and resolve priority escalations.">
      <div className="sla-stats-row" style={{ marginBottom: 20 }}>
        <div className="sla-stat-box">
          <span className="sla-stat-num" style={{ color: 'var(--danger)' }}>{openCount}</span>
          <span className="sla-stat-lbl">Open Escalations</span>
        </div>
        <div className="sla-stat-box">
          <span className="sla-stat-num" style={{ color: '#dc2626' }}>{criticalCount}</span>
          <span className="sla-stat-lbl">Critical Severity</span>
        </div>
        <div className="sla-stat-box">
          <span className="sla-stat-num" style={{ color: 'var(--warning)' }}>{investigatingCount}</span>
          <span className="sla-stat-lbl">Investigating</span>
        </div>
        <div className="sla-stat-box">
          <span className="sla-stat-num" style={{ color: 'var(--success)' }}>{resolvedCount}</span>
          <span className="sla-stat-lbl">Resolved</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140 }}>
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ width: 140 }}>
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="LEVEL_2">Level 2 (High)</option>
            <option value="LEVEL_1">Level 1 (Medium)</option>
          </select>
        </div>
      </div>

      <div className="card table-wrap">
        {escalationsState.loading ? (
          <Loading />
        ) : escalationsState.error ? (
          <Error text={escalationsState.error} />
        ) : filtered.length === 0 ? (
          <Empty text="No active escalations matching current criteria." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Source</th>
                <th>Title / Issue</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Logged At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(esc => (
                <tr key={esc.id}>
                  <td>
                    <span className={`badge ${esc.level === 'CRITICAL' ? 'danger' : (esc.level === 'LEVEL_2' ? 'warning' : 'pending')}`}>
                      {esc.level}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)', fontWeight: 600 }}
                      onClick={() => {
                        if (esc.source_type === 'TASK') navigate('/tasks');
                        else if (esc.source_type === 'INCIDENT') navigate('/incidents');
                        else if (esc.source_type === 'REQUEST') navigate('/approvals');
                        else if (esc.source_type === 'DOCUMENT') navigate('/documents');
                      }}
                    >
                      {esc.source_type} #{esc.source_id}
                    </span>
                  </td>
                  <td><strong>{esc.title}</strong></td>
                  <td><span className="muted" style={{ fontSize: 12 }}>{esc.reason}</span></td>
                  <td>
                    <span className={`badge ${esc.status === 'RESOLVED' ? 'completed' : (esc.status === 'INVESTIGATING' ? 'in-progress' : 'pending')}`}>
                      {esc.status}
                    </span>
                  </td>
                  <td>{esc.assigned_to_name || 'Unassigned'}</td>
                  <td><small>{new Date(esc.created_at).toLocaleString()}</small></td>
                  <td className="actions">
                    {esc.status === 'OPEN' && (
                      <button type="button" className="quiet" onClick={() => handleAcknowledge(esc.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
                        Acknowledge
                      </button>
                    )}
                    {esc.status !== 'RESOLVED' && (
                      <button type="button" onClick={() => { setResolveModal(esc); setResolutionNote(''); }} style={{ padding: '4px 8px', fontSize: 11 }}>
                        <Check size={13} /> Resolve
                      </button>
                    )}
                    {esc.status === 'RESOLVED' && (
                      <span className="muted" style={{ fontSize: 11 }}>{esc.resolution_notes || 'Resolved'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {resolveModal && (
        <Modal title={`Resolve Escalation #${resolveModal.id}`} close={() => setResolveModal(null)}>
          <form onSubmit={handleResolveSubmit}>
            <p style={{ marginBottom: 12 }}>
              Resolving: <strong>{resolveModal.title}</strong> ({resolveModal.source_type} #{resolveModal.source_id})
            </p>
            <label>
              Resolution Notes *
              <textarea
                required
                rows={3}
                placeholder="Explain the corrective measures taken..."
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
              />
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setResolveModal(null)} disabled={resolving}>Cancel</button>
              <button type="submit" disabled={resolving}>
                {resolving ? <span className="btn-spinner" /> : <Check size={15} />}
                Confirm Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  );
}

// ----------------- REPORTS -----------------

function Reports({ user }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [revision, setRevision] = useState(0);
  const typesState = useLoad(() => reportService.types(), 'report-types');
  const historyState = useLoad(() => reportService.history(), `report-history-${revision}`);
  const schedulesState = useLoad(() => reportScheduleService.list(), `report-schedules-${revision}`);
  const deptsState = useLoad(() => departmentService.list(), 'report-depts');

  const [selectedType, setSelectedType] = useState('DAILY_OPS');
  const [format, setFormat] = useState('CSV');
  const [period, setPeriod] = useState('ALL');
  const [deptId, setDeptId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: 'Weekly Operations Summary',
    report_type: 'DAILY_OPS',
    frequency: 'WEEKLY',
    day_of_week: 'MONDAY',
    time_of_day: '09:00',
    format: 'CSV',
    recipients: 'admin@opsvault.local',
    enabled: true
  });
  const [scheduling, setScheduling] = useState(false);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(null);

  const reportTypes = typesState.data || [
    { id: 'DAILY_OPS', name: 'Daily Operations Summary', description: 'Daily throughput, task velocity, and pending approvals.' },
    { id: 'WEEKLY_TASKS', name: 'Weekly Task Status & Completion', description: 'Weekly task status breakdown and completion rates.' },
    { id: 'EMPLOYEE_WORKLOAD', name: 'Employee Workload & Capacity', description: 'Task distribution, workload bottlenecks, and member efficiency.' },
    { id: 'INCIDENT_RISK', name: 'Incident & Risk Analysis', description: 'Incident response rates and severity distribution.' },
    { id: 'ASSET_INVENTORY', name: 'Asset Inventory & Status', description: 'Operational hardware and software asset assignments.' },
    { id: 'DEPT_PERFORMANCE', name: 'Department Performance Metrics', description: 'Productivity metrics across operational units.' },
    { id: 'REQUEST_SLA', name: 'Request & Approval SLA Report', description: 'Turnaround compliance and approval bottleneck analysis.' }
  ];

  const handleGenerateOnDemand = async () => {
    setGenerating(true);
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const access = localStorage.getItem('ops_access');
      const res = await fetch(`${BASE}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access ? { Authorization: `Bearer ${access}` } : {})
        },
        body: JSON.stringify({
          report_type: selectedType,
          format: format,
          period: period,
          department_id: deptId ? Number(deptId) : null
        })
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const blob = await res.blob();
      const ext = format === 'CSV' ? 'csv' : (format === 'PDF' ? 'html' : 'json');
      const filename = `OpsVault_${selectedType}_${new Date().toISOString().slice(0,10)}.${ext}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRunScheduleNow = async (schedId) => {
    try {
      await reportScheduleService.runNow(schedId);
      alert('Report generated and delivered to recipients!');
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduling(true);
    try {
      await reportScheduleService.create(scheduleForm);
      setShowScheduleModal(false);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    } finally {
      setScheduling(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!confirmDeleteSchedule) return;
    try {
      await reportScheduleService.remove(confirmDeleteSchedule);
      setConfirmDeleteSchedule(null);
      setRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Page title="Scheduled Business Reports" text="Generate on-demand analytics exports and manage automated recurring schedules.">
      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <Download size={15} /> On-Demand Generator
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <CalendarDays size={15} /> Automated Schedules ({(schedulesState.data || []).length})
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={15} /> Generation History
        </button>
      </div>

      {activeTab === 'generate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="reports-type-grid">
            {reportTypes.map(t => (
              <div
                key={t.id}
                className={`report-type-card ${selectedType === t.id ? 'selected' : ''}`}
                onClick={() => setSelectedType(t.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <FileBarChart size={18} color="var(--primary)" />
                  <strong>{t.name}</strong>
                </div>
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>{t.description}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3>Export Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 14 }}>
              <label>
                Export Format
                <select value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="CSV">CSV (Spreadsheet)</option>
                  <option value="PDF">Formatted Document (HTML / PDF)</option>
                  <option value="JSON">JSON (API Export)</option>
                </select>
              </label>

              <label>
                Time Period
                <select value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today (Last 24 Hours)</option>
                  <option value="THIS_WEEK">This Week (Last 7 Days)</option>
                  <option value="THIS_MONTH">This Month (Last 30 Days)</option>
                </select>
              </label>

              {user.role === 'ADMIN' && (
                <label>
                  Department Scope
                  <select value={deptId} onChange={e => setDeptId(e.target.value)}>
                    <option value="">All Departments</option>
                    {(deptsState.data || []).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleGenerateOnDemand} disabled={generating} style={{ padding: '10px 20px' }}>
                {generating ? <span className="btn-spinner" /> : <Download size={16} />}
                Generate & Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button type="button" onClick={() => setShowScheduleModal(true)}>
              <Plus size={15} /> Create Automated Schedule
            </button>
          </div>

          <div className="card table-wrap">
            {schedulesState.loading ? (
              <Loading />
            ) : schedulesState.data?.length === 0 ? (
              <Empty text="No automated report schedules configured." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Schedule Name</th>
                    <th>Report Type</th>
                    <th>Frequency</th>
                    <th>Format</th>
                    <th>Recipients</th>
                    <th>Status</th>
                    <th>Last Run</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(schedulesState.data || []).map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td><code>{s.report_type}</code></td>
                      <td>{s.frequency} ({s.time_of_day})</td>
                      <td><span className="badge pending">{s.format}</span></td>
                      <td><small>{s.recipients}</small></td>
                      <td>
                        <span className={`badge ${s.enabled ? 'completed' : 'muted'}`}>
                          {s.enabled ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td><small>{s.last_run_at ? new Date(s.last_run_at).toLocaleString() : 'Never'}</small></td>
                      <td className="actions">
                        <button type="button" className="quiet" onClick={() => handleRunScheduleNow(s.id)} title="Run Schedule Now">
                          <PlayCircle size={15} /> Run Now
                        </button>
                        <button type="button" className="quiet danger" onClick={() => setConfirmDeleteSchedule(s.id)} title="Delete Schedule">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card table-wrap">
          {historyState.loading ? (
            <Loading />
          ) : historyState.data?.length === 0 ? (
            <Empty text="No historical reports generated yet." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Report Type</th>
                  <th>Format</th>
                  <th>File Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(historyState.data || []).map(h => (
                  <tr key={h.id}>
                    <td><small>{new Date(h.created_at).toLocaleString()}</small></td>
                    <td><strong>{h.report_type}</strong></td>
                    <td><span className="badge pending">{h.format}</span></td>
                    <td><code>{h.file_name || 'generated_report'}</code></td>
                    <td>
                      <span className={`badge ${h.status === 'COMPLETED' ? 'completed' : 'danger'}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showScheduleModal && (
        <Modal title="Schedule Automated Report" close={() => setShowScheduleModal(false)}>
          <form onSubmit={handleScheduleSubmit}>
            <label>
              Schedule Name *
              <input
                type="text"
                required
                value={scheduleForm.name}
                onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })}
              />
            </label>
            <label>
              Report Type *
              <select
                value={scheduleForm.report_type}
                onChange={e => setScheduleForm({ ...scheduleForm, report_type: e.target.value })}
              >
                {reportTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Frequency
                <select
                  value={scheduleForm.frequency}
                  onChange={e => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
              <label>
                Export Format
                <select
                  value={scheduleForm.format}
                  onChange={e => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                >
                  <option value="CSV">CSV</option>
                  <option value="PDF">PDF / HTML</option>
                  <option value="JSON">JSON</option>
                </select>
              </label>
            </div>
            <label>
              Delivery Email Recipients * (comma separated)
              <input
                type="text"
                required
                placeholder="e.g. manager@opsvault.local, exec@opsvault.local"
                value={scheduleForm.recipients}
                onChange={e => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
              />
            </label>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="quiet" onClick={() => setShowScheduleModal(false)} disabled={scheduling}>Cancel</button>
              <button type="submit" disabled={scheduling}>
                {scheduling ? <span className="btn-spinner" /> : <CalendarDays size={15} />}
                Save Schedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteSchedule && (
        <ConfirmModal
          title="Delete Report Schedule"
          message="Delete this recurring automated report schedule?"
          onConfirm={handleDeleteSchedule}
          onCancel={() => setConfirmDeleteSchedule(null)}
        />
      )}
    </Page>
  );
}

// ----------------- PROFILE -----------------

function EditProfileModal({ currentName, close, onUpdated }) {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await profileService.update({ full_name: name });
      if (onUpdated) onUpdated();
      close();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Profile Details" close={close}>
      <form onSubmit={handleSubmit}>
        {error && <Error text={error} />}
        <label>
          Full Name *
          <input
            type="text"
            required
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="quiet" onClick={close} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : <Check size={15} />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ close }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await profileService.changePassword({
        current_password: form.current_password,
        new_password: form.new_password
      });
      setSuccess(true);
      setTimeout(() => close(), 1200);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Change Account Password" close={close}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 12px' }}>
          <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>Password Changed Successfully</h3>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>Your credentials have been securely updated.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <Error text={error} />}
          <label>
            Current Password *
            <input
              type="password"
              required
              placeholder="Enter current password"
              value={form.current_password}
              onChange={e => setForm({ ...form, current_password: e.target.value })}
            />
          </label>
          <label>
            New Password * (Min 8 characters)
            <input
              type="password"
              required
              minLength={8}
              placeholder="Enter new password"
              value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })}
            />
          </label>
          <label>
            Confirm New Password *
            <input
              type="password"
              required
              minLength={8}
              placeholder="Confirm new password"
              value={form.confirm_password}
              onChange={e => setForm({ ...form, confirm_password: e.target.value })}
            />
          </label>
          <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="quiet" onClick={close} disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <Key size={15} />}
              Update Password
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Profile({ profile, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('identity');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isManagement = profile?.profile?.role === 'ADMIN' || profile?.profile?.role === 'MANAGER';
  const isAdmin = profile?.profile?.role === 'ADMIN';
  const isManager = profile?.profile?.role === 'MANAGER';
  const isEmployee = profile?.profile?.role === 'EMPLOYEE';

  const history = useLoad(() => isEmployee ? profileService.history() : Promise.resolve([]));
  const [calRevision, setCalRevision] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null);

  const startMonthStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  const endMonthStr = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const eventsState = useLoad(() => calendarService.list(startMonthStr, endMonthStr), `profile-cal-${currentDate.getMonth()}-${calRevision}`);
  const events = eventsState.data || [];

  const filteredEvents = events.filter(e => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'PERSONAL' && (e.source === 'PERSONAL' || e.event_type === 'PERSONAL')) return true;
    if (selectedCategory === 'DEADLINE' && (e.source === 'TASK' || e.event_type === 'DEADLINE')) return true;
    if (selectedCategory === 'INCIDENT' && e.source === 'INCIDENT') return true;
    return false;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
  }

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const getDayEvents = (d) => {
    const dStr = d.toISOString().slice(0, 10);
    return filteredEvents.filter(e => {
      const eDate = e.start_time ? e.start_time.slice(0, 10) : '';
      return eDate === dStr;
    });
  };

  const handleDeletePersonalEvent = async () => {
    if (!confirmDeleteEvent) return;
    try {
      await calendarService.remove(confirmDeleteEvent);
      setConfirmDeleteEvent(null);
      setCalRevision(v => v + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const pageTitle = isManagement
    ? (isAdmin ? "Administrator Profile & Workspace" : "Operations Manager Profile & Workspace")
    : "My Profile & Personal Workspace";

  const pageSubtitle = isManagement
    ? (isAdmin ? "System administrator credentials, governance scope, and operational calendar." : "Department manager credentials, operational scope, and schedule.")
    : "Manage personal calendar, milestones, operational deadlines, and XP records.";

  return (
    <Page title={pageTitle} text={pageSubtitle}>
      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          <UserCircle size={15} /> {isManagement ? 'Account & Governance' : 'Account Details & XP'}
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={15} /> Personal Calendar &amp; Deadlines
        </button>
      </div>

      {/* 1. MANAGEMENT PROFILE VIEW (ADMIN & MANAGER - NO XP/LEVEL) */}
      {activeTab === 'identity' && isManagement && (
        <div className="mgmt-profile-wrapper">
          {/* Header Card */}
          <div className="mgmt-profile-header">
            <div className="mgmt-profile-left">
              <div className="mgmt-profile-avatar">
                {profile?.profile?.full_name ? profile.profile.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="mgmt-profile-info">
                <h2>{profile?.profile?.full_name}</h2>
                <p>{profile?.profile?.email}</p>
                <div className="mgmt-profile-badges">
                  <Badge value={profile?.profile?.role} />
                  <span className="badge completed">Active Account</span>
                  <span className="badge in-progress" style={{ fontSize: 11 }}>
                    {isAdmin ? 'Global System Oversight' : (profile?.department || 'Department Lead')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mgmt-profile-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowEditProfile(true)}
              >
                <Edit2 size={14} /> Edit Profile
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowChangePassword(true)}
              >
                <Key size={14} /> Change Password
              </button>
            </div>
          </div>

          {/* 4 Focused Governance & Account Information Cards */}
          <div className="mgmt-profile-grid">
            {/* Card 1: Account Information */}
            <section className="mgmt-info-card">
              <div className="mgmt-info-card-header">
                <UserCircle size={18} color="var(--primary)" />
                <h3>Account &amp; Personal Information</h3>
              </div>
              <dl className="mgmt-info-list">
                <div className="mgmt-info-item">
                  <dt>Full Name</dt>
                  <dd>{profile?.profile?.full_name}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Primary Email</dt>
                  <dd>{profile?.profile?.email}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Account Status</dt>
                  <dd><span className="badge completed" style={{ fontSize: 11 }}>Active · Verified</span></dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Account Created</dt>
                  <dd>
                    {profile?.profile?.created_at
                      ? new Date(profile.profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'Active Workspace'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Card 2: Organization & Governance Scope */}
            <section className="mgmt-info-card">
              <div className="mgmt-info-card-header">
                <ShieldCheck size={18} color="var(--primary)" />
                <h3>Organization &amp; Governance Scope</h3>
              </div>
              <dl className="mgmt-info-list">
                <div className="mgmt-info-item">
                  <dt>System Role</dt>
                  <dd>{isAdmin ? 'System Administrator' : 'Operations Manager'}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Department Assignment</dt>
                  <dd>{isAdmin ? 'Global (All Departments)' : (profile?.department || 'Department Lead')}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Operational Authority</dt>
                  <dd>{isAdmin ? 'Full Organization Control' : 'Department Scope'}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Assigned Workload</dt>
                  <dd>{profile?.active_tasks || 0} In Flight / {profile?.completed_tasks || 0} Resolved</dd>
                </div>
              </dl>
            </section>

            {/* Card 3: Security & Access Credentials */}
            <section className="mgmt-info-card">
              <div className="mgmt-info-card-header">
                <Lock size={18} color="var(--primary)" />
                <h3>Security &amp; Access Controls</h3>
              </div>
              <dl className="mgmt-info-list">
                <div className="mgmt-info-item">
                  <dt>Security Clearance</dt>
                  <dd>{isAdmin ? 'Tier 1 - Master Privileges' : 'Tier 2 - Departmental Management'}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Session Authentication</dt>
                  <dd>Encrypted JWT Session</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Password Encryption</dt>
                  <dd>BCrypt Hash Active</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Credentials Action</dt>
                  <dd>
                    <button
                      type="button"
                      className="quiet"
                      style={{ fontSize: 12, padding: '2px 6px', color: 'var(--primary)' }}
                      onClick={() => setShowChangePassword(true)}
                    >
                      Update Password →
                    </button>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Card 4: Operational Capabilities */}
            <section className="mgmt-info-card">
              <div className="mgmt-info-card-header">
                <Zap size={18} color="var(--primary)" />
                <h3>Operational Capabilities</h3>
              </div>
              <dl className="mgmt-info-list">
                <div className="mgmt-info-item">
                  <dt>Automation Engine</dt>
                  <dd>{isAdmin ? 'Full Rule Administration' : 'Department Scope'}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>SLA &amp; Escalations</dt>
                  <dd>Authorized Escalation Handler</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Scheduled Reports</dt>
                  <dd>{isAdmin ? 'Organization Analytics' : 'Department Reports'}</dd>
                </div>
                <div className="mgmt-info-item">
                  <dt>Audit Logging</dt>
                  <dd>Action Logging Active</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {/* 2. EMPLOYEE PROFILE VIEW (WITH XP, LEVEL, PROGRESS & HISTORY) */}
      {activeTab === 'identity' && isEmployee && (
        <div className="profile-grid">
          <section className="card identity">
            <div className="avatar large">{profile?.profile?.full_name ? profile.profile.full_name[0] : 'U'}</div>
            <h2>{profile?.profile?.full_name}</h2>
            <p className="muted" style={{ marginTop: 2, marginBottom: 10 }}>{profile?.profile?.email}</p>
            <Badge value={profile?.profile?.role} />
            <dl>
              <dt>Department</dt>
              <dd>{profile?.department || 'Unassigned'}</dd>
              <dt>Account status</dt>
              <dd>Active</dd>
              <dt>Current level</dt>
              <dd>{profile?.level}{profile?.level === 100 ? ' · MAX LEVEL' : ''}</dd>
            </dl>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => setShowEditProfile(true)}
              >
                <Edit2 size={13} /> Edit Profile
              </button>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => setShowChangePassword(true)}
              >
                <Key size={13} /> Password
              </button>
            </div>
          </section>

          <section className="card">
            <h2>XP progress</h2>
            <b className="xp">{(profile?.profile?.xp || 0).toLocaleString()} XP</b>
            <div className="progress"><i style={{ width: `${profile?.xp_progress || 0}%` }} /></div>
            <p className="muted" style={{ marginTop: 8 }}>
              {profile?.level === 100
                ? 'Maximum level reached'
                : `${(profile?.xp_for_next_level || 0) - (profile?.profile?.xp || 0)} XP to next level`}
            </p>
            <h2 style={{ marginTop: 24, marginBottom: 12 }}>XP Activity</h2>
            {history.loading ? (
              <Loading />
            ) : history.data?.length ? (
              history.data.map(x => (
                <div className="activity" key={x.id}>
                  <b>+{x.amount} XP</b>
                  <span>{x.reason}</span>
                  <small>{new Date(x.created_at).toLocaleString()}</small>
                </div>
              ))
            ) : (
              <Empty text="Your XP activity will appear here." />
            )}
          </section>
        </div>
      )}

      {/* 3. CALENDAR TAB (AVAILABLE FOR ALL ROLES) */}
      {activeTab === 'calendar' && (
        <div>
          <div className="calendar-view-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="quiet"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ margin: 0 }}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              <button
                type="button"
                className="quiet"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="quiet"
                style={{ fontSize: 12 }}
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: 150 }}>
                <option value="ALL">All Categories</option>
                <option value="PERSONAL">Personal Notes</option>
                <option value="DEADLINE">Task Deadlines</option>
                <option value="INCIDENT">Incidents</option>
              </select>
              <button type="button" onClick={() => setShowAddEvent(true)}>
                <Plus size={15} /> Add Event
              </button>
            </div>
          </div>

          <div className="calendar-grid-full">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="calendar-header-day">{day}</div>
            ))}
            {days.map((item, idx) => {
              const dayEvents = getDayEvents(item.date);
              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!item.currentMonth ? 'other-month' : ''} ${isToday(item.date) ? 'today' : ''}`}
                >
                  <div className="calendar-cell-top">
                    <span className="calendar-cell-num">{item.day}</span>
                    {dayEvents.length > 0 && <small className="muted">{dayEvents.length}</small>}
                  </div>
                  <div className="calendar-cell-events">
                    {dayEvents.map(e => (
                      <div
                        key={e.id}
                        className={`calendar-pill ${e.source === 'TASK' ? 'task' : (e.source === 'INCIDENT' ? 'incident' : 'event')}`}
                        title={`${e.title} (${e.start_time ? new Date(e.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''})`}
                      >
                        <span>{e.title}</span>
                        {e.source === 'PERSONAL' && (
                          <button
                            type="button"
                            className="quiet danger"
                            style={{ padding: 0, marginLeft: 'auto' }}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setConfirmDeleteEvent(e.raw_id);
                            }}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showEditProfile && (
        <EditProfileModal
          currentName={profile?.profile?.full_name}
          close={() => setShowEditProfile(false)}
          onUpdated={() => {
            if (onUserUpdated) onUserUpdated();
          }}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          close={() => setShowChangePassword(false)}
        />
      )}

      {showAddEvent && (
        <QuickEventModal
          defaultDate={new Date()}
          close={() => setShowAddEvent(false)}
          onSaved={() => {
            setShowAddEvent(false);
            setCalRevision(v => v + 1);
          }}
        />
      )}

      {confirmDeleteEvent && (
        <ConfirmModal
          title="Delete Calendar Event"
          message="Are you sure you want to delete this event?"
          onConfirm={handleDeletePersonalEvent}
          onCancel={() => setConfirmDeleteEvent(null)}
        />
      )}
    </Page>
  );
}

// ----------------- LOGIN -----------------

function Login({ setUser }) {
  const nav = useNavigate();
  const devUsers = import.meta.env.VITE_DEV_TEST_USERS === 'true';
  const [data, set] = useState(
    devUsers
      ? { email: 'admin@opsvault.local', password: 'OpsVaultTest!2026' }
      : { email: '', password: '' }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.login(data);
      const p = await profileService.get();
      setUser(p);
      nav('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="brand">◈ OpsVault</div>
        <h1>Welcome back</h1>
        <p>Sign in to your operations workspace.</p>
        {devUsers && <p className="muted" style={{ fontSize: 12 }}>Development admin account is prefilled.</p>}
        {error && <Error text={error} />}
        <label>
          Email
          <input
            type="email"
            required
            value={data.email}
            onChange={e => set({ ...data, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={data.password}
            onChange={e => set({ ...data, password: e.target.value })}
          />
        </label>
        <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? (
            <>
              <span className="btn-spinner" />
              Signing in...
            </>
          ) : 'Sign in'}
        </button>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            className="quiet"
            onClick={() => nav('/')}
            style={{ fontSize: 13, color: 'var(--primary)' }}
          >
            ← Back to OpsVault Overview
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------- SHARED COMPONENTS -----------------

const Badge = ({ value }) => (
  <span className={'badge ' + String(value || '').toLowerCase().replaceAll('_', '-')}>
    {String(value || '').replaceAll('_', ' ')}
  </span>
);

// Glowing Cyan-Blue Ring Loading state (matching Image 1)
const Loading = () => (
  <div className="business-loader-wrap" aria-busy="true" aria-live="polite">
    <div className="glowing-ring-loader">
      <div className="glowing-ring-halo" />
      <div className="glowing-ring-core" />
    </div>
    <div className="business-loader-text">Loading operations data…</div>
  </div>
);

const Error = ({ text }) => <div className="error">{text}</div>;

const Empty = ({ text, children }) => (
  <div className="empty">
    <p>{text}</p>
    {children}
  </div>
);

function Modal({ title, close, size = 'md', children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    
    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
    };
  }, [close]);

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : size === 'xl' ? 'modal-xl' : 'modal-md';

  const modalContent = (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Modal Dialog'}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div
        className={`modal ${sizeClass} card`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={close}
            aria-label="Close dialog"
            title="Close (ESC)"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  return (
    <Modal title={title || "Confirm Action"} size="sm" close={onCancel}>
      <p style={{ margin: '0 0 20px', color: 'var(--text)', fontSize: 14, lineHeight: 1.5 }}>
        {message || "Are you sure you want to proceed?"}
      </p>
      <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" className="quiet" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="button" className="danger" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <span className="btn-spinner" />
              Deleting...
            </>
          ) : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}

// ----------------- ROOT APP -----------------

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => localStorage.theme === 'light' ? false : true);
  const [transitionType, setTransitionType] = useState(null);

  useEffect(() => {
    if (!user) {
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      localStorage.theme = dark ? 'dark' : 'light';
    }
  }, [user, dark]);

  useEffect(() => {
    profileService.get().then(setUser).catch(() => {});
  }, []);

  const handleToggleTheme = useCallback(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      setDark(prev => !prev);
      return;
    }

    const nextType = dark ? 'to-light' : 'to-dark';
    setTransitionType(nextType);
    setDark(prev => !prev);
  }, [dark]);

  if (!user) {
    return (
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ThemeCenterOverlay
        type={transitionType}
        onComplete={() => setTransitionType(null)}
      />
      <Shell profile={user.profile} dark={dark} onToggleTheme={handleToggleTheme}>
        <Routes>
          <Route path="/" element={<Dashboard profile={user} />} />
          <Route path="/tasks" element={<Tasks user={user.profile} />} />
          <Route path="/approvals" element={<Approvals user={user.profile} />} />
          <Route path="/employees" element={<Employees user={user.profile} />} />
          <Route path="/departments" element={<Departments user={user.profile} />} />
          <Route path="/incidents" element={<Incidents user={user.profile} />} />
          <Route path="/documents" element={<Documents user={user.profile} />} />
          <Route path="/assets" element={<Assets user={user.profile} />} />
          <Route path="/automations" element={<Automations user={user.profile} />} />
          <Route path="/escalations" element={<Escalations user={user.profile} />} />
          <Route path="/reports" element={<Reports user={user.profile} />} />
          <Route path="/profile" element={<Profile profile={user} onUserUpdated={() => profileService.get().then(setUser)} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Shell>
    </ToastProvider>
  );
}
