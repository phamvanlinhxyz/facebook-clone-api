const postLikeController = require('../controllers/PostLike');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const postLikeRoutes = express.Router();
const auth = require('../middlewares/auth');

postLikeRoutes.post('/:postId', auth, asyncWrapper(postLikeController.action));

module.exports = postLikeRoutes;
