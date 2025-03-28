import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wrapper from "./pages/Wrapper";

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
        {/* home */}
        <Route
          path="/"
          element={<Home darkMode={darkMode} toggleMode={toggleMode} />}
        />

        {/* register */}
        <Route
          path="/register"
          element={<Register darkMode={darkMode} toggleMode={toggleMode} />}
        />

        {/* login */}
        <Route
          path="/login"
          element={<Login darkMode={darkMode} toggleMode={toggleMode} />}
        />

        {/* dashboard via wrapper */}
        <Route
          path="/dashboard"
          element={<Wrapper darkMode={darkMode} toggleMode={toggleMode} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
