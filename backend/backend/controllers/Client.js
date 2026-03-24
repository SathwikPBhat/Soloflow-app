const Client = require("../models/Client");
const User = require("../models/User");


const Project = require("../models/Project");
const Task = require("../models/Task");

async function addClient(req, res) {
  try {
    const {user_id}=req.params;
    const { client_name, client_email, client_address,client_company } = req.body;

    if (!client_name || !client_email |!client_company||!client_address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if(!user_id){
        res.status(401).json({message:"Not authenticated"});
    }

    const user=await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!req.user || req.user.id.toString() !== user_id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const newClient = new Client({
      client_name: client_name,
        client_email: client_email,
        client_company: client_company,
        client_address: client_address,
      client_user: user_id
    });

    user.clients.push(newClient._id);
    await user.save();

    const savedClient=await newClient.save();
    if(savedClient){
      return res.status(200).json({message:"Client added"});
    }else{
      return res.status(400).json({error:error.message});
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteClient(req, res) {
  try {
    const { user_id, client_id } = req.params;
    if (!user_id) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.user || req.user.id.toString() !== user_id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!client_id) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Find all projects for this client
    const projects = await Project.find({ project_client: client_id });

    // 2. For each project, delete all related tasks
    for (const project of projects) {
      await Task.deleteMany({ task_project: project._id });
    }

    // 3. Delete all projects for this client
    await Project.deleteMany({ project_client: client_id });

    // 4. Delete all tasks directly linked to this client (not via project)
    await Task.deleteMany({ task_client: client_id });

    // 5. Remove client from user's clients array
    await user.clients.pull(client_id);
    await user.save();

    // 6. Delete the client itself
    const deletedClient = await Client.findByIdAndDelete(client_id);

    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client and all related projects and tasks deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getClientById(req, res) {
  try {
    const { client_id } = req.params;

    if (!client_id) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const client = await Client.findById(client_id) 
      .populate('client_user', 'username email')
      .populate('client_projects', 'project_name project_description');
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({
      message: "Client details retrieved successfully",
      client: client
    });
  } catch (error) {   
    console.error("Error retrieving client details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } }

  async function getAllClients(req, res) {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!req.user || req.user.id.toString() !== user_id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const user = await User.findById(user_id).populate('clients');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ clients: user.clients });
    } catch (error) {
        console.error("Error retrieving clients:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
module.exports = {
    addClient,
    deleteClient,
    getClientById,
    getAllClients
    };          