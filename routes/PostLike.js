const postLikeController = require('../controllers/PostLike');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const postLikeRoutes = express.Router();
const auth = require('../middlewares/auth');

// Like/Unlike bài viết
postLikeRoutes.post('/:postId', auth, asyncWrapper(postLikeController.action));
// Lấy danh sách like bài viết
postLikeRoutes.get('/:postId', auth, asyncWrapper(postLikeController.list));

module.exports = postLikeRoutes;
