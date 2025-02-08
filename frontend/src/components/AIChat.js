import { useState, useRef, useEffect } from "react";
import axios from "axios";

const AIChat = () => {
  const [message, setMessage] = useState("Initializing...");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    async function startSession() {
      const response = await axios.get("http://localhost:5000/start");
      setMessage(response.data.question);
      playAudio(response.data.voice);
    }
    startSession();
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await axios.post("http://localhost:5000/conversation", formData);
      setMessage(response.data.question);
      if (response.data.voice) playAudio(response.data.voice);
    };

    audioChunks.current = [];
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const playAudio = (audioFile) => {
    if (!audioFile) return;
    const audio = new Audio(`http://localhost:5000/${audioFile}`);
    audio.play();
  };

  return (
    <div>
      <h2>AI Medical Assistant</h2>
      <p>{message}</p>
      {recording ? <button onClick={stopRecording}>Stop</button> : <button onClick={startRecording}>Start</button>}
    </div>
  );
};

export default AIChat;
