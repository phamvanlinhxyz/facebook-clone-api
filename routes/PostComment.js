const postCommentController = require('../controllers/PostComment');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const postCommentRoutes = express.Router();
const auth = require('../middlewares/auth');

postCommentRoutes.post(
  '/:postId',
  auth,
  asyncWrapper(postCommentController.create)
);

postCommentRoutes.get(
  '/answers/:commentId',
  auth,
  postCommentController.listAnswer
);

postCommentRoutes.get(
  '/:postId',
  auth,
  asyncWrapper(postCommentController.list)
);
module.exports = postCommentRoutes;
