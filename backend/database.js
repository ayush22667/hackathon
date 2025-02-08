const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const SessionSchema = new mongoose.Schema({
  patientId: String,
  responses: [{ question: String, answer: String, audioFile: String }],
  date: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", SessionSchema);

module.exports = Session;
