const PostModel = require('../models/Posts');
const PostCommentModel = require('../models/PostComment');
const FriendModel = require('../models/Friends');
const httpStatus = require('../utils/httpStatus');
const postCommentController = {};

/**
 * [POST] /api/v1/postComment/:postId
 * Tạo comment mới
 */
postCommentController.create = async (req, res, next) => {
  try {
    let userId = req.userId;
    let post;
    try {
      post = await PostModel.findById(req.params.postId);
      if (post == null) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: 'Can not find post' });
      }
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
    const { content, commentAnswered } = req.body;

    const postComment = new PostCommentModel({
      user: userId,
      post: post._id,
      content: content,
      commentAnswered: commentAnswered ? commentAnswered : null,
    });

    let postCommentSaved = await postComment.save();

    // update countComments post
    let postSaved = await PostModel.findByIdAndUpdate(
      req.params.postId,
      {
        countComments: post.countComments ? post.countComments + 1 : 1,
      },
      { new: true }
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
    postCommentSaved = await PostCommentModel.findById(
      postCommentSaved._id
    ).populate({
      path: 'user',
      select: '_id username avatar',
      model: 'Users',
      populate: 'avatar',
    });
    return res.status(httpStatus.OK).json({
      data: postCommentSaved,
      post: postSaved,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [GET] /api/v1/postComment/:postId?offset
 * Lấy ra danh sách comment theo bài viết
 */
postCommentController.list = async (req, res, next) => {
  try {
    const { offset } = req.query;

    let postComments = await PostCommentModel.find({
      post: req.params.postId,
      commentAnswered: null,
    })
      .populate({
        path: 'user',
        select: '_id username avatar',
        model: 'Users',
        populate: 'avatar',
      })
      .skip(parseInt(offset ? offset.toString() : 0))
      .limit(10)
      .sort({ createdAt: -1 });

    let cloneComments = Object.clone(postComments);
    for (const comment of cloneComments) {
      comment.countAnswers = await PostCommentModel.countDocuments({
        commentAnswered: comment._id,
      });
    }

    let countComments = await PostCommentModel.countDocuments({
      post: req.params.postId,
      commentAnswered: null,
    });

    return res.status(httpStatus.OK).json({
      data: cloneComments,
      countComments: countComments,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

/**
 * [GET] /api/v1/postComment/answer/:commentId?offset=
 */
postCommentController.listAnswer = async (req, res, next) => {
  try {
    const { offset } = req.query;

    let answerComments = await PostCommentModel.find({
      commentAnswered: req.params.commentId,
    })
      .populate({
        path: 'user',
        select: '_id username avatar',
        model: 'Users',
        populate: 'avatar',
      })
      .skip(parseInt(offset ? offset.toString() : 0))
      .limit(10)
      .sort({ createdAt: -1 });

    return res.status(httpStatus.OK).json({
      data: answerComments,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

module.exports = postCommentController;
