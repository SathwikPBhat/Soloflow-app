const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const ALERT_WINDOWS = [
  { hours: 24, label: "24 hours" },
  { hours: 12, label: "12 hours" },
  { hours: 2, label: "2 hours" }
];

cron.schedule('*/10 * * * *', async () => { // Every 10 minutes
  const now = new Date();
  const tasks = await Task.find({ task_status: false })
  for (const task of tasks) {
    for (const window of ALERT_WINDOWS) {
      const alertTime = new Date(task.task_deadline.getTime() - window.hours * 60 * 60 * 1000);
      if (
        now >= alertTime &&
        now < new Date(alertTime.getTime() + 10 * 60 * 1000)
      ) {
        // Check if notification already exists
        const exists = await Notification.findOne({
          user: task.task_user_id._id,
          message: { $regex: window.label },
          message: { $regex: task.task_name }
        });
        if (!exists) {
          await Notification.create({
            user: task.task_user_id._id,
            title: `Task Reminder: ${window.label} left`,
            message: `Task "${task.task_name}" is due in ${window.label}.`,
          });
        }
      }
    }
  }
});