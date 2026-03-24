const {isEmail}=require('validator');
const mongoose=require('mongoose');


const clientSchema=new mongoose.Schema({
    client_name:{
        type:String,
        required:true
    },
    client_email: {
        type: String,
        required: true,
        validate: {
          validator:isEmail,
          message: 'Please enter a valid email'
        }
      }
      ,
    client_company:{
        type:String,
        required:true
    },
   
    client_user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    client_address:{
        type:String,
        required:true
    }
    
    
});

const Client=new mongoose.model('Client',clientSchema);
module.exports=Client;