const Notification = require('../models/Notification');

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
}

async function clearAll(req, res) {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications", error: error.message });
  }
}

module.exports = { getNotifications, markAllRead, clearAll };