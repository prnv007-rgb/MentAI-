
const express = require("express");
const cors = require("cors");
const jwt =require("jsonwebtoken");
const mongoose = require("mongoose");
const { WebSocket, WebSocketServer } = require("ws");
const url = require("url");
const { UserModel, ClientModel, QuizModel, QuestionModel } = require("./models");
const { CreateUserInput } = require("./types");
const { middle, adminOnly } = require("./middle");
const fetch = require('node-fetch');
const axios=require('axios')
require('dotenv').config();
const MONGO_URI = "mongodb+srv://jomalsanish:jpCnQ4RW7N5WcA@cluster0todo.kbphbap.mongodb.net/menti?retryWrites=true&w=majority&appName=Cluster0todo";
const JWT_SECRET = "abc123"; 
const apiKey = process.env.GEMINI_API_KEY;
mongoose.connect(MONGO_URI).then(() => {
    console.log("MongoDB connected successfully.");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

const app = express();
app.use(cors());
app.use(express.json());




app.post("/signup", async (req, res) => {
  try {
    const response = CreateUserInput.safeParse(req.body);
    if (!response.success) {
      return res.status(411).json({ message: "Incorrect inputs", errors: response.error.flatten().fieldErrors });
    }

    const { username, password } = response.data;
    
   
    await UserModel.create({ username, password });
    
    res.status(201).json({ message: "Admin user created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error: error.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await UserModel.findOne({ username, password });

    if (!user) {
      return res.status(403).json({ message: "Incorrect credentials" });
    }
    
    const token = jwt.sign({ username: user.username, role: 'admin' }, JWT_SECRET);
    res.json({ token });

  } catch (error) {
    res.status(500).json({ message: "Error signing in", error: error.message });
  }
});

app.post("/client_signup", async (req, res) => {
    try {
        const response = CreateUserInput.safeParse(req.body); 
        if (!response.success) {
            return res.status(411).json({ message: "Incorrect inputs", errors: response.error.flatten().fieldErrors });
        }
        
        const { username, password } = response.data;

        await ClientModel.create({ username, password });

        res.status(201).json({ message: "Client signed up successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating client", error: error.message });
    }
});

app.post("/client_signin", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await ClientModel.findOne({ username, password });

        if (!user) {
            return res.status(403).json({ message: "Incorrect credentials" });
        }
        
       
        const token = jwt.sign({ username: user.username, role: 'client' }, JWT_SECRET);
        res.json({ token });

    } catch (error) {
        res.status(500).json({ message: "Error signing in client", error: error.message });
    }
});



app.use(middle);

app.post("/create", async (req, res) => {
  const { question, options, correct } = req.body;

  if (!question || !options || !Array.isArray(options) || typeof correct !== "number") {
    return res.status(400).json({ message: "Invalid question format" });
  }

  try {
    const newQuestion = await QuestionModel.create({ question, options, correct });
    res.status(201).json({
      message: "Question created successfully",
      qid: newQuestion._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating question", error: error.message });
  }
});

app.post("/start", async (req, res) => {
  try {
    const { count = 5, title = "New Quiz" } = req.body;
    const wss = req.app.get("wss");

    const selectedQuestions = await QuestionModel.aggregate([
      { $sample: { size: Number(count) } },
      { $project: { _id: 1 } },
    ]);

    const questionIds = selectedQuestions.map((q) => q._id);

    if (questionIds.length === 0) {
        return res.status(404).json({ message: "No questions found to start a quiz." });
    }

    const newQuiz = await QuizModel.create({
      title,
      questions: questionIds,
      isActive: true,
    });

    const fullQuestions = await QuestionModel.find({ _id: { $in: questionIds } }).select("question options");

    res.json({
      message: "Quiz created and starting now...",
      quizId: newQuiz._id,
    });

   
    let i = 0;
    const interval = setInterval(() => {
      if (i >= fullQuestions.length || !wss) {
        clearInterval(interval);
    
        if (wss) {
            const endPayload = JSON.stringify({ type: "quiz_end", quizId: newQuiz._id });
            wss.clients.forEach(client => client.readyState === WebSocket.OPEN && client.send(endPayload));
        }
      
        QuizModel.findByIdAndUpdate(newQuiz._id, { isActive: false }).exec();
        return;
      }

      const payload = JSON.stringify({
        type: "question",
        quizId: newQuiz._id,
        questionIndex: i,
        data: fullQuestions[i],
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
      i++;
    }, 5000); // 5-second interval
  } catch (err) {
    res.status(500).json({ message: "Failed to start quiz", error: err.message });
  }
});

app.post("/view", async (req, res) => {
  try {
    const { id } = req.body; 
    if (!id) {
        return res.status(400).json({ message: "Quiz ID is required." });
    }

    const selectedQuiz = await QuizModel.findById(id).populate({
      path: "questions",
      select: "question options",
    });

    if (!selectedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    
    res.json({
      quizId: selectedQuiz._id,
      title: selectedQuiz.title,
      questions: selectedQuiz.questions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz", error: error.message });
  }
});


app.post("/generate-questions", adminOnly, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required." });
  }

  const schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        question: { type: "STRING" },
        options: { type: "ARRAY", items: { type: "STRING" } },
        correct: { type: "NUMBER" }
      },
      required: ["question", "options", "correct"]
    }
  };

  const payload = {
    contents: [{
      parts: [{
        text: `Based on the following topic, generate a valid JSON array of multiple-choice questions that strictly follows this JSON schema: ${JSON.stringify(schema)}. The 'correct' field must be the zero-based index of the correct answer in the 'options' array. Topic: "${prompt}"`
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  };

  const API_KEY = `${apiKey}`;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  
  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      throw new Error(`Gemini API request failed: ${apiResponse.status} ${errorBody}`);
    }

    const result = await apiResponse.json();
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error("Invalid response structure from Gemini API.");
    }

    const questions = JSON.parse(generatedText);
    const savedQuestions = await QuestionModel.insertMany(questions);

    res.status(201).json({
      message: `${savedQuestions.length} questions generated and saved successfully!`,
      count: savedQuestions.length
    });

  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    res.status(500).json({ message: "Failed to generate questions.", error: error.message });
  }
});
const server = app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

const wss = new WebSocketServer({ server });
app.set("wss", wss);

wss.on('connection', (ws, req) => {
    const token = url.parse(req.url, true).query.token;
    if (!token) {
        console.log("Connection rejected: No token provided.");
        return ws.terminate();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Connection rejected: Invalid token.");
            return ws.terminate();
        }
        
        ws.user = decoded;
        console.log(`WebSocket client connected and authenticated: ${ws.user.username}`);

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                if (message.type === "submit_answer") {
                    const username = ws.user.username; 
                    const { questionId, answerIndex } = message;
                    const question = await QuestionModel.findById(questionId);
                    if (!question) return console.log(`Question not found: ${questionId}`);

                    if (question.correct === answerIndex) {
                        console.log(`✅ Correct answer from ${username}`);
                        const scorePayload = { username, score: 10 };
                        await axios.post("http://localhost:4000/update", scorePayload);
                        console.log(` Sent score update for ${username} to Go service.`);
                    } else {
                        console.log(`❌ Incorrect answer from ${username}`);
                    }
                }
            } catch (e) {
                console.log(" Error processing message:", e.message);
            }
        });

        ws.on('close', () => console.log(`WebSocket client disconnected: ${ws.user.username}`));
    });

    
    ws.on('error', (error) => console.error("WebSocket error:", error));
});