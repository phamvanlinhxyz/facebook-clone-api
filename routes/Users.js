const usersController = require('../controllers/Users');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const usersRoutes = express.Router();
const auth = require('../middlewares/auth');

usersRoutes.post('/register', asyncWrapper(usersController.register));
usersRoutes.post('/login', asyncWrapper(usersController.login));
usersRoutes.post('/edit', auth, asyncWrapper(usersController.edit));
usersRoutes.post(
  '/password',
  auth,
  asyncWrapper(usersController.changePassword)
);
usersRoutes.get('/show', auth, asyncWrapper(usersController.show));

usersRoutes.get('/show/:id', auth, asyncWrapper(usersController.show));

usersRoutes.get(
  '/showbyphone/:phonenumber',
  auth,
  asyncWrapper(usersController.showByPhone)
);

usersRoutes.post('/search', auth, usersController.searchUser);

module.exports = usersRoutes;
