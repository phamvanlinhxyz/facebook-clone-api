const postsController = require('../controllers/Posts');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const postsRoutes = express.Router();
const auth = require('../middlewares/auth');

postsRoutes.delete('/:id', auth, asyncWrapper(postsController.delete));

postsRoutes.put('/:id', auth, asyncWrapper(postsController.edit));

postsRoutes.get('/:id', auth, asyncWrapper(postsController.show));

postsRoutes.get('/', auth, asyncWrapper(postsController.list));

postsRoutes.post('/', auth, asyncWrapper(postsController.create));

module.exports = postsRoutes;
