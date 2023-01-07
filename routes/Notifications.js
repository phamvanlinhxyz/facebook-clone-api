const notificationsController = require('../controllers/Notifications');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const notificationsRoutes = express.Router();
const auth = require('../middlewares/auth');

notificationsRoutes.put(
  '/:notifId',
  auth,
  asyncWrapper(notificationsController.update)
);

notificationsRoutes.get(
  '/',
  auth,
  asyncWrapper(notificationsController.listNotification)
);

module.exports = notificationsRoutes;
