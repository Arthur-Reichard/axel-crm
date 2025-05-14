import { useEffect, useState } from "react";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { supabase } from "../helper/supabaseClient";
import { FiEdit, FiCheck, FiTrash } from "react-icons/fi";
import "./css/ServiceDrawer.css";

function DroppableService({ service, selectedServiceId, onSelect, onDrop, isSub = false, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: service.id || `all-${service.nom}`, // string ID obligatoire
    data: { service },
  });

  return (
    <div
      ref={setNodeRef}
      className={`drawer-item-service ${isSub ? "sub" : ""} ${service.id === selectedServiceId ? 'active' : ''}`}
      onClick={() => onSelect(service.id)}
      style={{ backgroundColor: isOver ? '#e0f7fa' : undefined }}
    >
      <div className="avatar-service">{(service.nom?.[0] || '').toUpperCase()}</div>
      <div style={{ flex: 1 }}>
        <strong>{service.nom}</strong>
      </div>
      {children}
    </div>
  );
}

export default function ServiceDrawer({ onSelect, selectedServiceId }) {
    const [services, setServices] = useState([]);
    const [entrepriseId, setEntrepriseId] = useState(null);
    const [newServiceName, setNewServiceName] = useState("");
    const [selectedParent, setSelectedParent] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editedName, setEditedName] = useState("");

    useEffect(() => {
        const fetchEntrepriseId = async () => {
        const { data: user } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("utilisateurs")
            .select("entreprise_id")
            .eq("id", user?.user?.id)
            .single();

        if (!error && data?.entreprise_id) {
            setEntrepriseId(data.entreprise_id);
        }
        };

        fetchEntrepriseId();
    }, []);

    const fetchServices = async () => {
        if (!entrepriseId) return;

        const { data, error } = await supabase
        .from("services")
        .select("id, nom, parent_id")
        .eq("entreprise_id", entrepriseId)
        .order("nom");

        if (!error && data) {
        const allEmployeesEntry = { id: null, nom: "Tous les employés", parent_id: null };
        const fullList = [allEmployeesEntry, ...data];

        const rootServices = fullList.filter(s => !s.parent_id);
        const childrenMap = {};
        fullList.forEach(s => {
            if (s.parent_id) {
            if (!childrenMap[s.parent_id]) childrenMap[s.parent_id] = [];
            childrenMap[s.parent_id].push(s);
            }
        });

        const structured = rootServices.map(parent => ({
            ...parent,
            children: childrenMap[parent.id] || []
        }));

        setServices(structured);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [entrepriseId]);

    const handleAddService = async () => {
        if (!newServiceName.trim() || !entrepriseId) return;

        const { data, error } = await supabase
        .from("services")
        .insert([{ nom: newServiceName.trim(), entreprise_id: entrepriseId, parent_id: selectedParent || null }])
        .select();

        if (!error && data) {
        setNewServiceName("");
        setSelectedParent(null);
        fetchServices();
        }
    };

    const handleEdit = (id, name) => {
        setEditingId(id);
        setEditedName(name);
    };

    const handleSaveEdit = async (id) => {
        const { error } = await supabase
        .from("services")
        .update({ nom: editedName.trim() })
        .eq("id", id);

        if (!error) {
        setEditingId(null);
        setEditedName("");
        fetchServices();
        }
    };

    const handleDeleteService = async (id) => {
        const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

        if (!error) {
        fetchServices();
        if (selectedServiceId === id) onSelect(null);
        } else {
        alert("❌ Impossible de supprimer ce service. Il est peut-être utilisé.");
        }
    };

    const handleDrop = async (event) => {
    const droppedUser = event?.active?.data?.current?.user;
    const targetService = event?.over?.data?.current?.service;

    console.log("📦 DROP détecté !");
    console.log("👤 Utilisateur :", droppedUser);
    console.log("🎯 Cible service :", targetService);

    if (!droppedUser || !targetService) {
        console.warn("⛔ Utilisateur ou service manquant");
        return;
    }

    const { error } = await supabase
        .from("utilisateurs")
        .update({ service_id: targetService.id || null })
        .eq("id", droppedUser.id);

    if (error) {
        console.error("❌ Erreur mise à jour service_id :", error);
    } else {
        console.log(`✅ Utilisateur déplacé dans ${targetService.nom} (id: ${targetService.id})`);
        fetchServices();
    }
    };



    return (
        <div className="service-drawer">
            <div className="drawer-scroll">
            {services.map(service => (
                <div key={service.id ?? "all"}>
                <DroppableService
                    service={service}
                    selectedServiceId={selectedServiceId}
                    onSelect={onSelect}
                >
                    {service.id !== null && (
                    editingId === service.id ? (
                        <>
                        <FiCheck size={18} onClick={() => handleSaveEdit(service.id)} />
                        <FiTrash size={18} onClick={() => handleDeleteService(service.id)} />
                        </>
                    ) : (
                        <>
                        <FiEdit size={18} onClick={() => handleEdit(service.id, service.nom)} />
                        <FiTrash size={18} onClick={() => handleDeleteService(service.id)} />
                        </>
                    )
                    )}
                </DroppableService>

                {service.children?.map(child => (
                    <DroppableService
                    key={child.id}
                    service={child}
                    selectedServiceId={selectedServiceId}
                    onSelect={onSelect}
                    isSub
                    >
                    {editingId === child.id ? (
                        <FiCheck size={18} onClick={() => handleSaveEdit(child.id)} />
                    ) : (
                        <FiEdit size={18} onClick={() => handleEdit(child.id, child.nom)} />
                    )}
                    </DroppableService>
                ))}
                </div>
            ))}
            </div>

        {/* Footer pour ajouter un nouveau service */}
        <div className="drawer-footer-service">
            <input
            type="text"
            placeholder="Nom du service"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            />
            <select
            value={selectedParent || ""}
            onChange={(e) => setSelectedParent(e.target.value || null)}
            >
            <option value="">Aucun (service principal)</option>
            {services
                .filter(s => s.id !== null)
                .map(s => (
                <option key={s.id} value={s.id}>
                    {s.nom}
                </option>
                ))}
            </select>
            <button className="settings-button" onClick={handleAddService}>
            + Ajouter un service
            </button>
        </div>
        </div>
    );
}