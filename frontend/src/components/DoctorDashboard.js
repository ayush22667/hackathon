import { useEffect, useState } from "react";
import axios from "axios";

const DoctorDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchSessions() {
      const response = await axios.get("http://localhost:5000/sessions");
      setSessions(response.data);
    }
    fetchSessions();
  }, []);

  const downloadReport = async (sessionId) => {
    window.open(`http://localhost:5000/export/${sessionId}`, "_blank");
  };

  return (
    <div className="container">
      <h2>Doctor Dashboard</h2>
      <input
        type="text"
        placeholder="Search Patient ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Responses</th>
            <th>Date</th>
            <th>Report</th>
          </tr>
        </thead>
        <tbody>
          {sessions
            .filter((session) => session.patientId.includes(search))
            .map((session) => (
              <tr key={session._id}>
                <td>{session.patientId}</td>
                <td>
                  {session.responses.map((resp, idx) => (
                    <div key={idx}>
                      <p><strong>Q:</strong> {resp.question}</p>
                      <p><strong>A:</strong> {resp.answer}</p>
                      {resp.audioFile && <audio controls src={`http://localhost:5000/${resp.audioFile}`} />}
                    </div>
                  ))}
                </td>
                <td>{new Date(session.date).toLocaleString()}</td>
                <td>
                  <button onClick={() => downloadReport(session._id)}>Download PDF</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorDashboard;
