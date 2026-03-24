const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  stat_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stat_date: {
    type: Date,
    default: Date.now
  },
  stat_count: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Stat', statSchema);