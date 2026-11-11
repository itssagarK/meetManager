import React from 'react';

export const TableView = ({
  filteredAndSortedItems = [],
  selectedDate,
  handleOpenCreateTask,
  handleOpenCreateMeeting,
  handleOpenEdit,
  handleToggleStatus,
  handleMoveToTomorrow,
  handleAddToGoogleCalendar,
  handleDelete,
  isMeeting,
}) => {
  return (
    <div className="master-table-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>All Tasks &amp; Meetings Table</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-blue" onClick={() => handleOpenCreateTask(selectedDate)}>
            + Add Task
          </button>
          <button className="btn-green" onClick={() => handleOpenCreateMeeting(selectedDate)}>
            + Schedule Meeting
          </button>
        </div>
      </div>

      <table className="master-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Date &amp; Time</th>
            <th>Attendees / Link</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedItems.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '32px', fontWeight: '600' }}>
                No scheduled items found.
              </td>
            </tr>
          ) : (
            filteredAndSortedItems.map((it) => {
              const itMeeting = isMeeting ? isMeeting(it) : it.type === 'meeting';
              return (
                <tr key={it.id}>
                  <td style={{ fontWeight: '700' }}>{it.title}</td>
                  <td>
                    <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                      {itMeeting ? 'Meeting' : 'Task'}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-chip ${(it.priority || 'medium').toLowerCase()}`}>
                      {it.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <strong>{it.date}</strong>
                    <div><small>{it.time}</small></div>
                  </td>
                  <td>
                    {it.link ? (
                      <a href={it.link.startsWith('http') ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer" className="item-link-btn">
                        Join Link
                      </a>
                    ) : it.attendees ? (
                      <small>{it.attendees}</small>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: it.status === 'Completed' ? 'var(--color-green)' : 'var(--color-black)' }}>
                      {it.status === 'Completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-cell">
                      <button className="item-btn green compact" onClick={() => handleToggleStatus(it)}>
                        {it.status === 'Completed' ? 'Undo' : 'Done'}
                      </button>
                      {!itMeeting ? (
                        <button className="item-btn primary compact" onClick={() => handleMoveToTomorrow(it)}>
                          → Tomorrow
                        </button>
                      ) : (
                        <button className="item-btn white compact" onClick={() => handleAddToGoogleCalendar(it)} title="Add to Google Calendar">
                          + GCal
                        </button>
                      )}
                      <button className="item-btn white compact" onClick={() => handleOpenEdit(it)}>
                        Edit
                      </button>
                      <button className="item-btn danger compact" onClick={() => handleDelete(it.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
