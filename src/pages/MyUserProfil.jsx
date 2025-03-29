import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";

function Clients({ darkMode }) {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({ nom: "", email: "", telephone: "" });
  const [newField, setNewField] = useState({ nom_champ: "", type_champ: "text", valeur: "" });
  const [userEntrepriseId, setUserEntrepriseId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
  
      console.log("ID utilisateur :", userId); // 🔍 Vérifie que l'utilisateur est bien connecté
  
      if (!userId) return;
  
      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", userId)
        .single();
  
      if (userError) {
        console.error("Erreur lors de la récupération de l'utilisateur:", userError.message);
        return;
      }
  
      console.log("Entreprise récupérée :", userData); // 🔍 Vérifie que l’entreprise est bien liée
  
      setUserEntrepriseId(userData?.entreprise_id);
      fetchClients(userData?.entreprise_id);
    };
  
    init();
  }, []);
  

  const fetchClients = async (entrepriseId) => {
    if (!entrepriseId) return;
    const { data, error } = await supabase
      .from("clients")
      .select("*, champs_personnalises_clients:champs_personnalises_clients(*)")
      .eq("entreprise_id", entrepriseId);

    if (error) {
      console.error("Erreur lors du fetch des clients:", error.message);
      return;
    }
    setClients(data);
  };

  const addClient = async () => {
    if (!userEntrepriseId) {
      alert("Entreprise non trouvée");
      return;
    }
  
    const clientToSend = { ...newClient, entreprise_id: userEntrepriseId };
    console.log("Client à insérer :", clientToSend); // 🔍 Important pour valider le contenu envoyé
  
    const { data, error } = await supabase
      .from("clients")
      .insert([clientToSend])
      .select();
  
    if (error) {
      console.error("Erreur d'ajout:", error.message); // 🔥 Si 403, on le voit ici
      alert("Erreur lors de l'ajout du client: " + error.message);
      return;
    }
  
    if (data && data.length > 0) {
      fetchClients(userEntrepriseId);
      setNewClient({ nom: "", email: "", telephone: "" });
    }
  };
  

  const addCustomField = async (client_id) => {
    const { error } = await supabase.from("champs_personnalises_clients").insert({
      client_id,
      ...newField,
    });
    if (error) {
      console.error("Erreur lors de l'ajout du champ personnalisé:", error.message);
      return;
    }
    setNewField({ nom_champ: "", type_champ: "text", valeur: "" });
    fetchClients(userEntrepriseId);
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