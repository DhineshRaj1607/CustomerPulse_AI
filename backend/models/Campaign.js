const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  campaignName: { type: String, required: true, trim: true },
  segment: { type: String, trim: true, required: true },
  channels: [{ type: String, trim: true }],
  message: { type: String, trim: true },
  scheduleType: { type: String, trim: true, default: 'Send Now' },
  status: { type: String, trim: true, default: 'Draft' },
  sentCount: { type: Number, default: 0 },
  sentDate: { type: Date },
  openRate: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Campaign', campaignSchema);