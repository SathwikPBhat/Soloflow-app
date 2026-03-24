const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task'); 
const mongoose = require('mongoose');
const User=require('../models/User');

async function createInvoice(req, res) {
  try {
    const {user_id,project_id,client_id}=req.params; 
    
    if(!user_id){
      return res.status(400).json({ message: "User ID is required" });
    }

    if(!project_id){
      return res.status(400).json({ message: "Project ID is required" });
    }
   const project=await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if(project.project_invoice_generated) {
      return res.status(400).json({ message: "Invoice already generated for this project" });
    }
    console.log("Project found:", project);
    let totalamount = 0;
     const invoice={
        invoice_client_id: project.project_client,
      invoice_project_id: project._id,
      invoice_user_id: project.project_user,
     };
     console.log("Invoice created:", invoice);
       let particulars=[];
    for (const task of project.project_tasks) {
      let project_task= await Task.findById(task).populate('task_user').populate('task_project');
      if (!project_task) {
        return res.status(404).json({ message: `Task with ID ${task} not found` });
      }
      if (!project_task.task_status) {
        return res.status(400).json({ message: `Task with ID ${task} is not completed` });
      }
       const amount = project_task.task_price;
      
  if (isNaN(amount)) {
    return res.status(400).json({ message: `Invalid amount for task ID ${task}` });
  }



  particulars.push({
    task_id: project_task._id,
    task_name: project_task.task_name,
    task_amount: amount
  });

  totalamount += amount;
    }
    if (particulars.length === 0) {
      return res.status(400).json({ message: "No completed tasks found for this project" });
    }

    invoice.invoice_amount = totalamount;
    invoice.invoice_date = new Date();
    invoice.invoice_status = 'Pending'; // Default status
    invoice.invoice_number = await Invoice.countDocuments() + 1; // Generate a new invoice number
    invoice.invoice_user_id = user_id; 
    invoice.particulars=particulars;
    console.log(invoice);
   // Set the user ID from the request parameters
    const invoiceCreated = new Invoice(invoice);
    await invoiceCreated.save();
    // Update the project to indicate that an invoice has been generated
    project.project_invoice_generated = true;
    project.project_invoice_id = invoiceCreated._id; // Link the invoice to the project
    await project.save();
    res.status(201).json({ message: "Invoice created successfully", invoice });
      
    
       
  

     
}catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  } 

}


async function viewInvoice(req, res) {
  console.log("Viewing invoice");
  try {
    const {client_id,project_id,user_id } = req.params;
    if (!client_id||!project_id||!user_id) {
      return res.status(400).json({ message: "Client ID and Project ID is required" });
    }

    const user=await User.findById(user_id);
    if(!user){
      return res.status(404).json({message:"invalid user"});
    }
    console.log(user);
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if(!project.project_invoice_generated) {
      return res.status(400).json({ message: "No invoice generated for this project" });  
    }

    const invoice=await Invoice.findOne({ invoice_project_id: project_id, invoice_client_id: client_id })
      .populate('invoice_client_id')
      .populate('invoice_project_id')
      .populate('invoice_user_id');

    console.log(invoice);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.status(200).json({ invoice });
  } catch (error) {
    console.error("Error viewing invoice:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}






async function getInvoicesByClient(req, res) {
  try {
    const { client_id } = req.params;
    if (!client_id) {
      return res.status(400).json({ message: "Client ID is required" });
    }
    
    const invoices = await Invoice.find({ invoice_client_id: client_id }).populate('invoice_client_id').populate('invoice_project_id').populate('particulars.task_id').populate('invoice_user_id');
    
    if (invoices.length === 0) {
      return res.status(404).json({ message: "No invoices found for this client" });
    }
    
    res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error getting invoices by client:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
async function getInvoicesByProject(req, res) {
  try {
    const { project_id } = req.params;
    if (!project_id) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    
    const invoices = await Invoice.find({ invoice_project_id: project_id }).populate('invoice_client_id').populate('invoice_project_id').populate('particulars.task_id').populate('invoice_user_id');
    
    if (invoices.length === 0) {
      return res.status(404).json({ message: "No invoices found for this project" });
    }
    
    res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error getting invoices by project:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

module.exports = {
  createInvoice,
  viewInvoice,
  getInvoicesByClient,
  getInvoicesByProject
};
;