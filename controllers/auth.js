
const {UserModel} = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = bcrypt.genSaltSync();


const registerUser = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const hashedPassword = bcrypt.hashSync(password, salt);
      const createdUser = await UserModel.create({
        username,
        password: hashedPassword,
      });
      jwt.sign(
        { userId: createdUser._id, user: createdUser },
        process.env.SECRET,
        {},
        (err, token) => {
          res.cookie("token", token).status(201).json({ user: createdUser, token });
        }
      );
    } catch (err) {
      res.status(400).json("error");
    }
  }

const signinUser = async (req, res) => {
    const { username, password } = req.body;
  
    const findUser = await UserModel.findOne({ username });
  
    if (findUser) {
      const passOk = bcrypt.compareSync(password, findUser.password);
  
      if (passOk == true) {
        jwt.sign(
          { userId: findUser._id, user: findUser },
          process.env.SECRET,
          (err, token) => {
            res
              .cookie("token", token)
              .status(200)
              .json({ user: findUser, token });
          }
        );
      } else {
        res.status(404).json("Invalid Credacial!!");
      }
    } else {
      res.status(400).json("Invalid Credientials!!!");
    }
  }

  const reAuth = (req, res) => {
    const token = req.headers.authorization;
    if (token) {
      jwt.verify(token, process.env.SECRET, {}, (err, decoded) => {
        if (err) {
          res.status(422).json("error");
        } else {
          res.status(200).json(decoded);
        }
      });
    } else {
      res.status(401).json("No token found");
    }
  }

module.exports = { registerUser, signinUser, reAuth }