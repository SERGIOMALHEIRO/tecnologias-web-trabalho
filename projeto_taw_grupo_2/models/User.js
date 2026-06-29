const mongoose = require('mongoose'); 

const UserSchema = new mongoose.Schema({ 
    username: {
        type: String,
        required: true,  
        unique: true,    
        trim: true       
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true   
    },
    password: {
        type: String,
        required: true
    },
    nome: {
        type: String,
        required: true
    },
   
    telemovel: String,
    nif: String,
    morada: String,
    fotografia: String,
    isAdmin: {
        type: Boolean,
        default: false   
    }
}, {
    timestamps: true     
});

const User = mongoose.model('User', UserSchema); 

module.exports = User; 
