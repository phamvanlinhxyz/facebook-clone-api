const jwt = require('jsonwebtoken');
const UserModel = require('../models/Users');
const FriendModel = require('../models/Friends');
const httpStatus = require('../utils/httpStatus');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../constants/constants');
const { ROLE_CUSTOMER } = require('../constants/constants');
const { enumFriendStatus } = require('../common/enum');
const friendsController = {};

/**
 * [POST] /api/v1/friends/requestFriend
 * Gửi yêu cầu kết bạn
 */
friendsController.sendRequest = async (req, res, next) => {
  try {
    let sender = req.userId;
    let receiver = req.body.receiverId;

    if (sender === receiver) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Yêu cầu không hợp lệ',
      });
    }

    let checkBack = await FriendModel.findOne({
      sender: receiver,
      receiver: sender,
    });
    if (checkBack != null) {
      if (
        checkBack.status === enumFriendStatus.requested ||
        checkBack.status === enumFriendStatus.accepted
      ) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Đối phương đã gửi lời mời kết bạn hoặc đã là bạn',
        });
      } else {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Không tìm thấy người dùng',
        });
      }
    }

    let isFriend = await FriendModel.findOne({
      sender: sender,
      receiver: receiver,
    });

    if (isFriend != null) {
      if (isFriend.status === enumFriendStatus.requested) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Đã gửi lời mời kết bạn trước đó',
        });
      } else if (isFriend.status === enumFriendStatus.accepted) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Bạn đã kết bạn với người dùng này',
        });
      } else {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Bạn đã chặn người dùng này',
        });
      }
    } else {
      const makeFriend = new FriendModel({
        sender: sender,
        receiver: receiver,
        status: enumFriendStatus.requested,
      });
      await makeFriend.save();
      res.status(httpStatus.OK).json({
        message: 'Gửi lời mời kết bạn thành công',
        data: makeFriend,
      });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [GET] /api/v1/friends/getRequests?limit=&offset=
 * Lấy danh sách lời mời kết bạn
 */
friendsController.getRequests = async (req, res, next) => {
  try {
    let receiver = req.userId;
    let { limit, offset } = req.query;
    let requests = await FriendModel.find({
      receiver: receiver,
      status: enumFriendStatus.requested,
    })
      .populate({
        path: 'sender',
        model: 'Users',
        select: 'username createdAt',
        populate: {
          path: 'avatar',
        },
      })
      .sort({ updatedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    let lstRequestUpdate = [];
    for (let request of requests) {
      let requestClone = JSON.parse(JSON.stringify(request));

      let mutualFriends = await FriendModel.countDocuments({
        $and: [
          {
            $or: [
              {
                sender: receiver,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: receiver,
                status: enumFriendStatus.accepted,
              },
            ],
          },
          {
            $or: [
              {
                sender: request.sender._id,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: request.sender._id,
                status: enumFriendStatus.accepted,
              },
            ],
          },
        ],
      });

      requestClone['mutualFriends'] = mutualFriends;
      lstRequestUpdate.push(requestClone);
    }

    const totalRequests = await FriendModel.countDocuments({
      receiver: receiver,
      status: enumFriendStatus.requested,
    });

    res.status(httpStatus.OK).json({
      data: lstRequestUpdate,
      totalRequests: totalRequests,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [GET] /api/v1/friends/getSuggests
 * Lấy danh sách gợi ý kết bạn
 */
friendsController.getSuggests = async (req, res, next) => {
  try {
    let { limit, offset } = req.query;

    let friends1 = await FriendModel.find({ sender: req.userId }).distinct(
      'receiver'
    );
    let friends2 = await FriendModel.find({ receiver: req.userId }).distinct(
      'sender'
    );

    let suggests = await UserModel.find({
      _id: { $nin: [...friends1, ...friends2, req.userId] },
    })
      .select('username')
      .populate('avatar')
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    let suggestsClone = JSON.parse(JSON.stringify(suggests));

    for (let suggest of suggestsClone) {
      let mutualFriends = await FriendModel.countDocuments({
        $and: [
          {
            $or: [
              {
                sender: req.userId,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: req.userId,
                status: enumFriendStatus.accepted,
              },
            ],
          },
          {
            $or: [
              {
                sender: suggest._id,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: suggest._id,
                status: enumFriendStatus.accepted,
              },
            ],
          },
        ],
      });

      suggest['mutualFriends'] = mutualFriends;
    }

    let totalSuggests = await UserModel.countDocuments({
      _id: { $nin: [...friends1, ...friends2, req.userId] },
    });

    res.status(httpStatus.OK).json({
      data: suggestsClone,
      totalSuggests: totalSuggests,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/friends/replyRequest
 * Trả lời yêu cầu kết bạn
 */
friendsController.replyRequest = async (req, res, next) => {
  try {
    let receiver = req.userId;
    let sender = req.body.senderId;

    let friend = await FriendModel.findOne({
      sender: sender,
      receiver: receiver,
    });

    if (friend.status == enumFriendStatus.accepted) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Yêu cầu không đúng',
      });
    }

    if (!req.body.isAccept) {
      await friend.remove();
      return res.status(httpStatus.OK).json({
        data: {
          message: 'Từ chối thành công',
        },
      });
    } else {
      friend.status = enumFriendStatus.accepted;
      await friend.save();
      return res.status(httpStatus.OK).json({
        data: {
          message: 'Kết bạn thành công',
        },
      });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [GET] /api/v1/friends/block
 * Lấy danh sách block
 */
friendsController.getListBlock = async (req, res) => {
  try {
    let lstBlock = await FriendModel.find({
      sender: req.userId,
      status: enumFriendStatus.blocked,
    }).populate({
      path: 'receiver',
      model: 'Users',
      select: 'username avatar',
      populate: 'avatar',
    });

    res.status(httpStatus.OK).json({
      data: lstBlock,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

friendsController.setRemoveFriend = async (req, res, next) => {
  try {
    let receiver = req.userId;
    let sender = req.body.user_id;

    let friendRc1 = await FriendModel.findOne({
      sender: sender,
      receiver: receiver,
      status: '1',
    });
    let friendRc2 = await FriendModel.findOne({
      sender: receiver,
      receiver: sender,
      status: '1',
    });
    let final;
    if (friendRc1 == null) {
      final = friendRc2;
    } else {
      final = friendRc1;
    }
    if (final.status != '1') {
      res.status(200).json({
        code: 200,
        success: false,
        message: 'Khong thể thao tác',
      });
    }

    final.status = '3';
    final.save();

    res.status(200).json({
      code: 200,
      success: true,
      message: 'Xóa bạn thành công',
      data: final,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

friendsController.getSingleRequest = async (req, res, next) => {
  try {
    let receiver = req.userId;
    let sender = req.params.sender;
    let request = await FriendModel.findOne({
      receiver: receiver,
      sender: sender,
      status: enumFriendStatus.requested,
    }).populate({
      path: 'sender',
      model: 'Users',
      select: 'username createdAt',
      populate: {
        path: 'avatar',
      },
    });

    let requestClone = JSON.parse(JSON.stringify(request));
    let mutualFriends = await FriendModel.countDocuments({
      $and: [
        {
          $or: [
            {
              sender: receiver,
              status: enumFriendStatus.accepted,
            },
            {
              receiver: receiver,
              status: enumFriendStatus.accepted,
            },
          ],
        },
        {
          $or: [
            {
              sender: sender,
              status: enumFriendStatus.accepted,
            },
            {
              receiver: sender,
              status: enumFriendStatus.accepted,
            },
          ],
        },
      ],
    });
    requestClone['mutualFriends'] = mutualFriends;

    res.status(httpStatus.OK).json({
      data: requestClone,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

friendsController.listFriends = async (req, res, next) => {
  try {
    const { limit, offset, search } = req.query;

    let requested = await FriendModel.find({
      sender: req.userId,
      status: enumFriendStatus.accepted,
    }).distinct('receiver');
    let accepted = await FriendModel.find({
      receiver: req.userId,
      status: enumFriendStatus.accepted,
    }).distinct('sender');

    let users = await UserModel.find({
      _id: { $in: requested.concat(accepted) },
      username: {
        $regex: search,
        $options: 'i',
      },
    })
      .select('username avatar')
      .populate('avatar')
      .populate('cover_image')
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    let lstFriendClone = JSON.parse(JSON.stringify(users));

    for (let item of lstFriendClone) {
      let mutualFriends = await FriendModel.countDocuments({
        $and: [
          {
            $or: [
              {
                sender: req.userId,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: req.userId,
                status: enumFriendStatus.accepted,
              },
            ],
          },
          {
            $or: [
              {
                sender: item._id,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: item._id,
                status: enumFriendStatus.accepted,
              },
            ],
          },
        ],
      });

      item['mutualFriends'] = mutualFriends;
    }

    const totalFriends = await UserModel.countDocuments({
      _id: { $in: requested.concat(accepted) },
      username: {
        $regex: search,
        $options: 'i',
      },
    });

    res.status(200).json({
      data: lstFriendClone,
      totalFriends: totalFriends,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

friendsController.listRequests = async (req, res, next) => {
  try {
    let list = await FriendModel.find({
      $and: [
        {
          $or: [{ sender: req.userId }, { receiver: req.userId }],
        },
        { status: '0' },
      ],
    })
      .populate({
        path: 'sender',
        model: 'Users',
        populate: {
          path: 'avatar',
          model: 'Documents',
        },
      })
      .populate({
        path: 'receiver',
        model: 'Users',
        populate: {
          path: 'avatar',
          model: 'Documents',
        },
      });

    let sentList = [];
    let receivedList = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].sender._id == req.userId) {
        sentList.push(list[i]);
      } else {
        receivedList.push(list[i]);
      }
    }

    res.status(200).json({
      data: {
        sentList,
        receivedList,
      },
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

friendsController.getFriendStatus = async (userId, friendId) => {
  try {
    let friendRecord = await FriendModel.findOne({
      $and: [
        {
          $or: [
            { sender: userId, receiver: friendId },
            { receiver: userId, sender: friendId },
          ],
        },
        { status: { $in: ['0', '1'] } },
      ],
    });

    let status = '';
    if (friendRecord === null) {
      status = 'not friend';
    } else if (friendRecord.status == '1') {
      status = 'friend';
    } else {
      if (friendRecord.sender == userId) {
        status = 'sent';
      } else {
        status = 'received';
      }
    }
    return status;
  } catch (e) {
    console.log(e);
  }
};

friendsController.friendStatus = async (req, res, next) => {
  let friendId = req.params.friendId;
  try {
    let friendRecord = await FriendModel.findOne({
      $and: [
        {
          $or: [
            { sender: req.userId, receiver: friendId },
            { receiver: req.userId, sender: friendId },
          ],
        },
        { status: { $in: ['0', '1'] } },
      ],
    });

    let status = '';
    if (friendRecord === null) {
      status = 'not friend';
    } else if (friendRecord.status == '1') {
      status = 'friend';
    } else {
      if (friendRecord.sender == req.userId) {
        status = 'sent';
      } else {
        status = 'received';
      }
    }

    res.status(200).json({
      data: {
        status: status,
      },
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

friendsController.cancelRequest = async (req, res, next) => {
  try {
    let sender = req.userId;
    let receiver = req.body.user_id;
    let checkBack = await FriendModel.findOne({
      sender: sender,
      receiver: receiver,
      status: { $in: ['0', '1'] },
    });
    if (checkBack != null) {
      let status = checkBack.status;
      if (checkBack.status == '0') {
        checkBack.status = '3';
        await checkBack.save();
      }

      return res.status(200).json({
        code: 200,
        newStatus: status == '1' ? 'friend' : 'not friend',
        success: true,
        message:
          status == '1'
            ? 'Không thể huỷ yêu cầu kết bạn vì đã là bạn'
            : 'Huỷ kết bạn thành công',
      });
    } else {
      let checkBack = await FriendModel.findOne({
        sender: receiver,
        receiver: sender,
        status: { $in: ['0', '1'] },
      });
      if (checkBack != null) {
        let status = checkBack.status;
        return res.status(200).json({
          code: 200,
          newStatus: status == '1' ? 'friend' : 'received',
          success: false,
          message:
            status == '1'
              ? 'Không thể huỷ yêu cầu kết bạn vì đã là bạn'
              : 'Bạn không phải người gửi lời mời kết bạn',
        });
      }
      return res.status(200).json({
        code: 200,
        newStatus: 'not friend',
        success: false,
        message: 'Chưa gủi lời mới kết bạn',
      });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

module.exports = friendsController;
