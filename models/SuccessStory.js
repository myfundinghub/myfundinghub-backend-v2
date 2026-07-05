const mongoose = require('mongoose')

const successStorySchema = new mongoose.Schema({
  traderName: {
    type: String,
    required: true
  },
  country: String,
  earningsAmount: {
    type: Number,
    required: true
  },
  accountSize: {
    type: Number,
    required: true
  },
  model: {
    type: String,
    enum: ['instant', '1-step', '2-step']
  },
  testimonial: {
    type: String,
    required: true,
    maxlength: 300
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

module.exports = mongoose.model('SuccessStory', successStorySchema)