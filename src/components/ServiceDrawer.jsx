import { useEffect, useState } from "react";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { supabase } from "../helper/supabaseClient";
import { FiEdit, FiCheck, FiTrash, FiChevronDown, FiChevronUp } from "react-icons/fi";
import "./css/ServiceDrawer.css";
import ServiceTreePopup from "./ServiceTreePopup";

function DroppableService({ service, selectedServiceId, onSelect, onDrop, level = 0, children }) {
    const { isOver, setNodeRef } = useDroppable({
        id: service.id || `all-${service.nom}`, // string ID obligatoire
        data: { service },
    });

    return (
        <div
        ref={setNodeRef}
        className={`drawer-item-service ${level > 0 ? "sub" : ""} ${service.id === selectedServiceId ? 'active' : ''}`}
        onClick={() => onSelect(service.id)}
        style={{ backgroundColor: isOver ? '#e0f7fa' : undefined }}
        >
        {/* 👇 Avatar uniquement au niveau 0 */}
        {level === 0 && (
            <div className="avatar-service">
            {(service.nom && service.nom[0]) ? service.nom[0].toUpperCase() : '∅'}
            </div>
        )}

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
    const [expandedIds, setExpandedIds] = useState([]);
    const [showTreePopup, setShowTreePopup] = useState(false);

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

        const attachChildren = (service) => ({
        ...service,
        children: (childrenMap[service.id] || []).map(attachChildren),
        });

        const structured = rootServices.map(attachChildren);
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

    const toggleExpand = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
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

    const buildTree = (parentId = null) =>
        services
            .filter(s => s.parent_id === parentId)
            .map(s => ({
            ...s,
            children: buildTree(s.id),
            }));

    const buildFlatList = (nodes, level = 0) =>
    nodes.flatMap(node => {
        const prefix = "— ".repeat(level);
        const entry = { id: node.id, label: prefix + node.nom };
        const children = buildFlatList(node.children || [], level + 1);
        return [entry, ...children];
    });

    const flatList = buildFlatList(services);

    const renderServiceTree = (service, level = 0) => (
    <div key={service.id} style={{ paddingLeft: `${level * 12}px` }}>
        <DroppableService
        service={service}
        selectedServiceId={selectedServiceId}
        onSelect={onSelect}
        level={level} // 👈 important
        >
        {service.id !== null && (
        editingId === service.id ? (
            <>
            <FiCheck size={18} onClick={() => handleSaveEdit(service.id)} />
            {/* Pas de suppression en mode édition */}
            </>
        ) : (
            <>
            <FiEdit size={18} onClick={() => handleEdit(service.id, service.nom)} />
            {service.children?.length > 0 ? (
                <button className="toggle-button" onClick={() => toggleExpand(service.id)}>
                {expandedIds.includes(service.id) ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                ) : (
                <FiTrash size={18} onClick={() => handleDeleteService(service.id)} />
            )}
            </>
        )
        )}
        </DroppableService>

        {expandedIds.includes(service.id) && service.children?.map(child =>
            renderServiceTree(child, level + 1)
        )}
    </div>
    );
    {showTreePopup && <ServiceTreePopup onClose={() => setShowTreePopup(false)} />}

    return (
    <div className="service-drawer">
        {/* ✅ Bouton organigramme */}
        <div className="tree-button-wrapper">
        <button onClick={() => setShowTreePopup(true)} className="organigramme-button">
            Voir l’organigramme
        </button>
        </div>

        <div className="drawer-scroll">
        {services.map(service => renderServiceTree(service))}
        </div>

        {/* ✅ Footer ajout de service */}
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
            {flatList.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
            ))}
        </select>
        <button className="settings-button-service" onClick={handleAddService}>
            + Ajouter un service
        </button>
        </div>

        {/* ✅ Affichage du popup si activé */}
        {showTreePopup && <ServiceTreePopup onClose={() => setShowTreePopup(false)} />}
    </div>
    );
}