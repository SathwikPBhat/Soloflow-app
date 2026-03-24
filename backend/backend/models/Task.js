


const mongoose=require('mongoose');


const taskSchema=new mongoose.Schema({
    task_name:{
        type:String,
        required:true,
        min:1
    },
    task_description:{
        type:String,
        required:true,
        min:1
    },
    task_user: {
       type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    task_project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Project'
    },
    task_client: {
        type:mongoose.Schema.Types.ObjectId,
         ref:'Client',
         required:true
     },
     task_status:{
        type:Boolean,
        default:false,
        required:true
     },
     task_type:{
        type:Number,
        required:true,
        validate: {
            validator: function(value) {
              return value >= 1 && value <= 2;  //1 for company 2 for personal
            },
            message: 'Value must be between 1 and 2.'
     }}
     ,
     task_commissioned:{
        type:Date,
        default:Date.now
     },
     task_price:{
        type:Number,
        default:0,
        required:true

     },
     task_priority:{
        type:Number,
        required:true,
        validate:{
            validator: function(value) {
              return value >= 1 && value <= 4;  //1 for highest priority 4 least priority
            },
            message: 'Value must be between 1 and 4.'
     }
     }});

const Task=new mongoose.model('Task',taskSchema);
module.exports=Task;