const httpStatus = require('../utils/httpStatus');
const UserModel = require('../models/Users');
const NotificationModel = require('../models/Notifications');
const UserOptionModel = require('../models/UserOption');
const notificationsController = {};

notificationsController.update = async (req, res) => {
  try {
    let notifId = req.params.notifId;

    const updatedNotif = await NotificationModel.findByIdAndUpdate(
      notifId,
      req.body,
      { new: true }
    ).populate({
      path: 'sender',
      model: 'Users',
      select: 'username avatar',
      populate: 'avatar',
    });

    if (!updatedNotif) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Không tìm thấy thông báo.',
      });
    }

    res.status(httpStatus.OK).json({
      data: updatedNotif,
    });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

notificationsController.listNotification = async (req, res) => {
  try {
    let receiver = req.userId;
    let { limit, offset } = req.query;

    let notifications = await NotificationModel.find({
      receiver: receiver,
    })
      .populate({
        path: 'sender',
        model: 'Users',
        select: 'username avatar',
        populate: 'avatar',
      })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    let totalNotification = await NotificationModel.countDocuments({
      receiver: receiver,
    });

    return res.status(httpStatus.OK).json({
      data: notifications,
      total: totalNotification,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

notificationsController.create = async (type, receiver, sender, refId) => {
  try {
    let senderRc = await UserModel.findById(sender)
      .select('username avatar')
      .populate('avatar');

    let newNotification = await NotificationModel.create({
      sender: senderRc,
      receiver: receiver,
      read: false,
      type: type,
      refId: refId,
    });

    let dbOption = await UserOptionModel.findOne({
      optionName: 'CountUnseenNotification',
      userId: receiver,
    });

    if (dbOption) {
      dbOption.optionValue = (parseInt(dbOption.optionValue) + 1).toString();
      await dbOption.save();
    } else {
      dbOption = await UserOptionModel.create({
        optionName: 'CountUnseenNotification',
        optionValue: '1',
        userId: receiver,
      });
    }

    return {
      newNotification: newNotification,
      unseenNotification: dbOption.optionValue,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
};

module.exports = notificationsController;
