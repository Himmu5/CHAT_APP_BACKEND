const express = require("express");
const authRouter = express.Router();
const AuthController = require("../controllers/auth");
const { validateCookie } = require("../middlewares/auth");

authRouter.post("/register", validateCookie, AuthController.registerUser);
authRouter.post("/signin", AuthController.signinUser);
authRouter.get("/profile", AuthController.reAuth);

module.exports = { authRouter }