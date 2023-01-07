const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  read: {
    type: Boolean,
    required: false,
    default: false,
  },
  type: {
    type: Number,
    require: false,
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    require: false,
  },
});
notificationsSchema.set('timestamps', true);
module.exports = mongoose.model('Notifications', notificationsSchema);
