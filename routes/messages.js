const express = require("express");
const messageRouter = express.Router();
const MessageController = require("../controllers/messages");
const { validateCookie } = require("../middlewares/auth");



messageRouter.get("/messages/:userId", MessageController.getMessages );
messageRouter.post("/chat", MessageController.aiQuery );
  


module.exports = { messageRouter }
  