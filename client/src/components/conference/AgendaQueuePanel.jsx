import React, { useState } from 'react';

export const AgendaQueuePanel = ({
  agendaState,
  speakerState,
  isHost,
  localPeerId,
  isLocalHandRaised,
  onToggleRaiseHand,
}) => {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDuration, setNewTopicDuration] = useState('10');
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'speakers'

  const {
    agendaItems,
    activeTopicIndex,
    activeTopic,
    isTimerActive,
    isOvertime,
    progressPercent,
    formatTimeRemaining,
    startTimer,
    pauseTimer,
    resetTopicTimer,
    selectTopic,
    nextTopic,
    prevTopic,
    toggleTopicCompleted,
    addTopic,
    removeTopic,
    completedCount,
    totalAllocatedMinutes,
  } = agendaState;

  const {
    speakerQueue,
    activeSpeaker,
    formatSpeakerRemaining,
    giveFloor,
    passToNextSpeaker,
    clearFloor,
  } = speakerState;

  const handleAddTopicSubmit = (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    addTopic(newTopicTitle, parseInt(newTopicDuration, 10) || 5);
    setNewTopicTitle('');
  };

  const isLocalOnFloor = activeSpeaker?.peerId === localPeerId;

  return (
    <div className="agenda-queue-panel">
      {/* Sub-Tabs Switcher */}
      <div className="agenda-tabs-header">
        <button
          type="button"
          className={`agenda-subtab-btn ${activeTab === 'agenda' ? 'active' : ''}`}
          onClick={() => setActiveTab('agenda')}
        >
          <span className="material-symbols-outlined">checklist</span>
          <span>Agenda & Timebox ({completedCount}/{agendaItems.length})</span>
        </button>
        <button
          type="button"
          className={`agenda-subtab-btn ${activeTab === 'speakers' ? 'active' : ''}`}
          onClick={() => setActiveTab('speakers')}
        >
          <span className="material-symbols-outlined">record_voice_over</span>
          <span>Speaker Queue {speakerQueue.length > 0 && `(${speakerQueue.length})`}</span>
          {activeSpeaker && <span className="tab-live-dot"></span>}
        </button>
      </div>

      {activeTab === 'agenda' ? (
        /* Agenda & Timebox Section */
        <div className="agenda-section-scroll">
          {/* Active Topic Hero Card */}
          {activeTopic && (
            <div className={`active-topic-card ${isOvertime ? 'is-overtime' : ''}`}>
              <div className="active-topic-badge-row">
                <span className="topic-order-badge">
                  Topic {activeTopicIndex + 1} of {agendaItems.length}
                </span>
                {isOvertime ? (
                  <span className="topic-status-chip overtime">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                    <span>OVERTIME</span>
                  </span>
                ) : (
                  <span className="topic-status-chip in-progress">
                    <span className="live-dot-green"></span>
                    <span>IN PROGRESS</span>
                  </span>
                )}
              </div>

              <h4 className="active-topic-title">{activeTopic.title}</h4>

              {/* Countdown Timer Display */}
              <div className="timebox-timer-row">
                <div className={`timebox-digital-clock ${isOvertime ? 'overtime' : ''}`}>
                  <span className="material-symbols-outlined clock-icon">
                    {isOvertime ? 'timer_off' : 'timer'}
                  </span>
                  <span className="clock-digits">{formatTimeRemaining()}</span>
                  <span className="clock-label">{isOvertime ? 'over budget' : 'remaining'}</span>
                </div>

                <div className="timebox-controls-group">
                  <button
                    type="button"
                    className={`btn-timebox-action ${isTimerActive ? 'is-running' : 'is-paused'}`}
                    onClick={isTimerActive ? pauseTimer : startTimer}
                    title={isTimerActive ? 'Pause timebox timer' : 'Start timebox timer'}
                  >
                    <span className="material-symbols-outlined">
                      {isTimerActive ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-timebox-action"
                    onClick={() => resetTopicTimer()}
                    title="Reset topic timer"
                  >
                    <span className="material-symbols-outlined">restart_alt</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="timebox-progress-track">
                <div
                  className={`timebox-progress-bar ${isOvertime ? 'overtime' : ''}`}
                  style={{ width: isOvertime ? '100%' : `${progressPercent}%` }}
                />
              </div>

              {/* Navigation Steps */}
              <div className="topic-step-nav">
                <button
                  type="button"
                  className="btn-step-topic"
                  onClick={prevTopic}
                  disabled={activeTopicIndex === 0}
                  title="Previous topic"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="btn-step-topic btn-next-topic"
                  onClick={nextTopic}
                  disabled={activeTopicIndex === agendaItems.length - 1}
                  title="Complete & advance to next topic"
                >
                  <span>Next Topic</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}

          {/* Agenda Checklist */}
          <div className="agenda-list-group">
            <div className="agenda-list-header">
              <h5>Agenda Discussion Topics</h5>
              <span className="agenda-budget-pill">{totalAllocatedMinutes} mins budgeted</span>
            </div>

            <div className="agenda-items-container">
              {agendaItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`agenda-item-row ${idx === activeTopicIndex ? 'is-active' : ''} ${item.isCompleted ? 'is-done' : ''}`}
                  onClick={() => selectTopic(idx)}
                >
                  <button
                    type="button"
                    className="btn-toggle-done"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTopicCompleted(item.id);
                    }}
                    title={item.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  >
                    <span className="material-symbols-outlined">
                      {item.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>

                  <div className="agenda-item-info">
                    <span className="agenda-item-text">{item.title}</span>
                    <span className="agenda-item-duration">{item.durationMinutes} min timebox</span>
                  </div>

                  {idx === activeTopicIndex && (
                    <span className="active-tag">Active</span>
                  )}

                  {agendaItems.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-topic"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTopic(item.id);
                      }}
                      title="Delete topic"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Add Topic Input */}
            <form onSubmit={handleAddTopicSubmit} className="add-topic-form">
              <input
                type="text"
                placeholder="+ Add discussion topic..."
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
              <select
                value={newTopicDuration}
                onChange={(e) => setNewTopicDuration(e.target.value)}
                title="Duration in minutes"
              >
                <option value="5">5m</option>
                <option value="10">10m</option>
                <option value="15">15m</option>
                <option value="20">20m</option>
                <option value="30">30m</option>
              </select>
              <button
                type="submit"
                disabled={!newTopicTitle.trim()}
                title="Add topic to meeting agenda"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Speaker Queue & Turn Management Section */
        <div className="speakers-section-scroll">
          {/* Active on the Floor Hero Banner */}
          <div className={`active-floor-banner ${activeSpeaker ? 'has-speaker' : 'floor-open'}`}>
            <div className="floor-banner-header">
              <span className="material-symbols-outlined floor-icon">record_voice_over</span>
              <div>
                <h5>Current Speaker on Floor</h5>
                <p>
                  {activeSpeaker
                    ? isLocalOnFloor
                      ? 'You currently have the floor'
                      : `${activeSpeaker.name} has the floor`
                    : 'The floor is currently open for discussion'}
                </p>
              </div>
            </div>

            {activeSpeaker ? (
              <div className="floor-speaker-details">
                <div className="speaker-name-row">
                  <span className="speaker-name-highlight">{activeSpeaker.name}</span>
                  {activeSpeaker.officeId && (
                    <span className="speaker-office-tag">ID: {activeSpeaker.officeId}</span>
                  )}
                </div>

                <div className="floor-timer-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>hourglass_bottom</span>
                  <span>Turn remaining: <strong>{formatSpeakerRemaining()}</strong></span>
                </div>

                {isHost && (
                  <div className="floor-host-actions">
                    <button
                      type="button"
                      className="btn-pass-next"
                      onClick={() => passToNextSpeaker()}
                      title="Advance floor to next queued speaker"
                    >
                      <span className="material-symbols-outlined">skip_next</span>
                      <span>Pass to Next</span>
                    </button>
                    <button
                      type="button"
                      className="btn-release-floor"
                      onClick={clearFloor}
                      title="End current turn and open floor"
                    >
                      <span className="material-symbols-outlined">stop_circle</span>
                      <span>Open Floor</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="floor-open-prompt">
                <span>Raise your hand to request a turn to speak.</span>
              </div>
            )}
          </div>

          {/* User's Hand Raise Quick Action */}
          <div className="local-queue-action-box">
            <button
              type="button"
              className={`btn-queue-raise ${isLocalHandRaised ? 'is-raised' : ''}`}
              onClick={onToggleRaiseHand}
            >
              <span className="material-symbols-outlined">front_hand</span>
              <span>{isLocalHandRaised ? 'Lower My Hand (Leave Queue)' : 'Raise Hand to Request Floor'}</span>
            </button>
          </div>

          {/* FIFO Speaker Queue List */}
          <div className="speaker-queue-list-section">
            <div className="queue-header-row">
              <h5>Waiting Speaker Queue ({speakerQueue.length})</h5>
              {isHost && speakerQueue.length > 0 && (
                <button
                  type="button"
                  className="btn-clear-queue"
                  onClick={() => passToNextSpeaker()}
                  title="Give floor to next in queue"
                >
                  <span>Call Next</span>
                </button>
              )}
            </div>

            {speakerQueue.length === 0 ? (
              <div className="queue-empty-state">
                <span className="material-symbols-outlined">pan_tool</span>
                <p>No hands raised in the queue</p>
                <span>Participants who raise their hand will queue here in order.</span>
              </div>
            ) : (
              <div className="queue-cards-list">
                {speakerQueue.map((peer, idx) => {
                  const isSelf = peer.peerId === localPeerId;
                  return (
                    <div
                      key={peer.peerId}
                      className={`queue-card-item ${isSelf ? 'is-self' : ''}`}
                    >
                      <div className="queue-order-badge">#{idx + 1}</div>
                      <div className="queue-peer-info">
                        <span className="queue-peer-name">
                          {peer.name} {isSelf ? '(You)' : ''}
                        </span>
                        {peer.officeId && (
                          <span className="queue-peer-office">ID: {peer.officeId}</span>
                        )}
                      </div>

                      {isHost && (
                        <button
                          type="button"
                          className="btn-give-floor"
                          onClick={() => giveFloor(peer)}
                          title={`Grant the floor to ${peer.name}`}
                        >
                          <span className="material-symbols-outlined">mic</span>
                          <span>Give Floor</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaQueuePanel;
