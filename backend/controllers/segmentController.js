const Segment = require('../models/Segment');

const getSegments = async (req, res) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 });
    res.json(segments);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch segments', error: error.message });
  }
};

const getSegmentById = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }
    res.json(segment);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch segment', error: error.message });
  }
};

const createSegment = async (req, res) => {
  try {
    const { name, description, audienceSize, conditions, estimatedReach } = req.body;
    const segment = new Segment({
      name,
      description: description || '',
      audienceSize: audienceSize || estimatedReach || 0,
      conditions: conditions || [],
      estimatedReach: estimatedReach || audienceSize || 0,
    });
    const createdSegment = await segment.save();
    res.status(201).json(createdSegment);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create segment', error: error.message });
  }
};

const updateSegment = async (req, res) => {
  try {
    const { name, description, audienceSize } = req.body;
    const segment = await Segment.findById(req.params.id);

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    segment.name = name ?? segment.name;
    segment.description = description ?? segment.description;
    segment.audienceSize = audienceSize ?? segment.audienceSize;

    const updatedSegment = await segment.save();
    res.json(updatedSegment);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update segment', error: error.message });
  }
};

const deleteSegment = async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    await Segment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Segment removed' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete segment', error: error.message });
  }
};

module.exports = {
  getSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
};