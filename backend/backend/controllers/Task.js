

const Task = require('../models/Task');
const Project = require('../models/Project');

const Stat=require('../models/Stat');


async function addTask(req, res) {
    try {
        console.log("BODY RECEIVED:", req.body);
        const { user_id, client_id } = req.params;
        const { project_id, task_name, task_description, task_type, task_priority } = req.body;

        // Validate required fields
        if (!project_id || !user_id || !client_id) {
            return res.status(400).json({ message: "Project, user, and client are required." });
        }
        if (!task_name || !task_description || !task_type || !task_priority) {
            return res.status(400).json({ message: "All fields are required." });
        }

       

        // Validate type and priority
        if (task_type < 1 || task_type > 2) {
            return res.status(400).json({ message: "Task type must be 1 (company) or 2 (personal)" });
        }
        if (task_priority < 1 || task_priority > 4) {
            return res.status(400).json({ message: "Task priority must be between 1 (highest) and 4 (lowest)" });
        }

        // Create and save task
        const newTask = new Task({
            task_name,
            task_description,
            task_type,
            task_priority,
            task_user: user_id,
            task_project: project_id,
            task_client: client_id,
            task_status: false,
            task_commissioned: Date.now(),
            task_price: 0
        });

        const savedTask = await newTask.save();
        if (!savedTask) {
            return res.status(500).json({ message: "Error saving task" });
        }

        // Add task to project if project exists
        const project = await Project.findById(project_id);
        if (project) {
            
            project.project_tasks.push(savedTask._id);
            await project.save();
        }

        return res.status(201).json({
            message: "Task added successfully",
            task: savedTask
        });
    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
        }
}


async function updateTaskDetails(req, res) {
    try {
        const { task_id } = req.params;
        const { task_name, task_description, task_type, task_priority } = req.body;

        if (!task_id || !task_name || !task_description || !task_type || !task_priority) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (task_type < 1 || task_type > 2) {
            return res.status(400).json({ message: "Task type must be 1 (company) or 2 (personal)" });
        }
        if (task_priority < 1 || task_priority > 4) {
            return res.status(400).json({ message: "Task priority must be between 1 (highest) and 4 (lowest)" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            task_id,
            {
                task_name: task_name,
                task_description: task_description,
                task_type: task_type,
                task_priority: task_priority
            },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function deleteTask(req, res) {
    try {
        const { task_id } = req.params;

        if (!task_id) {
            return res.status(400).json({ message: "Task ID is required" });
        }

        const deletedTask = await Task.findByIdAndDelete(task_id);

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            message: "Task deleted successfully",
            task: deletedTask
        });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function getTaskDetails(req, res) {
    try {
        const { task_id } = req.params;

        if (!task_id) {
            return res.status(400).json({ message: "Task ID is required" });
        }

        const task = await Task.findById(task_id)
            .populate('task_user', 'username email')
            .populate('task_project', 'project_name')
            .populate('task_client', 'client_name');

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            message: "Task details retrieved successfully",
            task: task
        });
    } catch (error) {
        console.error("Error retrieving task details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function getTaskByProject(req, res) {
    try {
        const { project_id } = req.params;

        if (!project_id) {
            return res.status(400).json({ message: "Project ID is required" });
        }

        const tasks = await Task.find({ task_project: project_id })
            .populate('task_user', 'username email')
            .populate('task_client', 'client_name');

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found for this project" });
        }

        res.status(200).json({
            message: "Tasks retrieved successfully",
            tasks: tasks
        });
    } catch (error) {
        console.error("Error retrieving tasks by project:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function updateTaskStatus(req, res) {
    try {
        const { task_id } = req.params;
       
        if (!task_id ) {
            return res.status(400).json({ message: "Task ID and status are required" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            task_id,
            { task_status: true },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        const checkProject = await Project.findById(updatedTask.task_project);
console.log(checkProject);
let flag = true;

for (const projtask of checkProject.project_tasks) {
    let sathwikTask=await Task.findById(projtask);
    
    if (sathwikTask.task_status === false) {
        flag = false;
        break;
    }
}

if (flag === true) {
    checkProject.project_status = true;
    await checkProject.save();
}
       let stat = await Stat.findOne({ 
  stat_user_id: req.params.user_id, 
  stat_date: { 
    $gte: new Date(new Date().setHours(0, 0, 0, 0)), // start of today
    $lt: new Date(new Date().setHours(23, 59, 59, 999)) // end of today
  } 
});

if (!stat) {
  stat = new Stat({ stat_user_id: req.params.user_id,stat_count: 1});
} else {
  stat.stat_count += 1;
}

await stat.save();
        res.status(200).json({
            message: "Task status updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function updateTaskPrice(req, res) {
    try {
        const { task_id } = req.params;
        const { task_price } = req.body;

        if (!task_id || task_price === undefined) {
            return res.status(400).json({ message: "Task ID and price are required" });
        }

        if (task_price < 0) {
            return res.status(400).json({ message: "Task price cannot be negative" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            task_id,
            { task_price: task_price },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            message: "Task price updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error("Error updating task price:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function getTaskByUser(req, res) {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const tasks = await Task.find({ task_user: user_id })
            .populate('task_project')
            .populate('task_user')
            .populate('task_client');

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found for this user" });
        }

        res.status(200).json({
            message: "Tasks retrieved successfully",
            tasks: tasks
        });
    }catch (error) {
        console.error("Error retrieving tasks by user:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function updateTaskPriority(req, res) {
    try {
        console.log('Updating task priority...');
        const { task_id } = req.params;
        const { task_priority } = req.body;
        const priority = Number(task_priority);

        console.log("Task ID:", task_id);
        console.log("Task Priority (parsed):", priority);

        if (!task_id || isNaN(priority)) {
            return res.status(400).json({ message: "Task ID and numeric priority are required" });
        }

        if (priority < 1 || priority > 4) {
            return res.status(400).json({ message: "Task priority must be between 1 (highest) and 4 (lowest)" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            task_id,
            { task_priority: priority },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            message: "Task priority updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error("Error updating task priority:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


module.exports = {
    addTask,
    updateTaskDetails,
    deleteTask,
    getTaskDetails,
    getTaskByProject,
    updateTaskStatus,
    updateTaskPrice,
    getTaskByUser,
    updateTaskPriority
};