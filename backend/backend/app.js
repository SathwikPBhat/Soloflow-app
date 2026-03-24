//import modules
const express=require('express');
const app=express();

const mongoose=require('mongoose');
const cors=require('cors');
const cron=require('node-cron');
const dotenv=require('dotenv');

//import controllers
const UserController=require('./controllers/User');
const ProjectController=require('./controllers/Project');
const TaskController=require('./controllers/Task');
const ClientController=require('./controllers/Client');
const InvoiceController=require('./controllers/Invoicing');
const AlertController=require('./controllers/Alert');
const EmailController=require('./controllers/Email');
const StatController=require('./controllers/Statistics')
const NotificationController = require('./controllers/Notification');

//other utils
const connectmongo=require('./config/mongoconnect');
const{authenticateJWT, user_login}=require('./middlewares/authentication');

//initializing middlewares
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));  

//server starter
app.listen(3000,()=>{  
    console.log("Server is running on port 3000");
   connectmongo()
  .then(() => console.log("mongo connected"))
  .catch((error) => {
    console.log("Error while connecting to MongoDB: " + error);
  });

}
);
//cron alerts should be revisited!!!

app.get('/stats/weekly-deadlines/:user_id', authenticateJWT, StatController.getWeeklyProjectDeadlineStats);
// user routes
app.post('/register', UserController.registerUser);
app.post('/login', user_login);
app.get('/user/:user_id', UserController.getUserById);
app.patch('/user/:user_id', authenticateJWT, UserController.updateUserDetails);

app.get('/stats/projects-today/:user_id', ProjectController.getTodayProjectsStats);
app.get('/stats/projects-thisweek/:user_id', ProjectController.getThisWeekProjectsStats);
app.get('/stats/projects-thismonth/:user_id', ProjectController.getThisMonthProjectsStats);

app.get('/:user_id/statistics',authenticateJWT,StatController.getStat);

app.get('/:user_id/dashboard', authenticateJWT,TaskController.getTaskByUser);
app.get('/:user_id/notifications', authenticateJWT, NotificationController.getNotifications);
app.post('/:user_id/notifications/mark-all-read', authenticateJWT, NotificationController.markAllRead);
app.delete('/:user_id/notifications/clear', authenticateJWT, NotificationController.clearAll);
// client routes
app.post('/:user_id/addclient', authenticateJWT, ClientController.addClient);
app.delete('/:user_id/:client_id/deleteclient', authenticateJWT, ClientController.deleteClient);
app.get('/:user_id/clients', authenticateJWT, ClientController.getAllClients);

// ---- Place this before /:user_id/:client_id ----
app.get('/:user_id/:client_id', authenticateJWT, ClientController.getClientById);

// project routes
app.get('/:user_id/projects', authenticateJWT, ProjectController.getProjectByUser);
app.get('/:user_id/:client_id/projects', authenticateJWT, ProjectController.getProjectByClient);
app.get('/:user_id/:client_id/projectdropdown', authenticateJWT, ProjectController.getProjectByClientDropDown);

app.post('/:user_id/:client_id/addproject', authenticateJWT, ProjectController.addProject);
app.put('/:user_id/:project_id', authenticateJWT, ProjectController.updateProjectDetails);
app.put('/:user_id/:client_id/:project_id', authenticateJWT, ProjectController.updateProjectDetails);

app.get('/:user_id/:client_id/:project_id', authenticateJWT, ProjectController.getProjectDetails);
app.get('/:user_id/:project_id', authenticateJWT, ProjectController.getProjectDetails);

app.delete('/:user_id/:project_id/deleteproject', authenticateJWT, ProjectController.deleteProject);

// task routes
app.post('/:user_id/:client_id/addtask', authenticateJWT, TaskController.addTask);
app.post('/:user_id/addtask', authenticateJWT, TaskController.addTask);

app.patch('/:user_id/:task_id/priority', authenticateJWT, TaskController.updateTaskPriority);
app.patch('/:user_id/:task_id/status', authenticateJWT, TaskController.updateTaskStatus);
app.patch('/:user_id/:task_id/price', authenticateJWT, TaskController.updateTaskPrice);
app.patch('/:user_id/:task_id', authenticateJWT, TaskController.updateTaskDetails);

app.delete('/:user_id/:task_id/deletetask', authenticateJWT, TaskController.deleteTask);

app.get('/:user_id/:client_id/:task_id', authenticateJWT, TaskController.getTaskDetails);
app.get('/:user_id/:task_id', authenticateJWT, TaskController.getTaskDetails);

// invoicing routes
app.post('/:user_id/:invoice_id/email',authenticateJWT, EmailController.emailInvoice);
app.post('/:user_id/:client_id/:project_id/addinvoice', authenticateJWT, InvoiceController.createInvoice);
app.get('/:user_id/:client_id/:project_id/viewinvoice', authenticateJWT, InvoiceController.viewInvoice);

module.exports=app;