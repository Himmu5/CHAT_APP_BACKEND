const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username:{ type:String , unique:true ,require:true , min:2 },
    password:{ type:String , require:true , min:6 }
} , {timestamps:true})


exports.UserModel = mongoose.model('User' , UserSchema);
