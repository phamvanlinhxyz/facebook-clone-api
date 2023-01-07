/**
 * Trạng thái bạn bè
 */
const enumFriendStatus = {
  requested: 0, // Yêu cầu
  accepted: 1, // Đồng ý
  blocked: 2, // Block
};

/**
 * Trạng thái bài post
 */
const enumPostType = {
  draft: 0,
  posted: 1,
  deleted: 2,
};

/**
 * Type thông báo
 */
const enumNotificationType = {
  requestFriend: 1, // Gửi lời mời kết bạn
  acceptRequest: 2, // Đồng ý kết bạn
  comment: 3, // Bình luận
};

module.exports = {
  enumFriendStatus,
  enumNotificationType,
  enumPostType,
};
