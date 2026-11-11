import React from 'react';

export const CalendarView = ({
  calMonth,
  calYear,
  monthNames,
  monthTasksCount = 0,
  monthMeetingsCount = 0,
  handlePrevPeriod,
  handleNextPeriod,
  setCurrentCalendarDate,
  setSelectedDate,
  todayStr,
  calSubView = 'month',
  setCalSubView,
  firstDayIndex = 0,
  daysInMonth = 30,
  itemsByDate = {},
  priorityOrder = {},
  selectedDate,
  isMeeting,
  handleOpenCreateTask,
  activeWeekDates = [],
  handleOpenEdit,
  monthCompletionPercent = 0,
  monthCompletedCount = 0,
  monthItems = [],
}) => {
  return (
    <div className="calendar-card">
      {/* Executive Calendar Top Bar */}
      <div className="calendar-top">
        <div className="cal-header-left">
          <h2>{monthNames ? monthNames[calMonth] : ''} {calYear}</h2>
          <div className="cal-load-chip">
            <span>{monthTasksCount} Tasks</span>
            <span className="chip-dot">•</span>
            <span>{monthMeetingsCount} Meetings</span>
          </div>
        </div>

        <div className="cal-header-actions">
          <div className="cal-nav-group">
            <button type="button" className="cal-nav-btn" onClick={handlePrevPeriod} title="Previous Period">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() => {
                if (setCurrentCalendarDate) setCurrentCalendarDate(new Date());
                if (setSelectedDate) setSelectedDate(todayStr);
              }}
            >
              Today
            </button>
            <button type="button" className="cal-nav-btn" onClick={handleNextPeriod} title="Next Period">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Sub-View Switcher: Month vs. Week */}
          <div className="cal-view-segmented">
            <button
              type="button"
              className={`cal-view-btn ${calSubView === 'month' ? 'active' : ''}`}
              onClick={() => setCalSubView('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`cal-view-btn ${calSubView === 'week' ? 'active' : ''}`}
              onClick={() => setCalSubView('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Month Grid View */}
      {calSubView === 'month' && (
        <>
          <div className="calendar-weekdays-grid">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="calendar-matrix">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-matrix-day empty"></div>
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
              const isToday = todayStr === dateStr;
              const hasTask = dayItems.some((it) => !isMeeting(it));
              const hasMeeting = dayItems.some(isMeeting);
              const hasUrgent = dayItems.some((it) => it.priority === 'High');

              return (
                <div
                  key={dateStr}
                  className={`cal-matrix-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className="cal-day-header">
                    <div className="cal-day-header-left">
                      <span className="day-header-number">{dayNum}</span>
                      {/* Density Meter Dots */}
                      <div className="cal-density-dots">
                        {hasTask && <span className="density-dot task"></span>}
                        {hasMeeting && <span className="density-dot meeting"></span>}
                        {hasUrgent && <span className="density-dot urgent"></span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cal-day-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(dateStr);
                        handleOpenCreateTask(dateStr);
                      }}
                      title={`Add task on ${dateStr}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="cal-day-badges-stack">
                    {dayItems.slice(0, 2).map((it) => {
                      const itMeeting = isMeeting(it);
                      const isUrgent = it.priority === 'High';
                      return (
                        <span
                          key={it.id}
                          className={`cal-badge ${isUrgent ? 'urgent' : itMeeting ? 'meeting' : 'task'}`}
                          title={`${it.time} - ${it.title}`}
                        >
                          {itMeeting ? '[M] ' : ''}{it.title}
                        </span>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <span className="cal-badge-more">
                        +{dayItems.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 7-Day Executive Week Sprint Board */}
      {calSubView === 'week' && (
        <div className="cal-week-board">
          {activeWeekDates.map((dateStr) => {
            const dObj = new Date(dateStr + 'T00:00:00');
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
            const dayNum = dObj.getDate();
            const isSelected = selectedDate === dateStr;
            const isToday = todayStr === dateStr;
            const dayItems = (itemsByDate[dateStr] || []).sort(
              (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
            );

            return (
              <div
                key={dateStr}
                className={`cal-week-column ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(dateStr)}
              >
                <div className="cal-week-col-header">
                  <span className="cal-week-day-name">{dayName}</span>
                  <span className="cal-week-day-num">{dayNum}</span>
                  <span className="cal-week-count">{dayItems.length}</span>
                </div>

                <div className="cal-week-col-items">
                  {dayItems.length === 0 ? (
                    <div className="cal-week-empty">No items</div>
                  ) : (
                    dayItems.map((it) => (
                      <div
                        key={it.id}
                        className={`cal-week-item-card ${isMeeting(it) ? 'meeting-card' : 'task-card'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(it);
                        }}
                        title="Click to view/edit details"
                      >
                        <span className="cal-week-item-time">{it.time}</span>
                        <strong className="cal-week-item-title">{it.title}</strong>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className="cal-week-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(dateStr);
                    handleOpenCreateTask(dateStr);
                  }}
                  title={`Add item on ${dayName}, ${dateStr}`}
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Executive Calendar Footer Strip */}
      <div className="calendar-footer-strip">
        <div className="cal-legend-group">
          <span className="cal-legend-item"><span className="legend-dot task"></span> Task</span>
          <span className="cal-legend-item"><span className="legend-dot meeting"></span> Meeting</span>
          <span className="cal-legend-item"><span className="legend-dot urgent"></span> High Priority</span>
          <span className="cal-legend-item"><span className="legend-box today"></span> Today</span>
        </div>

        <div className="cal-progress-group">
          <span className="cal-progress-text">
            {monthCompletionPercent}% completed ({monthCompletedCount}/{monthItems.length})
          </span>
          <div className="cal-progress-bar">
            <div className="cal-progress-fill" style={{ width: `${monthCompletionPercent}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
