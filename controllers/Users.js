const jwt = require('jsonwebtoken');
const UserModel = require('../models/Users');
const DocumentModel = require('../models/Documents');
const FriendModel = require('../models/Friends');
const PostModel = require('../models/Posts');
const httpStatus = require('../utils/httpStatus');
const bcrypt = require('bcrypt');
const { JWT_SECRET, DOCUMENT_TYPE_IMAGE } = require('../constants/constants');
const {
  enumFriendStatus,
  enumFriendInfo,
  enumPostType,
} = require('../common/enum');
const usersController = {};

/**
 * [POST] /api/v1/users/register
 * Đăng ký
 */
usersController.register = async (req, res, next) => {
  try {
    const { phonenumber, password, firstName, lastName, gender, birthday } =
      req.body;

    let user = await UserModel.findOne({
      phonenumber: phonenumber,
    });

    if (user) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Số điện thoại đã được sử dụng',
      });
    }
    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let avatar = await DocumentModel.findOne({ fileName: 'avatar-default' });
    if (!avatar) {
      let defaultAvt =
        'https://firebasestorage.googleapis.com/v0/b/facebook-60d2c.appspot.com/o/images%2F72811831_182945596079578_316116306019483648_n.jpg?alt=media&token=f84fdb83-b271-403f-8b7e-eb916669198d';
      avatar = await DocumentModel.create({
        type: 'image',
        fileName: 'avatar-default',
        fileLink: defaultAvt,
        sortOrder: 1,
      });
    }

    user = new UserModel({
      phonenumber: phonenumber,
      password: hashedPassword,
      username: firstName + ' ' + lastName,
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      birthday: birthday,
      avatar: avatar._id,
      coverImage: null,
    });

    try {
      const savedUser = await user.save();

      // login for User
      // create and assign a token
      const token = jwt.sign(
        {
          username: savedUser.username,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          id: savedUser._id,
        },
        JWT_SECRET
      );
      res.status(httpStatus.CREATED).json({
        data: {
          id: savedUser._id,
          phonenumber: savedUser.phonenumber,
          username: savedUser.username,
          avatar: avatar,
          coverImage: null,
        },
        token: token,
      });
    } catch (e) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: e.message,
      });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/users/login
 * Đăng nhập
 */
usersController.login = async (req, res, next) => {
  try {
    const { phonenumber, password } = req.body;
    let user = await UserModel.findOne({
      phonenumber: phonenumber,
    });
    if (!user) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Số điện thoại hoặc mật khẩu không chính xác',
      });
    }

    // password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Số điện thoại hoặc mật khẩu không chính xác',
      });
    }

    // login success
    const avatar = await DocumentModel.findById(user.avatar);

    // create and assign a token
    const token = jwt.sign(
      {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user._id,
      },
      JWT_SECRET
    );
    delete user['password'];

    user = await UserModel.findById(user._id)
      .select('-password')
      .populate('avatar')
      .populate('coverImage');

    return res.status(httpStatus.OK).json({
      data: user,
      token: token,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/users/edit
 * Cập nhật thông tin
 */
usersController.edit = async (req, res, next) => {
  try {
    let userId = req.userId;
    let user;
    const { avatar, coverImage } = req.body;
    const dataUserUpdate = {};
    // Các trường update
    const listPros = [
      'firstName', // Họ
      'middleName', // Tên đệm
      'lastName', // Tên
      'username', // Tên hiển thị
      'gender', // Giới tính
      'birthday', // Ngày sinh
      'description', // Tiểu sử
      'address', // Đến từ
      'city', // Tỉnh thành phố
      'avatar', // Avatar
      'coverImage', // Ảnh bìa
    ];
    for (let i = 0; i < listPros.length; i++) {
      // Lấy ra tên các trường
      let pro = listPros[i];
      if (req.body.hasOwnProperty(pro)) {
        switch (pro) {
          case 'avatar':
            // Lưu avatar
            let savedAvatarDocument = null;
            if (avatar) {
              let avatarDocument = new DocumentModel({
                fileName: avatar.fileName,
                fileLink: avatar.fileLink,
                sortOrder: 1,
                type: DOCUMENT_TYPE_IMAGE,
              });
              savedAvatarDocument = await avatarDocument.save();
            }
            dataUserUpdate[pro] =
              savedAvatarDocument !== null ? savedAvatarDocument._id : null;
            break;
          case 'coverImage':
            // Lưu ảnh bìa
            let savedCoverImageDocument = null;
            if (coverImage) {
              let coverImageDocument = new DocumentModel({
                fileName: avatacoverImager.fileName,
                fileLink: coverImage.fileLink,
                sortOrder: 1,
                type: DOCUMENT_TYPE_IMAGE,
              });
              savedCoverImageDocument = await coverImageDocument.save();
            }
            dataUserUpdate[pro] =
              savedCoverImageDocument !== null
                ? savedCoverImageDocument._id
                : null;
            break;
          default:
            // Các trường khác thì cập nhật như bthg
            dataUserUpdate[pro] = req.body[pro];
            break;
        }
      }
    }

    user = await UserModel.findByIdAndUpdate(userId, dataUserUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Không tìm thấy người dùng.' });
    }
    user = await UserModel.findById(userId)
      .select('-password')
      .populate('avatar')
      .populate('coverImage');
    return res.status(httpStatus.OK).json({
      data: user,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/users/password
 * Đổi mật khẩu
 */
usersController.changePassword = async (req, res, next) => {
  try {
    let userId = req.userId;
    let user = await UserModel.findById(userId);
    if (user == null) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'UNAUTHORIZED',
      });
    }
    const { currentPassword, newPassword } = req.body;
    // password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Mật khẩu không chính xác',
      });
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user = await UserModel.findOneAndUpdate(
      { _id: userId },
      {
        password: hashedNewPassword,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Can not find user' });
    }

    // create and assign a token
    const token = jwt.sign(
      {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user._id,
      },
      JWT_SECRET
    );
    user = await UserModel.findById(userId)
      .select('-password')
      .populate('avatar')
      .populate('coverImage');
    return res.status(httpStatus.OK).json({
      data: user,
      token: token,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/users?keyword=&offset=&limit=
 * Tìm kiếm người dùng
 */
usersController.searchUser = async (req, res, next) => {
  try {
    let searchKey = new RegExp(req.query.keyword, 'i');
    let result = await UserModel.find({
      $or: [
        { username: searchKey },
        { firstName: searchKey },
        { middleName: searchKey },
        { lastName: searchKey },
      ],
      _id: { $ne: req.userId },
    })
      .skip(parseInt(req.query.offset ? req.query.offset : 0))
      .limit(parseInt(req.query.limit ? req.query.limit : 10))
      .select('username avatar country')
      .populate('avatar')
      .populate('coverImage')
      .exec();

    let cloneRes = Object.clone(result);

    for (const person of cloneRes) {
      person['mutualFriends'] = await FriendModel.countDocuments({
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
                sender: person._id,
                status: enumFriendStatus.accepted,
              },
              {
                receiver: person._id,
                status: enumFriendStatus.accepted,
              },
            ],
          },
        ],
      });

      person['isFriend'] =
        (await FriendModel.countDocuments({
          $or: [
            {
              sender: req.userId,
              receiver: person._id,
              status: enumFriendStatus.accepted,
            },
            {
              receiver: req.userId,
              sender: person._id,
              status: enumFriendStatus.accepted,
            },
          ],
        })) > 0;
    }

    res.status(200).json({
      data: cloneRes,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

usersController.show = async (req, res, next) => {
  try {
    let userId = null;
    if (req.params.id) {
      userId = req.params.id;
    } else {
      userId = req.userId;
    }

    let user = await UserModel.findById(userId)
      .select(
        'phonenumber username gender birthday avatar coverImage blocked_inbox blocked_diary description'
      )
      .populate('avatar')
      .populate('coverImage');
    if (user == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Can not find user' });
    }

    return res.status(httpStatus.OK).json({
      data: user,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

usersController.showByPhone = async (req, res, next) => {
  try {
    let phonenumber = req.params.phonenumber;

    let user = await UserModel.findOne({ phonenumber: phonenumber })
      .populate('avatar')
      .populate('coverImage');
    if (user == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Can not find user' });
    }

    return res.status(httpStatus.OK).json({
      data: user,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

/**
 * [GET] /api/v1/users/:id/info
 */
usersController.info = async (req, res, next) => {
  try {
    // Lấy id người dùng cần tìm
    const id = req.params.id;

    // Lấy ra thông tin người dùng
    const userInfo = await UserModel.findById(id)
      .select('username avatar coverImage')
      .populate('avatar coverImage');

    // Lấy ra trạng thái bạn bè
    let friendStatus = enumFriendInfo.none;
    if (req.userId === id) {
      friendStatus = enumFriendInfo.me;
    } else {
      let isFriend = await FriendModel.findOne({
        $or: [
          { sender: id, receiver: req.userId },
          { sender: req.userId, receiver: id },
        ],
      });
      if (isFriend) {
        if (isFriend.status === enumFriendStatus.accepted) {
          friendStatus = enumFriendInfo.friend;
        } else if (isFriend.sender == id) {
          friendStatus = enumFriendInfo.requested;
        } else {
          friendStatus = enumFriendInfo.waitRequest;
        }
      }
    }

    // Lấy danh sách bạn bè
    let requested = await FriendModel.find({
      sender: id,
      status: enumFriendStatus.accepted,
    }).distinct('receiver');
    let accepted = await FriendModel.find({
      receiver: id,
      status: enumFriendStatus.accepted,
    }).distinct('sender');

    let lstFriend = await UserModel.find({
      _id: { $in: requested.concat(accepted) },
    })
      .select('username avatar')
      .populate('avatar')
      .populate('cover_image')
      .limit(6)
      .sort({ updatedAt: -1 });

    // Lấy ra bài viết
    const posts = await PostModel.find({
      author: id,
      type: enumPostType.posted,
    })
      .populate('images', ['fileName', 'fileLink', 'sortOrder'])
      .populate('videos', ['fileName', 'fileLink', 'sortOrder'])
      .populate({
        path: 'author',
        select: '_id username phonenumber avatar',
        model: 'Users',
        populate: {
          path: 'avatar',
          select: '_id fileName fileLink sortOrder',
          model: 'Documents',
        },
      })
      .sort({ createdAt: -1 });

    res.status(httpStatus.OK).json({
      friendStatus: friendStatus,
      info: userInfo,
      lstFriend: lstFriend,
      lstPost: posts,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

module.exports = usersController;
