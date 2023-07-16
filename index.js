const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { UserModel } = require("./models/users");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const MessageModel = require("./models/message");

const app = express();

app.use(cors({ origin: "*", credentials: true }));

app.use(cookieParser());
app.use(express.json());
const salt = bcrypt.genSaltSync();

main().catch((err) => console.log(err));
main().then((s) => console.log("Db connected"));

async function main() {
  await mongoose.connect(process.env.DB_URL);
}

app.get("/", (req, res) => {
  console.log(req.cookies.token);
  res.send("Test successfull ");
});

app.post("/register", validateCookie, async (req, res) => {
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
        res.cookie("token", token, { sameSite: "none", secure: true });
        console.log(createdUser);
        res.status(201).json(createdUser);
      }
    );
  } catch (err) {
    res.status(400).json("error");
  }
});

function validateCookie(req, res, next) {
  next();
}

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  const findUser = await UserModel.findOne({ username });

  if (findUser) {
    const passOk = bcrypt.compareSync(password, findUser.password);

    if (passOk == true) {
      jwt.sign(
        { userId: findUser._id, username },
        process.env.SECRET,
        (err, token) => {
          res
            .cookie("token", token, { secure: true, sameSite: "none" })
            .status(200)
            .json(findUser);
        }
      );
    } else {
      res.status(404).json("Invalid Credacial!!");
    }
  } else {
    res.status(400).json("Invalid Credientials!!!");
  }
});

app.get("/profile", (req, res) => {
  const token = req.cookies.token;
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
});

app.get("/messages/:userId", async (req, res) => {
  const userData = await getUserData(req);
  const { userId } = req.params;
  const myUserId = userData.userId;

  const messages = await MessageModel.find({
    sender: { $in: [userId, myUserId] },
    recipient: { $in: [userId, myUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

function getUserData(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, process.env.SECRET, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

const server = app.listen(process.env.PORT || 3000);

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {
  const cookie = req.headers.cookie;
  if (cookie) {
    const tokenString = cookie
      .split(";")
      .find((str) => str.startsWith("token="));

    if (tokenString) {
      const token = tokenString.split("=")[1];
      if (token) {
        jwt.verify(token, process.env.SECRET, {}, (err, userData) => {
          if (err) throw err;
          connection.userId = userData.userId;
          connection.username = userData.username;
          connection.send("data");
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text } = messageData;
    console.log("Message :", text);
    if (recipient && text) {
      const MessageDoc = await MessageModel.create({
        recipient,
        text,
        sender: connection.userId,
      });

      [...wss.clients]
        .filter((c) => c.userId == recipient)
        .forEach((c) => c.send(JSON.stringify(MessageDoc)));
    }
  });

  [...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    );
  });
  // console.log(wss.clients);
});
