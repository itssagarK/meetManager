import React from 'react';

export const DayScheduleSidebar = ({
  selectedDate,
  handleOpenCreateTask,
  handleOpenCreateMeeting,
  dayScheduleItems = [],
  isMeeting,
  handleToggleStatus,
  handleMoveToTomorrow,
  handleAddToGoogleCalendar,
  handleCopyMeetingInvite,
  handleConvertNotesToTasks,
  handleOpenEdit,
  handleDelete,
}) => {
  return (
    <div className="schedule-card">
      <div className="schedule-card-header">
        <div>
          <span style={{ fontSize: '12px', fontWeight: '700' }}>Schedule for:</span>
          <h3 className="schedule-date-title">{selectedDate}</h3>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="cal-nav-btn" onClick={() => handleOpenCreateTask(selectedDate)} title="Add Task">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-blue)' }}>add</span>
          </button>
          <button className="cal-nav-btn" onClick={() => handleOpenCreateMeeting(selectedDate)} title="Schedule Meeting">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>event</span>
          </button>
        </div>
      </div>

      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
        {dayScheduleItems.length} item(s) scheduled
      </div>

      {dayScheduleItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px' }}>
            event_busy
          </span>
          <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '700' }}>Nothing scheduled for this date.</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="btn-blue" onClick={() => handleOpenCreateTask(selectedDate)}>
              + Task
            </button>
            <button className="btn-green" onClick={() => handleOpenCreateMeeting(selectedDate)}>
              + Meeting
            </button>
          </div>
        </div>
      ) : (
        <div>
          {dayScheduleItems.map((it) => {
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

                <h4 className="item-title">{it.title}</h4>
                {it.notes && <p className="item-desc">{it.notes}</p>}

                {it.attendees && (
                  <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                    {it.attendees}
                  </div>
                )}

                <div className="item-footer">
                  <div className="item-footer-meta">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                    <span>{it.time}</span>
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
          })}
        </div>
      )}
    </div>
  );
};

export default DayScheduleSidebar;
