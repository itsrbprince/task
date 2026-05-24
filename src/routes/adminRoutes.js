const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/overview', adminController.getOverview);
router.get('/employees', adminController.getEmployees);
router.get('/employees/:id', adminController.getEmployeeById);
router.get('/departments', adminController.getDepartments);
router.get('/leaderboard', adminController.getLeaderboard);

module.exports = router;
