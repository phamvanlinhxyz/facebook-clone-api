const httpStatus = require('../utils/httpStatus');
const UserModel = require('../models/Users');
const PostModel = require('../models/Posts');
const FriendModel = require('../models/Friends');
const DocumentModel = require('../models/Documents');
const NotificationModel = require('../models/Notifications');
const UserOptionModel = require('../models/UserOption');
const { enumNotificationType } = require('../common/enum');
const notificationsController = {};

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

    return res.status(httpStatus.OK).json({
      data: notifications,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

notificationsController.create = async (type, receiver, sender) => {
  try {
    let senderRc = await UserModel.findById(sender)
      .select('username avatar')
      .populate('avatar');

    let newNotification = await NotificationModel.create({
      sender: senderRc,
      receiver: receiver,
      read: false,
      type: type,
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
