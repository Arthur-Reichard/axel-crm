import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wrapper from "./pages/Wrapper";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import DashboardLayout from "./pages/DashboardLayout"; // <-- à créer

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  const toggleMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("darkMode", next);
      return next;
    });
  };

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route
          path="/"
          element={<Home darkMode={darkMode} toggleMode={toggleMode} />}
        />
        <Route
          path="/register"
          element={<Register darkMode={darkMode} toggleMode={toggleMode} />}
        />
        <Route
          path="/login"
          element={<Login darkMode={darkMode} toggleMode={toggleMode} />}
        />

        {/* Pages protégées avec layout navbar */}
        <Route
          path="/"
          element={<Wrapper darkMode={darkMode} toggleMode={toggleMode} />}
        >
          <Route
            element={<DashboardLayout darkMode={darkMode} toggleMode={toggleMode} />}
          >
            <Route
              path="dashboard"
              element={<Dashboard darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="calendar"
              element={<Calendar darkMode={darkMode} toggleMode={toggleMode} />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
