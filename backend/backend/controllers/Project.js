const Project = require('../models/Project');

const Task=require('../models/Task');
const Invoice=require('../models/Invoice');
async function addProject(req, res) {
  try {
    console.log("Adding project");
    const { client_id, user_id } = req.params;
    if (!client_id || !user_id) {
      return res.status(400).json({ message: "Client ID and User ID are required" });
    }
    

    const { project_name, project_description, deadline } = req.body;

    if (!project_name || !project_description || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const deadlineDate = new Date(deadline);
   
if (isNaN(deadlineDate.getTime())) {
  return res.status(400).json({ message: "Invalid deadline date" });
}

const today = new Date();
today.setHours(0, 0, 0, 0);


const deadlineDay = new Date(deadlineDate);
deadlineDay.setHours(0, 0, 0, 0);

// Allow if deadline is today or in the future
if (deadlineDay < today) {
  return res.status(400).json({ message: "Deadline must be today or a future date" });
}

    const newProject = new Project({
      project_name,
      project_client:client_id,
      project_user:user_id,
      project_description,
      project_deadline: new Date(deadline),
      user_id,
      client_id
    });
    console.log(newProject);
    const savedProject = await newProject.save();

    res.status(201).json({
      message: "Project added successfully",
      project: savedProject
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function updateProjectDetails(req, res) {
  try {
    const { project_id } = req.params;
    const { project_name, project_description, deadline } = req.body;

    if (!project_id || !project_name || !project_description || !deadline) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      project_id,
      {
        project_name,
        project_description,
        deadline: new Date(deadline)
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function deleteProject(req, res) {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Find the project and its tasks
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ task_project: project_id });

    // Delete the invoice using project.project_invoice_id if it exists
    if (project.project_invoice_id) {
      await Invoice.findByIdAndDelete(project.project_invoice_id);
    }

    // Delete the project itself
    const deletedProject = await Project.findByIdAndDelete(project_id);

    res.status(200).json({
      message: "Project, its tasks, and its invoice deleted successfully",
      project: deletedProject
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function getProjectDetails(req, res) {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const project = await Project.findById(project_id)
      .populate('user_id', 'username email')
      .populate('client_id', 'client_name client_email');

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project details retrieved successfully",
      project:project
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getProjectByUser(req, res) {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const projects = await Project.find({ user_id })
      .populate('client_id', 'client_name client_email');

    if (projects.length === 0) {
      return res.status(404).json({ message: "No projects found for this user" });
    }

    res.status(200).json({
      message: "Projects retrieved successfully",
      projects
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function getProjectByClient(req, res) {
  try {
    const { client_id } = req.params;

    if (!client_id) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    // Populate both user and client for each project
    const projects = await Project.find({ project_client: client_id })
      .populate('project_user', 'user_name user_email')
      .populate('project_client', 'client_name client_company');

    if (projects.length === 0) {
      return res.status(200).json({ message: "No projects found for this client" });
    }

    const formattedProjects = projects.map(project => ({
      id: project._id,
      projectName: project.project_name,
      project_client_id: project.project_client,
      project_user_id: project.project_user,
      projectDescription: project.project_description || '', 
      clientName: project.project_client?.client_name || '',
      clientCompany: project.project_client?.client_company || '',
      status: project.project_status ,
      deadline: project.project_deadline,
      invoiceGenerated: project.project_invoice_generated,

    }));

    res.status(200).json({
      message: "Projects retrieved successfully",
      projects: formattedProjects
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getProjectByClientDropDown(req,res){
  try {
    const { client_id } = req.params;

    if (!client_id) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    // Populate both user and client for each project
    const projects = await Project.find({ project_client: client_id })
      .populate('project_user', 'user_name user_email')
      .populate('project_client', 'client_name client_company');

    if (projects.length === 0) {
      return res.status(200).json({ message: "No projects found for this client" });
    }

   const formattedProjects = projects
  .filter(project => project.project_status === false)
  .map(project => ({
    id: project._id,
    projectName: project.project_name,
    project_client_id: project.project_client,
    project_user_id: project.project_user,
    projectDescription: project.project_description || '', 
    clientName: project.project_client?.client_name || '',
    clientCompany: project.project_client?.client_company || '',
    status: project.project_status,
    deadline: project.project_deadline,
    invoiceGenerated: project.project_invoice_generated,
  }));


    res.status(200).json({
      message: "Projects retrieved successfully",
      projects: formattedProjects
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }

}



async function getThisWeekProjectsStats(req, res) {
  try {
    const { user_id } = req.params;
    if (!user_id) return res.status(400).json({ message: "User ID is required" });

    
    // Get start of the week (Monday)
const now = new Date();
const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
const diffToMonday = (dayOfWeek + 6) % 7; // 0 if Monday, 1 if Tuesday, etc.

const start = new Date(now);
start.setDate(now.getDate() - diffToMonday);
start.setHours(0, 0, 0, 0);

// Get end of the week (Sunday)
const end = new Date(start);
end.setDate(start.getDate() + 6);
end.setHours(23, 59, 59, 999);

    
    const projects = await Project.find({
      project_user: user_id,
      project_deadline: { $gte: start, $lte: end }
    });
        console.log(projects);

    const total = projects.length;
    const completed = projects.filter(p => p.project_status === true).length;

    res.json({ total, completed });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getTodayProjectsStats  (req, res) {
  try {
    const { user_id } = req.params;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const projects = await Project.find({
      project_user: user_id,
      project_deadline: { $gte: start, $lte: end }
    });
    console.log(projects);
    const total = projects.length;
    const completed = projects.filter(p => p.project_status === true).length;

    res.json({ total, completed });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

async function getThisMonthProjectsStats  (req, res) {
  try {
    const { user_id } = req.params;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const projects = await Project.find({
      project_user: user_id,
      project_deadline: { $gte: start, $lte: end }
    });
        console.log(projects);

    const total = projects.length;
    const completed = projects.filter(p => p.project_status === true).length;

    res.json({ total, completed });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addProject,
  updateProjectDetails,
  deleteProject,
  getProjectDetails,
  getProjectByUser,
  getProjectByClient,
  getThisWeekProjectsStats,
  getTodayProjectsStats,
  getThisMonthProjectsStats,
  getProjectByClientDropDown
};