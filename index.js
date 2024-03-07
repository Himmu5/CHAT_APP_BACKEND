const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ws = require("ws");
require("dotenv").config();
require("./db_config");
const app = express();
const { authRouter } = require("./routes/auth");
const { messageRouter } = require("./routes/messages");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(authRouter);
app.use(messageRouter);
const server = app.listen(process.env.PORT || 3000);

const wss = new ws.WebSocketServer({ server });

module.exports = { wss }