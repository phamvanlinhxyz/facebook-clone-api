const UserModel = require('../models/Users');
const PostModel = require('../models/Posts');
const FriendModel = require('../models/Friends');
const DocumentModel = require('../models/Documents');
const httpStatus = require('../utils/httpStatus');
const {
  DOCUMENT_TYPE_IMAGE,
  DOCUMENT_TYPE_VIDEO,
} = require('../constants/constants');
const { enumPostType } = require('../common/enum');
const postsController = {};
/**
 * [POST] /api/v1/posts/create
 * Thêm bài đăng
 */
postsController.create = async (req, res, next) => {
  let userId = req.userId;
  try {
    const { described, images, video } = req.body;

    // Validate
    if (Array.isArray(images) && images.length > 4) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'Số lượng ảnh không được vượt quá 4.',
      });
    }
    if (Array.isArray(images) && video) {
      if (images.length > 0 && videos.length > 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Không thể đăng cả ảnh và video.',
        });
      }
    }

    // Lưu ảnh
    let dataImages = [];
    if (Array.isArray(images)) {
      let sortOrder = 1;
      for (const image of images) {
        let imageDocument = new DocumentModel({
          fileName: image.fileName,
          fileLink: image.fileLink,
          sortOrder: sortOrder,
          type: DOCUMENT_TYPE_IMAGE,
        });
        let savedImageDocument = await imageDocument.save();
        if (savedImageDocument !== null) {
          sortOrder++;
          dataImages.push(savedImageDocument._id);
        }
      }
    }

    // Lưu video
    let dataVideos;
    if (video) {
      let videoDocument = new DocumentModel({
        fileName: video.fileName,
        fileLink: video.fileLink,
        sortOrder: 1,
        type: DOCUMENT_TYPE_VIDEO,
      });
      let savedVideoDocument = await videoDocument.save();
      if (savedVideoDocument !== null) {
        dataVideos = savedVideoDocument._id;
      }
    }

    const post = new PostModel({
      author: userId,
      described: described,
      images: dataImages,
      videos: dataVideos,
      countComments: 0,
      type: req.body.type,
    });
    let postSaved = (await post.save()).populate('images').populate('videos');
    postSaved = await PostModel.findById(postSaved._id)
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
    return res.status(httpStatus.OK).json({
      data: postSaved,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/posts/edit/:id
 * Sửa bài đăng
 */
postsController.edit = async (req, res, next) => {
  try {
    let userId = req.userId;
    let postId = req.params.id;
    let postFind = await PostModel.findById(postId);
    if (postFind == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Không tìm thấy bài đăng.' });
    }
    if (postFind.author.toString() !== userId) {
      return res
        .status(httpStatus.FORBIDDEN)
        .json({ message: 'Bạn không có quyền sửa bài đăng này.' });
    }

    const {
      described,
      oldImages,
      newImages,
      oldVideo,
      newVideo,
      deletedDocument,
    } = req.body;

    // Xử lý các document bị xóa
    if (deletedDocument.length > 0) {
      for (const doc of deletedDocument) {
        await DocumentModel.findByIdAndDelete(doc._id);
      }
    }

    let dataImages = [];
    let sortOrder = 1;
    // Ảnh cũ
    if (Array.isArray(oldImages)) {
      for (const image of oldImages) {
        // Đánh lại sortOrder
        if (image) {
          await DocumentModel.findByIdAndUpdate(image._id, {
            sortOrder: sortOrder,
          });
          sortOrder++;
          dataImages.push(image._id);
        }
      }
    }
    // Thêm ảnh mới
    if (Array.isArray(newImages)) {
      for (const image of newImages) {
        let imageDocument = new DocumentModel({
          fileName: image.fileName,
          fileLink: image.fileLink,
          sortOrder: sortOrder,
          type: DOCUMENT_TYPE_IMAGE,
        });
        let savedImageDocument = await imageDocument.save();
        if (savedImageDocument !== null) {
          sortOrder++;
          dataImages.push(savedImageDocument._id);
        }
      }
    }

    let dataVideos = oldVideo._id;
    if (newVideo) {
      let videoDocument = new DocumentModel({
        fileName: newVideo.fileName,
        fileLink: newVideo.fileLink,
        sortOrder: 1,
        tyep: DOCUMENT_TYPE_VIDEO,
      });
      let savedVideoDocument = await videoDocument.save();
      if (savedVideoDocument !== null) {
        dataVideos = savedVideoDocument._id;
      }
    }

    let postSaved = await PostModel.findByIdAndUpdate(postId, {
      described: described,
      images: dataImages,
      videos: dataVideos,
    });
    postSaved = await PostModel.findById(postSaved._id)
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
      });
    return res.status(httpStatus.OK).json({
      data: postSaved,
    });
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: e.message,
    });
  }
};

/**
 * [POST] /api/v1/posts/show/:id
 * Lấy ra 1 bài viết
 */
postsController.show = async (req, res, next) => {
  try {
    let post = await PostModel.findById(req.params.id)
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
      });
    if (post == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Can not find post' });
    }
    post.isLike = post.like.includes(req.userId);
    return res.status(httpStatus.OK).json({
      data: post,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

/**
 * [GET] /api/v1/posts/delete/:id
 * Xóa bài đăng
 */
postsController.delete = async (req, res, next) => {
  try {
    let post = await PostModel.findByIdAndUpdate(req.params.id, {
      type: enumPostType.deleted,
    });
    if (post == null) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: 'Bài viết không tồn tại.' });
    }
    return res.status(httpStatus.OK).json({
      data: post._id,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

/**
 * [GET] /api/v1/posts/list
 * Lấy danh sách bài đăng
 */
postsController.list = async (req, res, next) => {
  try {
    let posts = [];
    let userId = req.userId;
    if (req.query.userId) {
      // get Post of one user
      posts = await PostModel.find({
        author: req.query.userId,
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
    } else {
      const user = await UserModel.findById(userId);
      const blockedDiaryList = user.blocked_diary ? user.blocked_diary : [];
      // console.log(blockedDiaryList)
      // get list friend of 1 user
      let friends = await FriendModel.find({
        status: '1',
      }).or([
        {
          sender: userId,
        },
        {
          receiver: userId,
        },
      ]);
      let listIdFriends = [];
      // console.log(friends)
      for (let i = 0; i < friends.length; i++) {
        if (friends[i].sender.toString() === userId.toString()) {
          if (!blockedDiaryList.includes(friends[i].receiver))
            listIdFriends.push(friends[i].receiver);
        } else {
          if (!blockedDiaryList.includes(friends[i].sender))
            listIdFriends.push(friends[i].sender);
        }
      }
      listIdFriends.push(userId);
      // console.log(listIdFriends);
      // get post of friends of 1 user
      posts = await PostModel.find({
        author: listIdFriends,
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
    }
    let postWithIsLike = [];
    for (let i = 0; i < posts.length; i++) {
      let postItem = posts[i];
      postItem.isLike = postItem.like.includes(req.userId);
      postWithIsLike.push(postItem);
    }
    return res.status(httpStatus.OK).json({
      data: postWithIsLike,
    });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

module.exports = postsController;
