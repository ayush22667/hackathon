const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Session = require("./database");
const generatePDF = require("./generateReport");
const { transcribeAudio, generateVoiceResponse, getNextQuestion } = require("./aiAgent");

const questions = JSON.parse(fs.readFileSync("questions.json", "utf-8"));

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let currentQuestionId = "q1";

app.get("/start", async (req, res) => {
  const voiceFile = `output_${Date.now()}.wav`;
  await generateVoiceResponse(questions[currentQuestionId].question, voiceFile);
  res.json({ question: questions[currentQuestionId].question, voice: voiceFile });
});

app.post("/conversation", upload.single("audio"), async (req, res) => {
  const transcript = await transcribeAudio(req.file.path);
  const { nextQuestionId, questionText } = await getNextQuestion(currentQuestionId, transcript);

  const patientId = req.body.patientId || "anonymous";
  await Session.findOneAndUpdate(
    { patientId },
    { $push: { responses: { question: questions[currentQuestionId].question, answer: transcript, audioFile: req.file.path } } },
    { upsert: true, new: true }
  );

  currentQuestionId = nextQuestionId;

  if (nextQuestionId === "end") {
    res.json({ question: "Session complete. Thank you!", voice: null });
  } else {
    const voiceFile = `output_${Date.now()}.wav`;
    await generateVoiceResponse(questionText, voiceFile);
    res.json({ question: questionText, voice: voiceFile });
  }
});

app.get("/sessions", async (req, res) => {
  const sessions = await Session.find().sort({ date: -1 });
  res.json(sessions);
});

app.get("/export/:sessionId", async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).send("Session not found");

    const outputPath = `reports/report_${session.patientId}.pdf`;
    await generatePDF(session, outputPath);
    res.download(outputPath);
  } catch (error) {
    res.status(500).send("Error generating PDF");
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
