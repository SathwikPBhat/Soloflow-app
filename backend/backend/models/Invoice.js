const mongoose=require('mongoose');
const AutoIncrement=require('mongoose-sequence')(mongoose);
const invoiceSchema=new mongoose.Schema({
    invoice_number: {
        type: Number,
        required: true,
        unique: true
    },
    invoice_date: {
        type: Date,
        default: Date.now
    },
   
 
    invoice_status: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue'],
        default: 'Pending'
    },
    invoice_client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    invoice_project_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    
    particulars: [{task_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'}, task_name: String, task_amount: Number}],
    invoice_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

       invoice_amount: {
        type: Number,
        required: true,
        default:0
    }
    
});
invoiceSchema.plugin(AutoIncrement, {inc_field: 'invoice_number'});
const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;