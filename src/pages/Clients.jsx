import React from "react";

function Clients({ darkMode, toggleMode }) {
  return (
    <div className={`page ${darkMode ? "dark" : ""}`}>
      <h1>Clients</h1>
      <p>Bienvenue sur la page Clients !</p>
    </div>
  );
}

export default Clients;