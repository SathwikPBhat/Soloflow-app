const {isEmail} = require('validator');

const mongoose=require('mongoose');


const userSchema=new mongoose.Schema({
    user_name:{
        type:String,
        required:true
    },
    user_email: {
        type: String,
        required: true,
        validate: {
          validator:isEmail,
          message: 'Please enter a valid email'
        }
      }
      ,
    user_company:{
        type:String,
        required:true
    },
    clients:[{type:mongoose.Schema.Types.ObjectId,ref:'Client'}],

    user_password:{
        type:String,
        required:true,
    },
    user_bio: {
         type: String,
          default: ""
         } 
},{timestamps:true});

const User=new mongoose.model('User',userSchema);
module.exports=User;