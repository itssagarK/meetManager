import React from 'react';

export const ItemDrawer = ({
  isOpen,
  onClose,
  drawerType = 'task', // 'task' | 'meeting'
  editingId,
  formData,
  setFormData,
  onSubmit,
  onAutoDetectCallLink,
}) => {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>
            {editingId
              ? drawerType === 'meeting' ? 'Edit Meeting Details' : 'Edit Task Details'
              : drawerType === 'meeting' ? 'Schedule Meeting' : 'Add New Task'}
          </h3>
          <button className="close-drawer-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>{drawerType === 'meeting' ? 'Meeting Subject *' : 'Task Title *'}</label>
            <input
              type="text"
              required
              placeholder={drawerType === 'meeting' ? 'e.g., Executive Strategy Alignment' : 'e.g., Complete Budget Analysis'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label>Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>{drawerType === 'meeting' ? 'Time Slot *' : 'Due Time *'}</label>
              <input
                type="text"
                required
                placeholder="e.g., 10:00 AM, 02:00 PM - 03:30 PM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label>Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="High">High Priority (Red)</option>
                <option value="Medium">Medium Priority (Blue)</option>
                <option value="Low">Low Priority (Black)</option>
              </select>
            </div>

            <div className="form-field">
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

          {drawerType === 'meeting' && (
            <>
              <div className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Meeting Link (Google Meet / Zoom)</label>
                  {onAutoDetectCallLink && (
                    <button
                      type="button"
                      className="btn-link-detect"
                      onClick={onAutoDetectCallLink}
                      title="Grab meeting URL from active browser tab or clipboard"
                    >
                      Grab Active Tab / Link
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Attendees</label>
                <input
                  type="text"
                  placeholder="e.g. dev@company.com, client@partner.org"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                />
                <div className="form-field-hint">
                  Enter email addresses separated by commas to send auto-notifications
                </div>
              </div>

              <div className="form-field email-invite-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.sendEmailInvites !== false}
                    onChange={(e) => setFormData({ ...formData, sendEmailInvites: e.target.checked })}
                  />
                  <span>Send automated email invitations &amp; .ics calendar invites</span>
                </label>
              </div>
            </>
          )}

          <div className="form-field">
            <label>{drawerType === 'meeting' ? 'Agenda & Notes' : 'Description / Notes'}</label>
            <textarea
              rows="4"
              placeholder="Add details, steps, or discussion agenda..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={drawerType === 'meeting' ? 'btn-green' : 'btn-blue'}
            >
              {editingId
                ? 'Save Changes'
                : drawerType === 'meeting'
                ? 'Schedule Meeting'
                : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemDrawer;
