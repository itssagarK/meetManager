import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = '/api/meetings';

const initialFormData = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '10:00 AM',
  priority: 'High',
  status: 'Pending',
  notes: '',
  link: '',
  attendees: '',
};

const priorityOrder = { High: 1, Medium: 2, Low: 3 };

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'task' | 'meeting'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table' | 'cards'
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formType, setFormType] = useState('task'); // 'task' | 'meeting'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchItems = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setItems(data);
      setServerOnline(true);
    } catch (err) {
      console.error('Error fetching items:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenCreateTask = (prefillDate = null) => {
    setEditingId(null);
    setFormType('task');
    setFormData({
      ...initialFormData,
      title: '',
      date: prefillDate || selectedDate || initialFormData.date,
      time: '10:00 AM',
      priority: 'High',
      link: '',
      attendees: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenCreateMeeting = (prefillDate = null) => {
    setEditingId(null);
    setFormType('meeting');
    setFormData({
      ...initialFormData,
      title: '',
      date: prefillDate || selectedDate || initialFormData.date,
      time: '02:00 PM',
      priority: 'Medium',
      link: 'https://meet.google.com/',
      attendees: 'Sagar (Host), Team',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item) => {
    const isMeeting = Boolean(item.link || (item.attendees && item.attendees.trim() !== ''));
    setEditingId(item.id);
    setFormType(isMeeting ? 'meeting' : 'task');
    setFormData({
      title: item.title,
      date: item.date,
      time: item.time,
      priority: item.priority || 'Medium',
      status: item.status === 'Completed' ? 'Completed' : 'Pending',
      notes: item.notes || '',
      link: item.link || '',
      attendees: item.attendees || '',
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to save'}`);
        return;
      }

      await fetchItems();
      handleCloseDrawer();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to connect to backend server.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      await fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete item.');
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchItems();
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update status.');
    }
  };

  // Calendar calculations
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1));
  const handleNextMonth = () => setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1));

  // Map items by date
  const itemsByDate = items.reduce((acc, it) => {
    if (!acc[it.date]) acc[it.date] = [];
    acc[it.date].push(it);
    return acc;
  }, {});

  // Filtered and sorted list
  const filteredAndSortedItems = items
    .filter((it) => {
      const isMeeting = Boolean(it.link || (it.attendees && it.attendees.trim() !== ''));
      const itType = isMeeting ? 'meeting' : 'task';

      const matchesSearch =
        it.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (it.notes && it.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (it.attendees && it.attendees.toLowerCase().includes(searchTerm.toLowerCase()));

      const isCompleted = it.status === 'Completed';
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Completed'
          ? isCompleted
          : !isCompleted;

      const matchesType = typeFilter === 'All' || itType === typeFilter;
      const matchesDate = viewMode === 'calendar' && selectedDate ? it.date === selectedDate : true;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    })
    .sort((a, b) => {
      const pA = priorityOrder[a.priority] || 2;
      const pB = priorityOrder[b.priority] || 2;
      if (pA !== pB) return pA - pB;
      return (a.time || '').localeCompare(b.time || '');
    });

  const totalCount = items.length;
  const highPriorityCount = items.filter((it) => it.priority === 'High' && it.status !== 'Completed').length;
  const meetingCount = items.filter((it) => it.link || (it.attendees && it.attendees.trim() !== '')).length;
  const pendingCount = items.filter((it) => it.status !== 'Completed').length;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1>Task & Meeting Manager</h1>
          <p className="subtitle">Manage tasks and schedule meetings by priority and time</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => handleOpenCreateTask(selectedDate)}>
            + Add Task
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenCreateMeeting(selectedDate)}>
            + Schedule Meeting
          </button>
        </div>
      </header>

      {/* Metrics Summary */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Total Scheduled</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">High Priority</span>
          <span className="stat-value text-blue">{highPriorityCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Meetings</span>
          <span className="stat-value">{meetingCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{pendingCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Database</span>
          <span className={`status-pill ${serverOnline ? 'online' : 'offline'}`}>
            {serverOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="controls-bar">
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendar & Day View
          </button>
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => { setViewMode('table'); setSelectedDate(null); }}
          >
            Table View
          </button>
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => { setViewMode('cards'); setSelectedDate(null); }}
          >
            Cards View
          </button>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search by title, attendees, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-group">
          {['All', 'task', 'meeting'].map((t) => (
            <button
              key={t}
              className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'All' ? 'All Items' : t === 'task' ? 'Tasks Only' : 'Meetings Only'}
            </button>
          ))}
        </div>

        <div className="filter-group">
          {['All', 'Pending', 'Completed'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="calendar-layout">
          <div className="calendar-widget">
            <div className="calendar-header">
              <h3>{monthNames[calMonth]} {calYear}</h3>
              <div className="cal-nav">
                <button className="btn-icon" onClick={handlePrevMonth}>Prev</button>
                <button className="btn-icon" onClick={() => setCurrentCalendarDate(new Date())}>Today</button>
                <button className="btn-icon" onClick={handleNextMonth}>Next</button>
              </div>
            </div>

            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="cal-weekday">{d}</div>
              ))}
            </div>

            <div className="calendar-days-grid">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="cal-day empty"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = String(dayNum).padStart(2, '0');
                const formattedMonth = String(calMonth + 1).padStart(2, '0');
                const dateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
                const dayItems = (itemsByDate[dateStr] || []).sort(
                  (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
                );
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div
                    key={dateStr}
                    className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayItems.length > 0 ? 'has-tasks' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className="cal-day-top">
                      <span className="day-number">{dayNum}</span>
                      {dayItems.some((it) => it.priority === 'High' && it.status !== 'Completed') && (
                        <span className="cal-priority-dot" title="High Priority"></span>
                      )}
                    </div>

                    <div className="cal-tasks-container">
                      {dayItems.slice(0, 2).map((it) => {
                        const isMeeting = Boolean(it.link || (it.attendees && it.attendees.trim() !== ''));
                        return (
                          <div
                            key={it.id}
                            className={`cal-task-chip priority-${(it.priority || 'medium').toLowerCase()} ${it.status === 'Completed' ? 'completed' : ''}`}
                            title={`${it.time} - ${it.title} (${isMeeting ? 'Meeting' : 'Task'}, ${it.priority || 'Medium'} Priority)`}
                          >
                            <span className="chip-p-label">{it.priority === 'High' ? 'H' : it.priority === 'Low' ? 'L' : 'M'}</span>
                            <span className="chip-title">{isMeeting ? '[M] ' : ''}{it.title}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > 2 && (
                        <span className="cal-tasks-more">+{dayItems.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Schedule / Tasks Pane */}
          <div className="date-tasks-pane">
            <div className="pane-header">
              <div>
                <h3>Schedule for: <span>{selectedDate || 'All Dates'}</span></h3>
                <span className="task-count">{filteredAndSortedItems.length} item(s)</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-outline" onClick={() => handleOpenCreateTask(selectedDate)}>
                  + Task
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => handleOpenCreateMeeting(selectedDate)}>
                  + Meeting
                </button>
              </div>
            </div>

            {filteredAndSortedItems.length === 0 ? (
              <div className="empty-day-state">
                <p>Nothing scheduled for this date.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleOpenCreateTask(selectedDate)}>
                    Add Task
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleOpenCreateMeeting(selectedDate)}>
                    Schedule Meeting
                  </button>
                </div>
              </div>
            ) : (
              <div className="day-tasks-list">
                {filteredAndSortedItems.map((item) => {
                  const isMeeting = Boolean(item.link || (item.attendees && item.attendees.trim() !== ''));
                  return (
                    <div key={item.id} className={`task-item ${item.status === 'Completed' ? 'task-completed' : ''}`}>
                      <div className="task-main">
                        <div className="task-header-line">
                          <span className="task-time">{item.time}</span>
                          <span className={`priority-tag priority-${(item.priority || 'medium').toLowerCase()}`}>
                            {item.priority || 'Medium'} Priority
                          </span>
                          <span className="task-status-tag">{isMeeting ? 'Meeting' : 'Task'}</span>
                          <span className="task-status-tag">{item.status === 'Completed' ? 'Completed' : 'Pending'}</span>
                        </div>

                        <h4 className="task-title">{item.title}</h4>

                        {item.notes && (
                          <div className="task-discussion-box">
                            <p>{item.notes}</p>
                          </div>
                        )}

                        {item.attendees && (
                          <div className="task-attendees">Attendees: {item.attendees}</div>
                        )}

                        {item.link && (
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="meet-link"
                          >
                            Join Meeting Link
                          </a>
                        )}
                      </div>

                      <div className="task-actions">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleToggleStatus(item)}
                        >
                          {item.status === 'Completed' ? 'Mark Pending' : 'Mark Done'}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-wrapper">
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Title</th>
                <th>Attendees / Details</th>
                <th>Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">No items found.</td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const isMeeting = Boolean(item.link || (item.attendees && item.attendees.trim() !== ''));
                  return (
                    <tr key={item.id} className={item.status === 'Completed' ? 'task-completed' : ''}>
                      <td className="td-datetime">
                        <strong>{item.date}</strong>
                        <small>{item.time}</small>
                      </td>
                      <td>
                        <span className="task-status-tag">{isMeeting ? 'Meeting' : 'Task'}</span>
                      </td>
                      <td>
                        <span className={`priority-tag priority-${(item.priority || 'medium').toLowerCase()}`}>
                          {item.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="td-title">{item.title}</td>
                      <td className="td-notes" title={item.notes || item.attendees}>
                        {item.attendees ? `Attendees: ${item.attendees}` : item.notes || '—'}
                      </td>
                      <td>
                        {item.link ? (
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="meet-link"
                          >
                            Join
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className="status-badge">{item.status === 'Completed' ? 'Completed' : 'Pending'}</span>
                      </td>
                      <td className="td-actions">
                        <button className="btn-link-action" onClick={() => handleToggleStatus(item)}>
                          {item.status === 'Completed' ? 'Undo' : 'Done'}
                        </button>
                        <button className="btn-link-action" onClick={() => handleOpenEdit(item)}>
                          Edit
                        </button>
                        <button className="btn-link-action" onClick={() => handleDelete(item.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="meetings-grid">
          {filteredAndSortedItems.length === 0 ? (
            <div className="empty-state">No items found.</div>
          ) : (
            filteredAndSortedItems.map((item) => {
              const isMeeting = Boolean(item.link || (item.attendees && item.attendees.trim() !== ''));
              return (
                <div key={item.id} className={`meeting-card ${item.status === 'Completed' ? 'task-completed' : ''}`}>
                  <div className="card-top">
                    <span className="badge-datetime">{item.date} at {item.time}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="task-status-tag">{isMeeting ? 'Meeting' : 'Task'}</span>
                      <span className={`priority-tag priority-${(item.priority || 'medium').toLowerCase()}`}>
                        {item.priority || 'Medium'}
                      </span>
                    </div>
                  </div>

                  <h3 className="card-title">{item.title}</h3>

                  {item.notes && (
                    <div className="task-discussion-box">
                      <p>{item.notes}</p>
                    </div>
                  )}

                  {item.attendees && (
                    <p className="card-field">
                      <strong>Attendees:</strong> {item.attendees}
                    </p>
                  )}

                  {item.link && (
                    <p className="card-field">
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="meet-link"
                      >
                        Join Meeting Link
                      </a>
                    </p>
                  )}

                  <div className="card-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleToggleStatus(item)}
                    >
                      {item.status === 'Completed' ? 'Mark Pending' : 'Mark Done'}
                    </button>
                    <div className="actions-right">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleOpenEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Slide-out Drawer for Add and Edit */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={handleCloseDrawer}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>
                {editingId
                  ? formType === 'meeting' ? 'Edit Meeting Details' : 'Edit Task Details'
                  : formType === 'meeting' ? 'Schedule New Meeting' : 'Add New Task'}
              </h2>
              <button className="close-btn" onClick={handleCloseDrawer}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="drawer-form">
              <div className="form-group">
                <label>{formType === 'meeting' ? 'Meeting Title *' : 'Task Title *'}</label>
                <input
                  type="text"
                  required
                  placeholder={
                    formType === 'meeting'
                      ? 'e.g., Sprint Planning, Townhall, Client Review'
                      : 'e.g., Complete project report, Review PRs'
                  }
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 10:00 AM, 02:30 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {formType === 'meeting' && (
                <>
                  <div className="form-group">
                    <label>Meeting Link (Google Meet / Zoom)</label>
                    <input
                      type="text"
                      placeholder="https://meet.google.com/..."
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Attendees</label>
                    <input
                      type="text"
                      placeholder="e.g., Sagar (Host), Priya Sharma, Rohan Gupta"
                      value={formData.attendees}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>{formType === 'meeting' ? 'Discussion Agenda / Notes' : 'Task Description / Notes'}</label>
                <textarea
                  rows="4"
                  placeholder={
                    formType === 'meeting'
                      ? 'Add key agenda points, topics to discuss...'
                      : 'Add details, steps, or requirements for this task...'
                  }
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId
                    ? 'Save Changes'
                    : formType === 'meeting'
                    ? 'Schedule Meeting'
                    : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
