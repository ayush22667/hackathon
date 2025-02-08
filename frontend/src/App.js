import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AIChat from "./components/AIChat";
import DoctorDashboard from "./components/DoctorDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AIChat />} />
        <Route path="/dashboard" element={<DoctorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
