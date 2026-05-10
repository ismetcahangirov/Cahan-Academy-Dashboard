import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema({
  dueDate: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  paidDate: {
    type: Date,
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  note: {
    type: String,
    default: '',
  },
});

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'AZN',
    },
    // once | weekly | monthly | semi-annually | annually
    type: {
      type: String,
      enum: ['once', 'weekly', 'monthly', 'semi-annually', 'annually'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    history: [paymentHistorySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Helper: generate history entries based on type & startDate
paymentSchema.statics.generateHistory = function (type, startDate, amount, endDate) {
  const entries = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (type === 'once') {
    entries.push({ dueDate: start, amount, status: 'pending' });
    return entries;
  }

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const addWeeks = (date, weeks) => {
    const d = new Date(date);
    d.setDate(d.getDate() + weeks * 7);
    return d;
  };

  // Generate up to 24 periods (2 years max)
  let current = new Date(start);
  const maxPeriods = 24;

  for (let i = 0; i < maxPeriods; i++) {
    if (end && current > end) break;

    entries.push({ dueDate: new Date(current), amount, status: 'pending' });

    if (type === 'weekly') current = addWeeks(current, 1);
    else if (type === 'monthly') current = addMonths(current, 1);
    else if (type === 'semi-annually') current = addMonths(current, 6);
    else if (type === 'annually') current = addMonths(current, 12);
    else break;
  }

  return entries;
};

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
