const httpStatus = require('../utils/httpStatus');
const UserModel = require('../models/Users');
const PostModel = require('../models/Posts');
const FriendModel = require('../models/Friends');
const DocumentModel = require('../models/Documents');
const searchController = {};

/**
 * [GET] /api/v1/search/:key
 * Lấy danh sách tìm kiếm
 */
searchController.search = async (req, res, next) => {
  try {
    let key = req.params.key;
    userId = req.userId;

    let friends1 = await FriendModel.find({ sender: req.userId }).distinct(
      'receiver'
    );
    let friends2 = await FriendModel.find({ receiver: req.userId }).distinct(
      'sender'
    );

    let authors = [...friends1, ...friends2, userId];

    const posts = await PostModel.find({
      author: authors,
      inactive: { $ne: true },
      described: { $regex: key, $options: 'i' },
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

    return res.status(httpStatus.OK).json({
      data: posts,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

module.exports = searchController;
