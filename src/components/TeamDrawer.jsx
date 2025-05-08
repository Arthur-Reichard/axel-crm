import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";

export default function TeamDrawer({ selectedId, onSelect, onAdd }) {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", user.user.id)
        .single();

      const { data, error } = await supabase
        .from("employes")
        .select("*")
        .eq("entreprise_id", userData.entreprise_id);

      if (!error) setEmployees(data);
    };

    fetchEmployees();
  }, []);

  return (
    <div className="w-full max-w-xs h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Équipe</h2>
        <button
          onClick={onAdd}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {employees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => onSelect(emp)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${
              selectedId === emp.id
                ? "bg-gray-200 dark:bg-gray-800 font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
              {emp.photo_url ? (
                <img
                  src={emp.photo_url}
                  alt="profil"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>
                  {(emp.prenom?.[0] || "?") + (emp.nom?.[0] || "")}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-900 dark:text-white">
                {emp.prenom} {emp.nom}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {emp.fonction}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
