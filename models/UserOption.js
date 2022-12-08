const mongoose = require('mongoose');

const userOptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  optionName: {
    type: String,
    required: true,
  },
  optionValue: {
    type: String,
    required: true,
  },
});
userOptionSchema.set('timestamps', true);
module.exports = mongoose.model('UserOption', userOptionSchema);
