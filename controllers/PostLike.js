const httpStatus = require('../utils/httpStatus');
const PostModel = require('../models/Posts');
const UserModel = require('../models/Users');

const postLikeController = {};

/**
 * Danh sách like bài viết
 * [GET] /api/v1/postLike/:postId
 * @returns
 */
postLikeController.list = async (req, res, next) => {
  try {
    let post = await PostModel.findById(req.params.postId);
    if (post == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Không tìm thấy bài viết' });
    }

    let arrLike = post.like;

    let postLike = await UserModel.find({ _id: arrLike })
      .select('username avatar')
      .populate('avatar');

    res.status(httpStatus.OK).json({ data: postLike });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

/**
 * Like / unlike bài viết
 * [POST] /api/v1/postLike/:postId
 * @returns
 */
postLikeController.action = async (req, res, next) => {
  try {
    let userId = req.userId;
    let post = await PostModel.findById(req.params.postId);
    if (post == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Không tìm thấy bài viết' });
    }

    let arrLike = post.like;
    let arrLikeNotContainCurrentUser = arrLike.filter((item) => {
      return item != userId;
    });
    if (arrLikeNotContainCurrentUser.length === arrLike.length) {
      arrLike.push(userId);
    } else {
      arrLike = arrLikeNotContainCurrentUser;
    }
    post = await PostModel.findOneAndUpdate(
      { _id: req.params.postId },
      {
        like: arrLike,
        isLike: arrLike.includes(req.userId),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('images', ['fileName', 'fileLink', 'sortOrder'])
      .populate('videos', ['fileName', 'fileLink', 'sortOrder'])
      .populate({
        path: 'author',
        select: '_id username phonenumber avatar',
        model: 'Users',
        populate: {
          path: 'avatar',
          select: '_id fileName fileLink sortOrder fileLink',
          model: 'Documents',
        },
      });

    if (!post) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Can not find post' });
    }

    return res.status(httpStatus.OK).json({
      data: post,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

module.exports = postLikeController;
