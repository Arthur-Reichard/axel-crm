import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";

export default function EmployeeDetail({ employee, onSave, onDelete }) {
  const [formData, setFormData] = useState(employee || {});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFormData(employee || {});
    setMessage("");
  }, [employee]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      setMessage("❌ Erreur lors de l'upload");
    } else {
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      handleChange("photo_url", publicUrlData.publicUrl);
      setMessage("✅ Photo mise à jour !");
    }

    setUploading(false);
  };

  const saveEmployee = async () => {
    const { data: user } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from("utilisateurs")
      .select("entreprise_id")
      .eq("id", user.user.id)
      .single();

    const payload = {
      ...formData,
      entreprise_id: userData.entreprise_id,
    };

    let response;
    if (formData.id) {
      response = await supabase.from("employes").update(payload).eq("id", formData.id);
    } else {
      response = await supabase.from("employes").insert(payload).select().single();
      if (!response.error) {
        onSave(response.data);
      }
    }

    if (response.error) {
      setMessage("❌ Erreur lors de l'enregistrement");
    } else {
      setMessage("✅ Employé enregistré");
    }
  };

  const deleteEmployee = async () => {
    if (!formData.id) return;
    const { error } = await supabase.from("employes").delete().eq("id", formData.id);
    if (error) {
      setMessage("❌ Erreur lors de la suppression");
    } else {
      setMessage("✅ Employé supprimé");
      onDelete();
    }
  };

  if (!employee) {
    return (
      <div className="flex-1 p-6 text-gray-500 dark:text-gray-400">
        Sélectionne un employé
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          "prenom",
          "nom",
          "email",
          "telephone",
          "fonction",
          "adresse",
          "ville",
          "code_postal",
          "pays",
          "date_naissance",
        ].map((field) => (
          <div key={field}>
            <label className="block mb-1 text-sm font-medium capitalize">
              {field.replace("_", " ")}
            </label>
            <input
              type="text"
              value={formData[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e1e1e] text-sm"
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium">Notes</label>
          <textarea
            rows="4"
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e1e1e] text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium">Photo de profil</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="text-sm"
          />
          {formData.photo_url && (
            <img
              src={formData.photo_url}
              alt="profil"
              className="mt-2 h-24 rounded-md object-cover"
            />
          )}
        </div>
      </div>
      {message && <div className="mt-4 text-sm">{message}</div>}
      <div className="flex gap-4 justify-end mt-6">
        <button
          onClick={deleteEmployee}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Supprimer
        </button>
        <button
          onClick={saveEmployee}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm hover:opacity-90 transition"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
