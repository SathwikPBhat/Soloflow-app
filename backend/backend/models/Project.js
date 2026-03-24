const mongoose=require('mongoose');


const projectSchema=new mongoose.Schema({
    project_name:{
        type:String,
        required:true
    },
    project_user: {
       type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    project_description:{
      type:String,
    },
    project_client: {
        type:mongoose.Schema.Types.ObjectId,
         ref:'Client',
         required:true
     },
     project_status:{
        type:Boolean,
        default:false,
        required:true
     },
     
     project_deadline:{
        type:Date,
        required:true
     },
     project_commissioned:{
        type:Date,
        default:Date.now
     },
     project_price:{
        type:Number,
        default:0,
        required:true

     },
      
    
    project_tasks:[{type:mongoose.Schema.Types.ObjectId,ref:'Task'}],
   project_invoice_generated:{
      type:Boolean,
      default:false
   },
   project_invoice_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Invoice',
      default:null
   }
    
    
});

const Project=new mongoose.model('Project',projectSchema);
module.exports=Project;