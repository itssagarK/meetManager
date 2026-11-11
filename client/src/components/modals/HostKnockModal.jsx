import React from 'react';

export const HostKnockModal = ({
  pendingKnocks = [],
  handleAdmitGuest,
  handleDenyGuest,
}) => {
  if (!pendingKnocks || pendingKnocks.length === 0) return null;

  return (
    <div className="host-knock-modal-overlay">
      <div className="host-knock-card">
        <div className="host-knock-header">
          <span className="material-symbols-outlined knock-bell-icon">badge</span>
          <div>
            <h3>Guest Requesting Admission ({pendingKnocks.length})</h3>
            <p>Verify Office ID and Full Name before admitting</p>
          </div>
        </div>
        <div className="host-knock-body">
          {pendingKnocks.map((k) => (
            <div key={k.id} className="knock-item-row">
              <div className="knock-guest-info">
                <div className="knock-guest-name-row">
                  <span className="knock-guest-name">{k.name}</span>
                  <span className="knock-office-badge">ID: {k.officeId}</span>
                </div>
                <span className="knock-room-tag">Room: {k.roomId}</span>
              </div>
              <div className="knock-actions">
                <button
                  type="button"
                  className="btn-admit-guest"
                  onClick={() => handleAdmitGuest(k.id, k.roomId)}
                  title="Admit guest into meeting"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>how_to_reg</span>
                  <span>Admit</span>
                </button>
                <button
                  type="button"
                  className="btn-deny-guest"
                  onClick={() => handleDenyGuest(k.id, k.roomId)}
                  title="Decline guest admission"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HostKnockModal;
