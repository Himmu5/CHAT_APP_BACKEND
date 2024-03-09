const ws = require("ws");
const jwt = require("jsonwebtoken");
const MessageModel = require("./models/message");

const setupWss = async (server) => {
  const wss = new ws.WebSocketServer({ server });
  console.log("connection received: ", wss);

  wss.on("connection", (connection, req) => {
    const tokenString = req.headers.cookie;
    if (tokenString) {
      const token = tokenString.split("=")[1];
      jwt.verify(token, process.env.SECRET, {}, (err, userData) => {
        if (err) throw err;
        connection.userId = userData.userId;
        connection.username = userData.user.username;
        // console.log("User connected : ", connection.user);
        connection.send("data");
      });
    }

    connection.on("message", async (message) => {
      const messageData = JSON.parse(message.toString());
      const { recipient, text } = messageData;

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
};
module.exports = { setupWss };
