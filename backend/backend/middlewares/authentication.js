const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const User = require("../models/User");
require('dotenv').config(); 


function authenticateJWT(req, res, next) {

  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. Invalid token format." });
  


  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token." });
    req.user = user;
    next();
  });
}




async function user_login(req, res) {
  try {
    const { useremail, password } = req.body;
 
    const user = await User.findOne({ user_email: useremail});
     
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

  

  //  const isMatch = await bcrypt.compare(password, user.user_password);
  //  if (!isMatch) {
  //    return res.status(401).json({ message: "Invalid password" });
  //  }

  //   console.log("Stored password:", user.user_password);  
 //   console.log("Password match:", password === user.user_password);  

  const isMatch = password === user.user_password;
    if (!isMatch) {   
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, user_name: user.user_name, user_email: user.user_email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '4h' }
    );

  //  res.json({ token ,redirectTo:`/${user._id}/dashboard`, user: { id: user._id, user_name: user.user_name, user_email: user.user_email } });
    res.json({message:"Login successful",user:user, token});
 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  authenticateJWT,
  user_login
};