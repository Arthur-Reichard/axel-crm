import { useEffect, useState } from "react";
import TeamDrawer from "../components/TeamDrawer";
import EmployeeDetail from "../components/EmployeeDetail";
import { supabase } from "../helper/supabaseClient";
import "./css/Equipe.css"

export default function Equipe() {
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
      .from('utilisateurs')
      .select('entreprise_id')
      .eq('id', user?.user?.id)
      .single();
  
    if (error || !data?.entreprise_id) return;
  
    const { data: newEmp, error: insertError } = await supabase
      .from('employes')
      .insert([
        {
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          date_naissance: null,
          adresse: '',
          notes: '',
          entreprise_id: data.entreprise_id
        }
      ])
      .select()
      .single();
  
    if (!insertError) {
      setSelectedEmployee(newEmp);
      setRefreshTrigger(prev => !prev);
    } else {
      console.error('Erreur insert employé:', insertError);
    }
  };  

  return (
    <>
      <div className="equipe-layout">
        <TeamDrawer onSelect={setSelectedEmployee} selectedId={selectedEmployee?.id} refreshTrigger={refreshTrigger} />
        <EmployeeDetail employee={selectedEmployee} onSaved={handleSave} onDeleted={handleDelete} />
      </div>
      <button className="add-employee-btn" onClick={handleAddEmployee}>+</button>
    </>
  );
}
