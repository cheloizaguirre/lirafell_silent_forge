import { Route, Routes } from "react-router";
import { LandingPage } from "./routes/LandingPage";
import { JoinPage } from "./routes/JoinPage";
import { PlayPage } from "./routes/PlayPage";
import { DmPage } from "./routes/DmPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/join/:code?" element={<JoinPage />} />
      <Route path="/play/:code" element={<PlayPage />} />
      <Route path="/dm/:code" element={<DmPage />} />
    </Routes>
  );
}

export default App;
