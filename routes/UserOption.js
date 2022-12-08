const { asyncWrapper } = require('../utils/asyncWrapper');
const express = require('express');
const userOptionRoutes = express.Router();
const auth = require('../middlewares/auth');
const userOptionController = require('../controllers/UserOption');

userOptionRoutes.get(
  '/:optionName',
  auth,
  asyncWrapper(userOptionController.getOptionByName)
);
userOptionRoutes.post(
  '/:optionName',
  auth,
  asyncWrapper(userOptionController.updateOptionByName)
);

module.exports = userOptionRoutes;
