import React from "react";

function Calendar({ darkMode }) {
  return (
    <div className={`dashboard ${darkMode ? "dark" : ""}`}>
      <main className="dashboard-main">
        <h1>📅 Mon calendrier</h1>
        <p>Tu pourras bientôt voir et gérer tous tes rendez-vous ici.</p>
      </main>
    </div>
  );
}

export default Calendar;
