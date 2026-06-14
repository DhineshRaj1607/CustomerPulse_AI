const express = require('express');
const {
  getSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
} = require('../controllers/segmentController');

const router = express.Router();

router.get('/', getSegments);
router.get('/:id', getSegmentById);
router.post('/', createSegment);
router.put('/:id', updateSegment);
router.delete('/:id', deleteSegment);

module.exports = router;