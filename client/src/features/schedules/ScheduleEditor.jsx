import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Clock, Plus, Check, RotateCcw } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_DAYS = DAYS_OF_WEEK.map((day, idx) => ({
  day,
  isWorkDay: idx < 5, // Mon-Fri true, Sat-Sun false
  startTime: '09:00',
  endTime: '17:30',
  breakMinutes: 30,
}));

export function calculateDailyHours(start, end, breakMins) {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startTotalMins = startH * 60 + startM;
  const endTotalMins = endH * 60 + endM;

  if (endTotalMins <= startTotalMins) return 0;

  const netMins = endTotalMins - startTotalMins - (Number(breakMins) || 0);
  return Math.max(0, Number((netMins / 60).toFixed(2)));
}

export function calculateWeeklyTotalHours(days) {
  return days.reduce((acc, d) => {
    if (!d.isWorkDay) return acc;
    return acc + calculateDailyHours(d.startTime, d.endTime, d.breakMinutes);
  }, 0);
}

export function ScheduleEditor({ initialSchedule, onSave, onCancel }) {
  const [name, setName] = useState(initialSchedule?.name || 'Standard 40h Working Schedule');
  const [workDays, setWorkDays] = useState(
    initialSchedule?.workDays?.map(d => ({
      day: d.day,
      isWorkDay: d.isWorkDay ?? true,
      startTime: d.startTime || d.start || '09:00',
      endTime: d.endTime || d.end || '17:30',
      breakMinutes: d.breakMinutes ?? 30,
    })) || DEFAULT_DAYS
  );

  const weeklyHours = calculateWeeklyTotalHours(workDays);

  const handleDayChange = (index, field, value) => {
    const updated = [...workDays];
    updated[index] = { ...updated[index], [field]: value };
    setWorkDays(updated);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        name,
        workDays,
        calculatedWeeklyHours: Number(weeklyHours.toFixed(2)),
      });
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader
        title="Working Schedule Definition"
        subtitle="Configure daily start, end, and break times with real-time calculated weekly hours"
      />
      <form onSubmit={handleFormSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
              label="Schedule Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Flexible Shift"
              required
            />
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Calculated Weekly Total</span>
                <p className="text-[11px] text-emerald-600">Auto-computed net worked hours</p>
              </div>
              <span data-testid="calculated-weekly-hours" className="text-2xl font-extrabold text-emerald-700 font-mono">
                {weeklyHours.toFixed(1)} hrs
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase text-slate-500 grid grid-cols-12 gap-2">
              <span className="col-span-3">Day</span>
              <span className="col-span-2">Work Day?</span>
              <span className="col-span-2">Start Time</span>
              <span className="col-span-2">End Time</span>
              <span className="col-span-2">Break (min)</span>
              <span className="col-span-1 text-right">Daily</span>
            </div>

            {workDays.map((d, idx) => {
              const daily = d.isWorkDay ? calculateDailyHours(d.startTime, d.endTime, d.breakMinutes) : 0;
              return (
                <div
                  key={d.day}
                  className={`px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs transition-colors ${
                    d.isWorkDay ? 'bg-white' : 'bg-slate-50/70 text-slate-400'
                  }`}
                >
                  <span className="col-span-3 font-semibold text-slate-900">{d.day}</span>
                  <div className="col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      aria-label={`Toggle work day for ${d.day}`}
                      checked={d.isWorkDay}
                      onChange={(e) => handleDayChange(idx, 'isWorkDay', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="time"
                      disabled={!d.isWorkDay}
                      value={d.startTime}
                      onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="time"
                      disabled={!d.isWorkDay}
                      value={d.endTime}
                      onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      step="5"
                      disabled={!d.isWorkDay}
                      value={d.breakMinutes}
                      onChange={(e) => handleDayChange(idx, 'breakMinutes', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <span className="col-span-1 text-right font-mono font-bold text-slate-800">
                    {daily.toFixed(1)}h
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Button type="submit" variant="primary" size="sm" icon={Check}>
              Save Schedule
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
