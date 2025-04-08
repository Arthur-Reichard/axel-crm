import React, { useEffect, useState } from "react";
import { fetchFactures } from "../services/facturesService";
import { useNavigate } from "react-router-dom";
import "../pages/css/Factures.css";

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFactures = async () => {
      try {
        const data = await fetchFactures();
        setFactures(data);
      } catch (error) {
        console.error("Erreur lors du chargement des factures :", error);
      }
    };
    loadFactures();
  }, []);

  return (
    <div className="factures-container">
      <h1 className="factures-title">Liste des factures</h1>

      <button
        onClick={() => navigate("/factures/new")}
        className="btn-add-facture"
      >
        + Ajouter une facture
      </button>

      <table className="factures-table">
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Client</th>
            <th>Date émission</th>
            <th>Statut</th>
            <th>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((facture) => (
            <tr key={facture.id}>
              <td>{facture.numero}</td>
              <td>{facture.client_id}</td> {/* Tu pourras remplacer par nom du client plus tard */}
              <td>{facture.date_emission}</td>
              <td>{facture.statut}</td>
              <td>{facture.total_ttc ?? "—"} €</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Factures;
