const MessageModel = require("../models/message");
const jwt = require("jsonwebtoken");
const OpenAIApi = require("openai");

const openai = new OpenAIApi({
  apiKey: process.env.OPEN_AI_KEY,
});


const getMessages = async (req, res) => {
    const userData = await getUserData(req);
    const { userId } = req.params;
    const myUserId = userData.userId;
  
    const messages = await MessageModel.find({
      sender: { $in: [userId, myUserId] },
      recipient: { $in: [userId, myUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
}

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

const aiQuery = async (req, res) => {
  try {
    const query = req.body?.query;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Select the engine you prefer
      messages: [{ role: "user", content: query }],
      max_tokens: 100,
    });
    console.log(completion);
    res.json({ response: completion?.choices[0]?.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getMessages,aiQuery }