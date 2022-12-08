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
  content: {
    type: String,
    required: false,
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
});
notificationsSchema.set('timestamps', true);
module.exports = mongoose.model('Notifications', notificationsSchema);
