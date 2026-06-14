const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Segment = require('../models/Segment');
const { sendBulkEmail } = require('../emailService');

const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch campaigns', error: error.message });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch campaign', error: error.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const { campaignName, segment, channels, message, scheduleType, status, sentCount, openRate } = req.body;
    const campaign = new Campaign({
      campaignName,
      segment,
      channels: Array.isArray(channels) ? channels : [],
      message,
      scheduleType,
      status,
      sentCount: sentCount ?? 0,
      openRate: openRate ?? 0,
    });
    const createdCampaign = await campaign.save();
    res.status(201).json(createdCampaign);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create campaign', error: error.message });
  }
};

const sendEmailCampaign = async (req, res) => {
  try {
    const { campaignName, message, segment } = req.body;

    if (!campaignName || !message || !segment) {
      return res.status(400).json({ success: false, message: 'campaignName, message, and segment are required' });
    }

    // Debug: log incoming segment
    console.log('sendEmailCampaign called with segment:', segment);

    // Match segment case-insensitively and escape special regex chars
    const safeSegment = (segment || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Try to resolve a saved Segment by name and apply its conditions to select customers
    const segmentDoc = await Segment.findOne({ name: { $regex: `^${safeSegment}$`, $options: 'i' } });

    let customers = [];

    // Helper to evaluate a single condition string against a customer
    const evaluateCondition = (customer, conditionStr) => {
      const parts = conditionStr.split(/\s+/);
      // Basic patterns: "City is Chennai", "Total Spend greater than ₹5000", "Order Count greater than 3", "Last Purchase in last 30 days"
      const lower = conditionStr.toLowerCase();

      if (lower.includes('city')) {
        // extract last token as city
        const match = conditionStr.match(/city\s+(?:is|contains)?\s*(.*)/i);
        const cityVal = match ? match[1].trim().toLowerCase() : '';
        return (customer.city || '').toLowerCase().includes(cityVal);
      }

      if (lower.includes('total spend') || lower.includes('totalspend') || lower.includes('spend')) {
        const numMatch = conditionStr.match(/[\d,]+/);
        const amount = numMatch ? parseInt((numMatch[0] || '').replace(/,/g, ''), 10) : 0;
        const custSpend = customer.totalSpend || customer.totalSpent || 0;
        if (lower.includes('greater') || lower.includes('more') || lower.includes('over') || lower.includes('>')) return custSpend > amount;
        if (lower.includes('less') || lower.includes('<')) return custSpend < amount;
        return custSpend === amount;
      }

      if (lower.includes('order') || lower.includes('purchase') || lower.includes('order count')) {
        const numMatch = conditionStr.match(/(\d+)/);
        const count = numMatch ? parseInt(numMatch[1], 10) : 0;
        const custOrders = customer.totalOrders || 0;
        if (lower.includes('greater')) return custOrders > count;
        if (lower.includes('less')) return custOrders < count;
        return custOrders === count;
      }

      if (lower.includes('last purchase') || lower.includes('in last')) {
        const daysMatch = conditionStr.match(/(\d+)\s*days?/i);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
        if (!customer.lastPurchaseDate) return false;
        const last = new Date(customer.lastPurchaseDate);
        const daysAgo = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (lower.includes('in last')) return daysAgo <= days;
        if (lower.includes('greater')) return daysAgo > days;
        return false;
      }

      // default fallback: true (include)
      return true;
    };

    if (segmentDoc && Array.isArray(segmentDoc.conditions) && segmentDoc.conditions.length > 0) {
      const allCustomers = await Customer.find({ email: { $exists: true, $ne: '' } });
      customers = allCustomers.filter(cust => {
        // Evaluate all conditions with AND semantics
        return segmentDoc.conditions.every(cond => evaluateCondition(cust, cond));
      });
      console.log(`Selected ${customers.length} customers by applying segment conditions for "${segmentDoc.name}"`);
    }

    // Fallback: if no segment doc or no customers matched, try matching by customer.segment field (case-insensitive), then substring
    if (!customers || customers.length === 0) {
      customers = await Customer.find({
        segment: { $regex: `^${safeSegment}$`, $options: 'i' },
        email: { $exists: true, $ne: '' },
      });

      if (!customers || customers.length === 0) {
        customers = await Customer.find({
          segment: { $regex: safeSegment, $options: 'i' },
          email: { $exists: true, $ne: '' },
        });
      }
    }

    console.log(`Matched customers for segment "${segment}":`, (customers || []).length);

    if (!customers || customers.length === 0) {
      return res.status(404).json({ success: false, message: 'No customers found for segment', matched: 0 });
    }

    const { sentCount, errors } = await sendBulkEmail({
      campaignName,
      messageTemplate: message,
      customers,
      segment,
    });

    const campaign = new Campaign({
      campaignName,
      segment,
      channels: ['Email'],
      message,
      status: sentCount > 0 ? 'Completed' : 'Failed',
      sentCount,
      sentDate: new Date(),
    });
    await campaign.save();

    res.json({ success: true, sent: sentCount, errors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Unable to send email campaign' });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { campaignName, segment, channels, message, scheduleType, status, sentCount, openRate } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.campaignName = campaignName ?? campaign.campaignName;
    campaign.segment = segment ?? campaign.segment;
    campaign.channels = Array.isArray(channels) ? channels : campaign.channels;
    campaign.message = message ?? campaign.message;
    campaign.scheduleType = scheduleType ?? campaign.scheduleType;
    campaign.status = status ?? campaign.status;
    campaign.sentCount = sentCount ?? campaign.sentCount;
    campaign.openRate = openRate ?? campaign.openRate;

    const updatedCampaign = await campaign.save();
    res.json(updatedCampaign);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update campaign', error: error.message });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await campaign.remove();
    res.json({ message: 'Campaign removed' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete campaign', error: error.message });
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  sendEmailCampaign,
  updateCampaign,
  deleteCampaign,
};