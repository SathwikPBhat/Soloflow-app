const User = require('../models/User');
const bcrypt=require('bcrypt')
const {isValidPassword}=require('../utils/validatePassword');
async function registerUser(req, res) {
  try {
    const { user_name, user_email, user_password, user_company } = req.body;
    if (!user_name || !user_email || !user_password || !user_company) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Use async/await instead of callbacks
    const existingUser = await User.findOne({ user_email: user_email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists, Log In instead" });
    }

    if(!isValidPassword(user_password)){
      return res.status(400).json({ message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
    }

    


 //   const hashedPassword = await bcrypt.hash(user_password, 10);
    const newUser = new User({
      user_name: user_name,
      user_email: user_email,
      user_password:user_password, 
      user_company: user_company
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: savedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateUserDetails(req, res) {
  try {
    const { user_id } = req.params;
    const { user_name, user_email, user_company, user_bio } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        user_name,
        user_email,
        user_company,
        user_bio,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

    async function getUserById(req, res) {
        try {
            const { user_id } = req.params;

            if (!user_id) {
                return res.status(400).json({ message: "User ID is required" });
            }

            const user = await User.findById(user_id);    
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ user });
        }catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    }

    module.exports = {
        registerUser,
        updateUserDetails,
        getUserById
    };