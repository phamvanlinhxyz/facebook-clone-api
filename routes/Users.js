const usersController = require('../controllers/Users');
const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const usersRoutes = express.Router();
const auth = require('../middlewares/auth');

usersRoutes.post('/register', asyncWrapper(usersController.register));
usersRoutes.post('/login', asyncWrapper(usersController.login));
usersRoutes.post(
  '/password',
  auth,
  asyncWrapper(usersController.changePassword)
);
usersRoutes.post('/', auth, asyncWrapper(usersController.edit));
usersRoutes.get('/', auth, asyncWrapper(usersController.searchUser));

module.exports = usersRoutes;
