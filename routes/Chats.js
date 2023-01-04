const chatController = require('../controllers/Chats');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const chatsRoutes = express.Router();
const auth = require('../middlewares/auth');

chatsRoutes.get(
  '/friend/:friendId',
  auth,
  asyncWrapper(chatController.getMessagesByFriendId)
);

chatsRoutes.get('/:chatId', auth, asyncWrapper(chatController.getMessages));

chatsRoutes.delete('/:chatId', auth, asyncWrapper(chatController.deleteChat));

chatsRoutes.get('/', auth, asyncWrapper(chatController.getChats));

module.exports = chatsRoutes;
