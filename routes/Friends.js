const friendController = require('../controllers/Friends');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const friendsRoutes = express.Router();
const ValidationMiddleware = require('../middlewares/validate');
const auth = require('../middlewares/auth');

friendsRoutes.post('/sendRequest', auth, friendController.sendRequest);
friendsRoutes.get('/getRequests', auth, friendController.getRequests);
friendsRoutes.get('/getSuggests', auth, friendController.getSuggests);
friendsRoutes.post('/replyRequest', auth, friendController.replyRequest);
friendsRoutes.post('/cancel-request', auth, friendController.cancelRequest);
friendsRoutes.post('/set-remove', auth, friendController.setRemoveFriend);
friendsRoutes.get('/list', auth, friendController.listFriends);
friendsRoutes.get('/list_requests', auth, friendController.listRequests);
friendsRoutes.get('/status/:friendId', auth, friendController.friendStatus);
friendsRoutes.get(
  '/getRequest/:sender',
  auth,
  friendController.getSingleRequest
);

module.exports = friendsRoutes;
