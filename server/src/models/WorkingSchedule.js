import mongoose from 'mongoose';

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      required: true,
    },
    startTime: {
      type: String, // e.g. "08:00"
      required: true,
    },
    endTime: {
      type: String, // e.g. "17:00"
      required: true,
    },
    breakMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },
  },
  { _id: false }
);

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'FLEXIBLE', 'CUSTOM'],
      default: 'FULL_TIME',
    },
    days: [dayScheduleSchema],
    weeklyHours: {
      type: Number,
      required: true,
      default: 40,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const WorkingSchedule = mongoose.model('WorkingSchedule', workingScheduleSchema);
