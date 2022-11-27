const {
  DOCUMENT_TYPE_VIDEO,
  DOCUMENT_TYPE_IMAGE,
  DOCUMENT_TYPE_OTHER,
} = require('../constants/constants');
const mongoose = require('mongoose');

const documentsSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileLink: {
    type: String,
    required: true,
  },
  sortOrder: {
    type: Number,
    required: true,
    default: 0,
  },
  type: {
    type: String,
    enum: [DOCUMENT_TYPE_VIDEO, DOCUMENT_TYPE_IMAGE, DOCUMENT_TYPE_OTHER],
    required: false,
    default: DOCUMENT_TYPE_OTHER,
  },
});
documentsSchema.set('timestamps', true);
module.exports = mongoose.model('Documents', documentsSchema);
