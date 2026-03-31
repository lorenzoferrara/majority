import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import SignIn from "./pages/SignIn";
import Admin from "./pages/Admin";
import Polls from "./pages/Polls";
import Poll from "./pages/Poll";
import Results from "./pages/Results";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/polls/:pollId" element={<Poll />} />
        <Route path="/results/:pollId" element={<Results />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
