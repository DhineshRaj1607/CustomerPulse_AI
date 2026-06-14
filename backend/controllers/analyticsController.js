const Customer = require('../models/Customer');
const Segment = require('../models/Segment');
const Campaign = require('../models/Campaign');

const getAnalyticsSummary = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeSegments = await Segment.countDocuments({ audienceSize: { $gt: 0 } });
    const campaignsSent = await Campaign.countDocuments({ status: { $in: ['Sent', 'Completed', 'Delivered'] } });

    const avgOpenRateResult = await Campaign.aggregate([
      { $match: { openRate: { $exists: true, $ne: null } } },
      { $group: { _id: null, averageOpenRate: { $avg: '$openRate' } } },
    ]);

    const avgOpenRate = avgOpenRateResult[0]?.averageOpenRate ?? 0;

    res.json({
      totalCustomers,
      activeSegments,
      campaignsSent,
      avgOpenRate: Number(avgOpenRate.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch analytics summary', error: error.message });
  }
};

module.exports = { getAnalyticsSummary };