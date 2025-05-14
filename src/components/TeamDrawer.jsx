import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { supabase } from "../helper/supabaseClient";
import "./css/TeamDrawer.css";

function DraggableEmployee({ employee, selectedId, onSelect, serviceMap }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: employee.id,
    data: { user: employee },
  });

  let dragTimeout = null;

  const handleClick = (e) => {
    // Ajoute un petit délai pour distinguer un clic d’un drag
    dragTimeout = setTimeout(() => {
      if (!isDragging) onSelect(employee);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (dragTimeout) clearTimeout(dragTimeout);
    };
  }, []);

  // Trouver le service et le service parent
  const service = serviceMap[employee.service_id];
  let parentService = service;
  while (parentService?.parent_id) {
    parentService = serviceMap[parentService.parent_id];
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`drawer-item ${employee.id === selectedId ? 'active' : ''}`}
      onMouseUp={(e) => {
          if (!isDragging) onSelect(employee);
        }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
      }}
    >
      <div className="avatar">
        {employee.avatar_url ? (
          <img src={employee.avatar_url} alt="avatar" className="avatar-img" />
        ) : (
          <span>
            {(employee.prenom?.[0] || '').toUpperCase()}
            {(employee.nom?.[0] || '').toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <div><strong>{employee.prenom} {employee.nom}</strong></div>
        <div className="poste-text">
          {service && (
            <>
              {service.nom}
              {parentService && parentService.id !== service.id && (
                <> ({parentService.nom})</>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamDrawer({ onSelect, selectedId, refreshTrigger, serviceId }) {
  const [employees, setEmployees] = useState([]);
  const [serviceMap, setServiceMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: session } = await supabase.auth.getUser();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", userId)
        .single();

      if (userError || !userData?.entreprise_id) {
        console.error("❌ Erreur récupération entreprise_id :", userError);
        return;
      }

      const entrepriseId = userData.entreprise_id;

      // Récupérer tous les services de l'entreprise
      const { data: allServices, error: serviceError } = await supabase
        .from("services")
        .select("id, nom, parent_id")
        .eq("entreprise_id", entrepriseId);

      const map = {};
      allServices?.forEach(s => {
        map[s.id] = { nom: s.nom, parent_id: s.parent_id, id: s.id };
      });
      setServiceMap(map);

      let query = supabase
        .from("utilisateurs")
        .select("id, prenom, nom, role, avatar_url, service_id")
        .eq("entreprise_id", entrepriseId)
        .order("nom");

      if (serviceId !== null && serviceId !== undefined) {
        const current = serviceId;
        const childrenIds = allServices
          .filter(s => s.parent_id === current)
          .map(s => s.id);

        const targetIds = [current, ...childrenIds];
        query = query.in("service_id", targetIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Erreur chargement utilisateurs :", error);
      } else {
        setEmployees(data);
      }
    };

    fetchData();
  }, [refreshTrigger, serviceId]);

  return (
    <div className="team-drawer">
      <div className="drawer-scroll">
        {employees.map(emp => (
          <DraggableEmployee
            key={emp.id}
            employee={emp}
            selectedId={selectedId}
            onSelect={onSelect}
            serviceMap={serviceMap}
          />
        ))}
      </div>
    </div>
  );
}