import { useEffect, useState } from "react";
import DashboardNavbar from "./DashboardNavbar";
import ServiceDrawer from "../components/ServiceDrawer";
import TeamDrawer from "../components/TeamDrawer";
import EmployeeDetail from "../components/EmployeeDetail";
import { supabase } from "../helper/supabaseClient";
import "./css/Equipe.css";
import { DndContext } from "@dnd-kit/core";

export default function Equipe() {
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const handleSave = () => setRefreshTrigger(prev => !prev);
    const handleDelete = () => {
      setSelectedEmployee(null);
      setRefreshTrigger(prev => !prev);
    };

    const handleAddEmployee = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", user?.user?.id)
        .single();

      if (error || !data?.entreprise_id || !selectedServiceId) return;

      const { data: newEmp, error: insertError } = await supabase
        .from("employes")
        .insert([
          {
            nom: '',
            prenom: '',
            email: '',
            telephone: '',
            date_naissance: null,
            adresse: '',
            notes: '',
            entreprise_id: data.entreprise_id,
            service_id: selectedServiceId // ⚠️ important : lien avec le service
          }
        ])
        .select()
        .single();

      if (!insertError) {
        setSelectedEmployee(newEmp);
        setRefreshTrigger(prev => !prev);
      }
    };

    const handleDropInEquipe = async (event) => {
      const droppedUser = event?.active?.data?.current?.user;
      const targetService = event?.over?.data?.current?.service;

      // ✅ NE RIEN FAIRE si le drop est hors d'une zone valide
      if (!event.over || !targetService || !droppedUser) {
        return;
      }

      const { error } = await supabase
        .from("utilisateurs")
        .update({ service_id: targetService.id || null })
        .eq("id", droppedUser.id);

      if (error) {
        console.error("❌ Erreur mise à jour service_id :", error);
      } else {
        setRefreshTrigger(prev => !prev);
      }
    };

  return (
    <>
      <div className="equipe-page">
        <DashboardNavbar />
        <div className="equipe-layout">
          <DndContext onDragEnd={handleDropInEquipe}>
            <ServiceDrawer onSelect={setSelectedServiceId} selectedServiceId={selectedServiceId} />
            <TeamDrawer
              onSelect={setSelectedEmployee}
              selectedId={selectedEmployee?.id}
              refreshTrigger={refreshTrigger}
              serviceId={selectedServiceId} // on ajoute ce prop pour filtrer les employés
            />
          </DndContext>
          <EmployeeDetail
            employee={selectedEmployee}
            onSaved={handleSave}
            onDeleted={handleDelete}
          />
        </div>
      </div>
      <button className="add-employee-btn" onClick={handleAddEmployee}>+</button>
    </>
  );
}