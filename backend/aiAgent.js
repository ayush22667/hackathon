const fs = require("fs");
const { exec } = require("child_process");

const questions = JSON.parse(fs.readFileSync("questions.json", "utf-8"));

async function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    exec(`python3 vosk-api/python/example/test_simple.py ${audioPath}`, (error, stdout) => {
      if (error) reject(error);
      resolve(stdout.trim().toLowerCase());
    });
  });
}

async function generateVoiceResponse(text, outputPath) {
  return new Promise((resolve, reject) => {
    exec(`tts --text "${text}" --out_path ${outputPath}`, (error) => {
      if (error) reject(error);
      resolve(outputPath);
    });
  });
}

async function getNextQuestion(currentQuestionId, answer) {
  const currentQuestion = questions[currentQuestionId];
  if (!currentQuestion || !currentQuestion.responses[answer]) {
    return { nextQuestionId: "end", questionText: "Thank you for your responses." };
  }
  const nextQuestionId = currentQuestion.responses[answer];
  return { nextQuestionId, questionText: questions[nextQuestionId].question };
}

module.exports = { transcribeAudio, generateVoiceResponse, getNextQuestion };
