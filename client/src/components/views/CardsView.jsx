import React from 'react';

export const CardsView = ({
  filteredAndSortedItems = [],
  handleOpenEdit,
  handleToggleStatus,
  handleMoveToTomorrow,
  handleAddToGoogleCalendar,
  handleCopyMeetingInvite,
  handleConvertNotesToTasks,
  handleDelete,
  isMeeting,
}) => {
  return (
    <div className="cards-view-grid">
      {filteredAndSortedItems.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', border: '1.5px solid var(--border-black)', borderRadius: '8px' }}>
          No items found matching the selected filters.
        </div>
      ) : (
        filteredAndSortedItems.map((it) => {
          const itMeeting = isMeeting ? isMeeting(it) : it.type === 'meeting';
          return (
            <div key={it.id} className={`schedule-item ${itMeeting ? 'meeting-border' : 'task-border'}`}>
              <div className="item-tags-row">
                <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                  {itMeeting ? 'Meeting' : 'Task'}
                </span>
                <span className={`priority-chip ${(it.priority || 'medium').toLowerCase()}`}>
                  {it.priority || 'Medium'} Priority
                </span>
              </div>

              <h3 className="item-title">{it.title}</h3>
              {it.notes && <p className="item-desc">{it.notes}</p>}

              {it.attendees && (
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                  <strong>Attendees:</strong> {it.attendees}
                </div>
              )}

              <div className="item-footer">
                <div className="item-footer-meta">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                  <span>{it.date} at {it.time}</span>
                </div>
                <div className="item-footer-actions">
                  <div className="actions-primary">
                    <button className="item-btn green" onClick={() => handleToggleStatus(it)}>
                      {it.status === 'Completed' ? 'Undo' : 'Done'}
                    </button>
                    {itMeeting && it.link && (
                      <a
                        href={it.link.startsWith('http') ? it.link : `https://${it.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="item-btn green join-link"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>videocam</span>
                        <span>Join</span>
                      </a>
                    )}
                    {!itMeeting && (
                      <button className="item-btn primary" onClick={() => handleMoveToTomorrow(it)}>
                        → Tomorrow
                      </button>
                    )}
                  </div>
                  <div className="actions-utility">
                    {itMeeting && (
                      <>
                        <button className="item-btn white compact" onClick={() => handleAddToGoogleCalendar(it)} title="Add to Google Calendar">
                          + GCal
                        </button>
                        <button className="item-btn white compact" onClick={() => handleCopyMeetingInvite(it)} title="Copy Invite">
                          Copy
                        </button>
                        {it.notes && (
                          <button
                            className="item-btn white compact"
                            onClick={() => handleConvertNotesToTasks(it)}
                            title="Extract notes into tasks for tomorrow"
                          >
                            Notes → Tasks
                          </button>
                        )}
                      </>
                    )}
                    <button className="item-btn white compact" onClick={() => handleOpenEdit(it)}>
                      Edit
                    </button>
                    <button className="item-btn danger compact" onClick={() => handleDelete(it.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CardsView;
