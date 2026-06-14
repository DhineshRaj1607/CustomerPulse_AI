const express = require('express');
const {
  getCampaigns,
  getCampaignById,
  createCampaign,
  sendEmailCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');

const router = express.Router();

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', createCampaign);
router.post('/send-email', sendEmailCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

module.exports = router;