const userModel = require('../models/user.model');
const blacklisttokenModel = require('../models/blacklisttoken.model'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.register = async(req, res) => {
    try{
        const {name, email, password} = req.body;
        const user = await userModel.findOne({email});

        if(user){
            return res.status(400).json({message: 'User already existed'});
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = new userModel({name, email, password: hash});

        await newUser.save();

        const token = jwt.sign({email: email, _id : newUser._id}, process.env.JWT_SECRET, {expiresIn: '1h'});

        res.cookie('token', token);

        res.send({message: 'User registered successfully'});
    } catch(error){
        res.status(500).json({message: error.message});
    }
}

module.exports.login = async(req, res) => {
    try {
        const {email, password} = req.body;
        const user = await userModel.findOne({email}).select('+password');

        if(!user){
            return res.status(400).json({message: 'Invalid Email or Password'});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({message: 'Invalid Email or Password'});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});

        res.cookie('token', token);

        res.send({message: 'User logged in successfully'})
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports.logout = async(req, res) => {
    try{
        const token = req.cookies.token;
        await blacklisttokenModel.create({token});
        res.clearCookie('token');
        res.send({message: 'User logged out successfullly'});
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

module.exports.profile = async(req, res) => {
    try {
        res.send(req.user);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}