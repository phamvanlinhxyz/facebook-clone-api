const { userOptionDic } = require('../common/dictionary');
const UserOptionModel = require('../models/UserOption');
const httpStatus = require('../utils/httpStatus');
const userOptionController = {};

/**
 * [POST] api/v1/userOptions/:optionName
 * Cập nhật option theo tên
 */
userOptionController.updateOptionByName = async (req, res) => {
  try {
    let optionName = req.params.optionName;
    let optionDictionary = userOptionDic[optionName];

    if (!optionDictionary) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'OptionName không hợp lệ',
      });
    }

    let optionModel = await UserOptionModel.findOne({
      userId: req.userId,
      optionName: optionDictionary.name,
    });

    if (!optionModel) {
      optionModel = await UserOptionModel.create({
        userId: req.userId,
        optionName: optionDictionary.name,
        optionValue: req.body.optionValue,
      });
    } else {
      optionModel.optionValue = req.body.optionValue;
      await optionModel.save();
    }

    return res.status(httpStatus.OK).json({
      data: optionModel,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [GET] api/v1/userOptions/:optionName
 * Lấy option theo tên
 */
userOptionController.getOptionByName = async (req, res) => {
  try {
    let optionName = req.params.optionName;
    let optionDictionary = userOptionDic[optionName];

    if (!optionDictionary) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'OptionName không hợp lệ',
      });
    }

    let optionModel = await UserOptionModel.findOne({
      userId: req.userId,
      optionName: optionDictionary.name,
    });

    if (!optionModel) {
      optionModel = await UserOptionModel.create({
        userId: req.userId,
        optionName: optionDictionary.name,
        optionValue: optionDictionary.default,
      });
    }

    return res.status(httpStatus.OK).json({
      data: optionModel,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

module.exports = userOptionController;
