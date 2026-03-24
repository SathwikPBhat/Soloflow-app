const mongoose = require('mongoose');
const Stat = require('../models/Stat');
const Project = require('../models/Project');

async function getStat(req, res) {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Convert user_id to ObjectId
    const objectId = mongoose.Types.ObjectId.isValid(user_id) ? new mongoose.Types.ObjectId(user_id) : null;
    if (!objectId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const stats = await Stat.find({ stat_user_id: objectId });

    const value = stats.map(stat => ({
      date: stat.stat_date.toISOString().slice(0, 10).replace(/-/g, '/'),
      count: stat.stat_count
    }));
    return res.status(200).json({ value });
  } catch (error) {
    console.error("Error retrieving stats:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}



async function getWeeklyProjectDeadlineStats(req, res) {
  try {
    const { user_id } = req.params;
    if (!user_id) return res.status(400).json({ message: "User ID is required" });

    // Get start of the week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (dayOfWeek + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    // Get end of the week (Sunday)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // Find all projects for this user with deadlines this week
    const projects = await Project.find({
      project_user: user_id,
      project_deadline: { $gte: start, $lte: end }
    });

    // Count projects per day
    const counts = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      counts[key] = 0;
    }
    projects.forEach(project => {
      const dateKey = new Date(project.project_deadline).toISOString().slice(0, 10);
      if (counts[dateKey] !== undefined) counts[dateKey]++;
    });

    // Format for chart: [{ date: 'YYYY-MM-DD', count: N }]
    const data = Object.entries(counts).map(([date, count]) => ({ date, count }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


module.exports = {
  getStat, getWeeklyProjectDeadlineStats
};