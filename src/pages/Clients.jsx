import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";

function Clients({ darkMode }) {
  const [clients, setClients] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [newClient, setNewClient] = useState({ nom: "", email: "", telephone: "" });
  const [newField, setNewField] = useState({ nom_champ: "", type_champ: "text", valeur: "" });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*, champs_personnalises_clients(*)");
    if (!error) setClients(data);
  };

  const addClient = async () => {
    const { data, error } = await supabase.from("clients").insert([newClient]).select();
    if (!error && data.length > 0) {
      setClients([...clients, { ...data[0], champs_personnalises_clients: [] }]);
      setNewClient({ nom: "", email: "", telephone: "" });
    }
  };

  const addCustomField = async (client_id) => {
    const { error } = await supabase.from("champs_personnalises_clients").insert({
      client_id,
      ...newField,
    });
    if (!error) {
      setNewField({ nom_champ: "", type_champ: "text", valeur: "" });
      fetchClients();
    }
  };

  return (
    <div className={`page ${darkMode ? "dark" : ""}`}>
      <h1>Clients</h1>
      <div className="add-client-form">
        <input
          type="text"
          placeholder="Nom"
          value={newClient.nom}
          onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newClient.email}
          onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Téléphone"
          value={newClient.telephone}
          onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
        />
        <button onClick={addClient}>Ajouter le client</button>
      </div>

      {clients.map((client) => (
        <div key={client.id} className="client-card">
          <h3>{client.nom}</h3>
          <p>Email : {client.email}</p>
          <p>Téléphone : {client.telephone}</p>

          <div className="custom-fields">
            <h4>Champs personnalisés</h4>
            {client.champs_personnalises_clients?.map((field) => (
              <div key={field.id}>
                <strong>{field.nom_champ} :</strong> {field.valeur}
              </div>
            ))}

            <div className="add-custom-field">
              <input
                type="text"
                placeholder="Nom du champ"
                value={newField.nom_champ}
                onChange={(e) => setNewField({ ...newField, nom_champ: e.target.value })}
              />
              <select
                value={newField.type_champ}
                onChange={(e) => setNewField({ ...newField, type_champ: e.target.value })}
              >
                <option value="text">Texte</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="boolean">Oui/Non</option>
              </select>
              <input
                type="text"
                placeholder="Valeur"
                value={newField.valeur}
                onChange={(e) => setNewField({ ...newField, valeur: e.target.value })}
              />
              <button onClick={() => addCustomField(client.id)}>+ Ajouter</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Clients;