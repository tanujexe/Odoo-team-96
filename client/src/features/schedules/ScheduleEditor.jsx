import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Clock, Plus, Check, ArrowLeft, Trash2, X, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_ABBR_TO_FULL = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

const DAY_FULL_TO_ABBR = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN',
};

export function parseBreakMinutes(breakVal) {
  if (typeof breakVal === 'number') return breakVal;
  if (!breakVal) return 0;
  const str = String(breakVal).trim().toLowerCase();
  if (str.endsWith('h')) {
    const hours = parseFloat(str.replace('h', ''));
    return isNaN(hours) ? 0 : Math.round(hours * 60);
  }
  if (str.endsWith('m') || str.endsWith('min')) {
    const mins = parseFloat(str.replace(/[^\d.]/g, ''));
    return isNaN(mins) ? 0 : Math.round(mins);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

export function calculateDailyHours(start, end, breakMins) {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startTotalMins = (startH || 0) * 60 + (startM || 0);
  const endTotalMins = (endH || 0) * 60 + (endM || 0);

  if (endTotalMins <= startTotalMins) return 0;

  const parsedBreak = parseBreakMinutes(breakMins);
  const netMins = endTotalMins - startTotalMins - parsedBreak;
  return Math.max(0, Number((netMins / 60).toFixed(2)));
}

export function calculateWeeklyTotalHours(days) {
  if (!Array.isArray(days)) return 0;
  return days.reduce((acc, d) => {
    if (d.isWorkDay === false) return acc;
    return acc + calculateDailyHours(d.startTime, d.endTime, d.breakMinutes);
  }, 0);
}

const DEFAULT_WORK_DAYS = [
  { day: 'Monday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { day: 'Tuesday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { day: 'Wednesday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { day: 'Thursday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { day: 'Friday', isWorkDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
];

function normalizeInitialDays(schedule) {
  if (!schedule) return DEFAULT_WORK_DAYS;
  const rawList = schedule.workDays || schedule.days;
  if (!Array.isArray(rawList) || rawList.length === 0) return DEFAULT_WORK_DAYS;

  return rawList.map((d) => {
    const rawDay = d.day || 'Monday';
    const fullDay = DAY_ABBR_TO_FULL[String(rawDay).toUpperCase()] || rawDay;
    return {
      day: fullDay,
      isWorkDay: d.isWorkDay !== false,
      startTime: d.startTime || d.start || '09:00',
      endTime: d.endTime || d.end || '18:00',
      breakMinutes: d.breakMinutes ?? 60,
    };
  });
}

export function ScheduleEditor({ initialSchedule, onSave, onCancel }) {
  const [name, setName] = useState(initialSchedule?.name || '40 Hours / Week');
  const [company, setCompany] = useState(initialSchedule?.company || 'My Company');
  const [timezone, setTimezone] = useState(initialSchedule?.timezone || 'Company timezone');
  const [status, setStatus] = useState(
    initialSchedule?.status ? (initialSchedule.status.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active') : 'Active'
  );
  const [workDays, setWorkDays] = useState(normalizeInitialDays(initialSchedule));

  useEffect(() => {
    if (initialSchedule) {
      setName(initialSchedule.name || '');
      setCompany(initialSchedule.company || 'My Company');
      setTimezone(initialSchedule.timezone || 'Company timezone');
      setStatus(initialSchedule.status ? (initialSchedule.status.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active') : 'Active');
      setWorkDays(normalizeInitialDays(initialSchedule));
    } else {
      setName('New Working Schedule');
      setCompany('My Company');
      setTimezone('Company timezone');
      setStatus('Active');
      setWorkDays(DEFAULT_WORK_DAYS);
    }
  }, [initialSchedule]);

  const activeWorkDaysCount = workDays.filter((d) => d.isWorkDay !== false).length;
  const weeklyHours = calculateWeeklyTotalHours(workDays);

  const handleDayChange = (index, field, value) => {
    const updated = [...workDays];
    updated[index] = { ...updated[index], [field]: value };
    setWorkDays(updated);
  };

  const handleAddDay = () => {
    const usedDays = new Set(workDays.map((d) => d.day));
    const nextDay = DAYS_OF_WEEK.find((d) => !usedDays.has(d)) || 'Saturday';

    setWorkDays([
      ...workDays,
      {
        day: nextDay,
        isWorkDay: true,
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
      },
    ]);
  };

  const handleRemoveDay = (index) => {
    setWorkDays(workDays.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      const activeDays = workDays.filter((d) => d.isWorkDay !== false);
      const backendDays = activeDays.map((d) => ({
        day: DAY_FULL_TO_ABBR[d.day] || (['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(String(d.day).toUpperCase()) ? String(d.day).toUpperCase() : 'MON'),
        startTime: d.startTime || '09:00',
        endTime: d.endTime || '18:00',
        breakMinutes: parseBreakMinutes(d.breakMinutes),
      }));

      onSave({
        id: initialSchedule?.id || initialSchedule?._id || `sch-${Date.now()}`,
        _id: initialSchedule?._id || initialSchedule?.id || `sch-${Date.now()}`,
        name: name.trim() || 'Custom Schedule',
        company,
        timezone,
        status: status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        daysPerWeek: activeDays.length,
        hoursPerWeek: `${Number(weeklyHours.toFixed(1))}h`,
        weeklyHours: Number(weeklyHours.toFixed(2)),
        calculatedWeeklyHours: Number(weeklyHours.toFixed(2)),
        days: backendDays,
        workDays,
      });
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      {/* Header Bar matching enterprise light theme */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 rounded-t-xl">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" /> Back to list
            </button>
          )}
          <h3 className="text-base font-bold tracking-tight text-slate-900">{name || 'Working Schedule Form'}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200/80">
            {weeklyHours.toFixed(1)}h / Week
          </span>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <CardContent className="p-6 space-y-6">
          {/* Top Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Schedule Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 40 Hours / Week"
              required
            />
            <Input
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. My Company"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Days per Week</label>
              <input
                type="text"
                readOnly
                value={activeWorkDaysCount}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hours per Week</label>
              <input
                type="text"
                readOnly
                value={`${weeklyHours.toFixed(1)}h`}
                className="w-full text-xs bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Company timezone"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Weekly Schedule Table Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Weekly Schedule</h4>
                <p className="text-[11px] text-slate-500">Configure daily working hours and break durations</p>
              </div>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddDay}>
                Add Day
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Day</th>
                    <th className="py-2.5 px-4">Start Time</th>
                    <th className="py-2.5 px-4">End Time</th>
                    <th className="py-2.5 px-4">Break</th>
                    <th className="py-2.5 px-4 text-right">Hours</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {workDays.map((d, idx) => {
                    const dailyHours = calculateDailyHours(d.startTime, d.endTime, d.breakMinutes);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        {/* Day Selector */}
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          <select
                            value={d.day}
                            onChange={(e) => handleDayChange(idx, 'day', e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
                          >
                            {DAYS_OF_WEEK.map((dayName) => (
                              <option key={dayName} value={dayName}>
                                {dayName}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Start Time */}
                        <td className="py-2.5 px-4">
                          <input
                            type="time"
                            value={d.startTime}
                            onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                            className="text-xs bg-slate-50/60 border border-slate-200 rounded px-2.5 py-1 font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* End Time */}
                        <td className="py-2.5 px-4">
                          <input
                            type="time"
                            value={d.endTime}
                            onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                            className="text-xs bg-slate-50/60 border border-slate-200 rounded px-2.5 py-1 font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* Break */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="1h or 30m"
                            value={typeof d.breakMinutes === 'number' ? `${d.breakMinutes / 60 < 1 ? `${d.breakMinutes}m` : `${d.breakMinutes / 60}h`}` : d.breakMinutes}
                            onChange={(e) => handleDayChange(idx, 'breakMinutes', e.target.value)}
                            className="text-xs bg-slate-50/60 border border-slate-200 rounded px-2.5 py-1 font-mono text-slate-800 w-20 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* Net Hours */}
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {dailyHours.toFixed(1)}h
                        </td>

                        {/* Delete Day Action */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDay(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Day"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right text-xs font-bold text-slate-700">
                      Total Weekly Hours:
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-mono font-extrabold text-emerald-700">
                      {weeklyHours.toFixed(1)}h
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic flex items-center gap-1.5 pt-2">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            Use this schedule as the employee/contract working pattern.
          </p>
        </CardContent>

        <CardFooter className="bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
          {onCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : <div />}
          <Button type="submit" variant="primary" size="sm" icon={Check}>
            Save Schedule Definition
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
