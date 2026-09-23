import { useState, useEffect } from 'react';
import './App.css';

const API_URL = '/api/meetings';

const initialFormData = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '10:00 AM',
  link: '',
  attendees: '',
  notes: '',
  priority: 'High',
  status: 'Upcoming',
};

function App() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);

  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setMeetings(data);
      setServerOnline(true);
    } catch (err) {
      console.error('Failed to load meetings:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleAddSaturdayTownhall = () => {
    let targetDate = selectedDate;
    const dateObj = new Date(targetDate);
    if (dateObj.getDay() !== 6) {
      const daysUntilSaturday = (6 - dateObj.getDay() + 7) % 7 || 7;
      dateObj.setDate(dateObj.getDate() + daysUntilSaturday);
      targetDate = dateObj.toISOString().split('T')[0];
    }

    setEditingId(null);
    setFormData({
      title: 'Saturday Townhall',
      date: targetDate,
      time: '11:00 PM',
      link: 'https://meet.google.com/townhall',
      attendees: 'Sagar (Host), Vikram Malhotra, Neha Patel, All Hands',
      notes: 'Weekly townhall: Review milestones, key achievements, deliverables, and open Q&A.',
      priority: 'High',
      status: 'Upcoming',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenCreate = (prefillDate = null) => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      date: prefillDate || selectedDate || initialFormData.date,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (meeting) => {
    setEditingId(meeting.id);
    setFormData({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      link: meeting.link || '',
      attendees: meeting.attendees || '',
      notes: meeting.notes || '',
      priority: meeting.priority || 'Medium',
      status: meeting.status || 'Upcoming',
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
        alert(`Error: ${errorData.error || 'Failed to save meeting'}`);
        return;
      }

      handleCloseDrawer();
      fetchMeetings();
    } catch (err) {
      alert('Could not reach backend server. Please verify the server is running.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchMeetings();
    } catch (err) {
      console.error('Error deleting meeting:', err);
    }
  };

  const handleToggleStatus = async (meeting) => {
    const nextStatus = meeting.status === 'Completed' ? 'Upcoming' : 'Completed';
    try {
      await fetch(`${API_URL}/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meeting, status: nextStatus }),
      });
      fetchMeetings();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // calendar calculations
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePrevMonth = () => setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1));
  const handleNextMonth = () => setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1));

  const meetingsByDate = meetings.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.attendees && m.attendees.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesDate = viewMode === 'calendar' && selectedDate ? m.date === selectedDate : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalCount = meetings.length;
  const upcomingCount = meetings.filter((m) => m.status === 'Upcoming').length;
  const completedCount = meetings.filter((m) => m.status === 'Completed').length;

  return (
    <div className="app-container">
      {/* header */}
      <header className="app-header">
        <div>
          <h1>MeetManager</h1>
          <p className="subtitle">Keep track of meetings and action items</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleAddSaturdayTownhall}>
            + Saturday Townhall (11:00 PM)
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenCreate(selectedDate)}>
            + Schedule Meeting
          </button>
        </div>
      </header>

      {/* metrics summary */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Total Meetings</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming Meetings</span>
          <span className="stat-value text-blue">{upcomingCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{completedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Database Connection</span>
          <span className={`status-pill ${serverOnline ? 'online' : 'offline'}`}>
            {serverOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* view controls & filters */}
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
          placeholder="Search by title, attendees, or discussion..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-group">
          {['All', 'Upcoming', 'Completed'].map((status) => (
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

      {/* calendar view */}
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
                const dayMeetings = meetingsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div
                    key={dateStr}
                    className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className="day-number">{dayNum}</span>
                    {dayMeetings.length > 0 && (
                      <span className="meeting-indicator">
                        {dayMeetings.length}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* day schedule pane */}
          <div className="date-tasks-pane">
            <div className="pane-header">
              <div>
                <h3>Schedule: <span>{selectedDate || 'All Dates'}</span></h3>
                <span className="task-count">{filteredMeetings.length} meeting(s)</span>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => handleOpenCreate(selectedDate)}>
                + Add for this date
              </button>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="empty-day-state">
                <p>No meetings scheduled for this date.</p>
                <button className="btn btn-sm btn-secondary" onClick={() => handleOpenCreate(selectedDate)}>
                  Schedule meeting
                </button>
              </div>
            ) : (
              <div className="day-tasks-list">
                {filteredMeetings.map((meeting) => (
                  <div key={meeting.id} className="task-item">
                    <div className="task-main">
                      <div className="task-header-line">
                        <span className="task-time">{meeting.time}</span>
                        <span className="priority-tag">{meeting.priority || 'Medium'} Priority</span>
                        <span className="task-status-tag">{meeting.status}</span>
                      </div>

                      <h4 className="task-title">{meeting.title}</h4>

                      {meeting.notes && (
                        <div className="task-discussion-box">
                          <div className="discussion-heading">Key Discussion & Action Items:</div>
                          <p>{meeting.notes}</p>
                        </div>
                      )}

                      {meeting.attendees && (
                        <div className="task-attendees">Attendees: {meeting.attendees}</div>
                      )}

                      {meeting.link && (
                        <a
                          href={meeting.link.startsWith('http') ? meeting.link : `https://${meeting.link}`}
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
                        onClick={() => handleToggleStatus(meeting)}
                      >
                        {meeting.status === 'Completed' ? 'Mark Upcoming' : 'Mark Done'}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleOpenEdit(meeting)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(meeting.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* table view */}
      {viewMode === 'table' && (
        <div className="table-wrapper">
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Key Discussion / Action Items</th>
                <th>Attendees</th>
                <th>Meeting Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">No meetings found.</td>
                </tr>
              ) : (
                filteredMeetings.map((m) => (
                  <tr key={m.id}>
                    <td className="td-datetime">
                      <strong>{m.date}</strong>
                      <small>{m.time}</small>
                    </td>
                    <td className="td-title">{m.title}</td>
                    <td>
                      <span className="priority-tag">{m.priority || 'Medium'}</span>
                    </td>
                    <td className="td-notes" title={m.notes}>
                      {m.notes || '—'}
                    </td>
                    <td className="td-attendees">{m.attendees || '—'}</td>
                    <td>
                      {m.link ? (
                        <a
                          href={m.link.startsWith('http') ? m.link : `https://${m.link}`}
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
                      <span className="status-badge">{m.status}</span>
                    </td>
                    <td className="td-actions">
                      <button className="btn-link-action" onClick={() => handleToggleStatus(m)}>
                        {m.status === 'Completed' ? 'Undo' : 'Done'}
                      </button>
                      <button className="btn-link-action" onClick={() => handleOpenEdit(m)}>
                        Edit
                      </button>
                      <button className="btn-link-action" onClick={() => handleDelete(m.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* cards view */}
      {viewMode === 'cards' && (
        <div className="meetings-grid">
          {filteredMeetings.length === 0 ? (
            <div className="empty-state">No meetings found.</div>
          ) : (
            filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="meeting-card">
                <div className="card-top">
                  <span className="badge-datetime">{meeting.date} at {meeting.time}</span>
                  <span className="priority-tag">{meeting.priority || 'Medium'}</span>
                </div>

                <h3 className="card-title">{meeting.title}</h3>

                {meeting.notes && (
                  <div className="task-discussion-box">
                    <div className="discussion-heading">Key Discussion & Action Items:</div>
                    <p>{meeting.notes}</p>
                  </div>
                )}

                {meeting.attendees && (
                  <p className="card-field">
                    <strong>Attendees:</strong> {meeting.attendees}
                  </p>
                )}

                {meeting.link && (
                  <p className="card-field">
                    <a
                      href={meeting.link.startsWith('http') ? meeting.link : `https://${meeting.link}`}
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
                    onClick={() => handleToggleStatus(meeting)}
                  >
                    {meeting.status === 'Completed' ? 'Mark Upcoming' : 'Mark Done'}
                  </button>
                  <div className="actions-right">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenEdit(meeting)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* slide-out drawer */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={handleCloseDrawer}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>{editingId ? 'Edit Meeting Details' : 'Schedule New Meeting'}</h2>
              <button className="close-btn" onClick={handleCloseDrawer}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="drawer-form">
              <div className="form-group">
                <label>Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sprint Planning, Townhall"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="label-bold">Key Discussion & Action Items *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Points to discuss, decisions to remember, next steps..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    placeholder="11:00 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
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
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

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
                  placeholder="e.g., Sagar, Priya Sharma, Rohan Gupta, Dev Team"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                />
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Schedule Meeting'}
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
