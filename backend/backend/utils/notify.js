const Notification = require('../models/Notification');

async function notifyUser(userId, title, message) {
  await Notification.create({ user: userId, title, message });
}

module.exports = notifyUser;