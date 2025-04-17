import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import MyUserProfil from "./pages/MyUserProfil";
import Wrapper from "./pages/Wrapper";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import DashboardLayout from "./pages/DashboardLayout";
import Clients from "./pages/Clients";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import ParcMateriel from "./pages/ParcMateriel";
import MaterielDetail from "./pages/MaterielDetail"; 
import Factures from "./pages/Factures"; 
import FactureDetail from "./pages/FactureDetail";
import ColumnMapping from './pages/ColumnMapping';

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
    document.documentElement.classList.toggle("dark", darkMode);
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route
          path="/home"
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
        <Route
          path="/forgot-password"
          element={<ForgotPassword darkMode={darkMode} toggleMode={toggleMode} />}
        />
        <Route
          path="/MyUserProfil"
          element={<MyUserProfil darkMode={darkMode} toggleMode={toggleMode} />}
        />

        {/* Routes protégées dans le layout */}
        <Route
          path="/"
          element={<Wrapper darkMode={darkMode} toggleMode={toggleMode} />}
        >
          <Route
            element={
              <DashboardLayout darkMode={darkMode} toggleMode={toggleMode} />
            }
          >
            <Route
              index
              element={<Dashboard darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="dashboard"
              element={<Dashboard darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="calendar"
              element={<Calendar darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="clients"
              element={<Clients darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="leads"
              element={<Leads darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="leads/:id"
              element={<LeadDetail darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="materiel"
              element={<ParcMateriel darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="materiel/:id"
              element={<MaterielDetail darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="factures"
              element={<Factures darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route
              path="factures/:id"
              element={<FactureDetail darkMode={darkMode} toggleMode={toggleMode} />}
            />
            <Route 
            path="/mapping" element={<ColumnMapping />} 
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
