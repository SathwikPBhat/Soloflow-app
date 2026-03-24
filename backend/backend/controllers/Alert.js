const Task=require('../models/Task');


async function AlertXhoursBefore(x){
    const toBeRemindedTasks = await Task.find({
        task_status: 'Pending',
        task_user_id: req.user._id,
        task_deadline: {
            $gte: new Date(),
            $lte: new Date(Date.now() + x * 60 * 60 * 1000) 
        }
    }).populate('task_user_id').populate('task_project_id');
    if (toBeRemindedTasks.length > 0) {
        toBeRemindedTasks.forEach(task => {
           
            res.json({
                message: `Task "${task.task_name}" is due in the next ${x} hours.`,
                task: task
            });
            
        });
    } else {
        console.log(`No tasks due in the next ${x} hours.`);
    };

}

module.exports = {AlertXhoursBefore};