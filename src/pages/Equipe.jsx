import { useState } from "react";
import TeamDrawer from "../components/TeamDrawer";
import EmployeeDetail from "../components/EmployeeDetail";
import "./css/Equipe.css"

export default function Equipe() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleAdd = () => {
    const draft = {
      prenom: "",
      nom: "",
      email: "",
      telephone: "",
      fonction: "",
      adresse: "",
      ville: "",
      code_postal: "",
      pays: "",
      date_naissance: "",
      notes: "",
      photo_url: "",
    };
    setSelectedEmployee(draft);
  };

  const handleSave = (newOrUpdatedEmployee) => {
    setSelectedEmployee(newOrUpdatedEmployee);
  };

  const handleDelete = () => {
    setSelectedEmployee(null);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <TeamDrawer
        selectedId={selectedEmployee?.id}
        onSelect={handleSelect}
        onAdd={handleAdd}
      />
      <EmployeeDetail
        employee={selectedEmployee}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
