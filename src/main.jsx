import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Admin from "./pages/Admin";
import Polls from "./pages/Polls";
import Poll from "./pages/Poll";
import Results from "./pages/Results";
import SignIn from "./pages/SignIn";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/polls/:pollId" element={<Poll />} />
          <Route path="/results/:pollId" element={<Results />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
