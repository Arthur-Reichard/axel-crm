import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/HierarchyEditor.css";

export default function HierarchyEditor({ entrepriseId, onClose }) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, nom, parent_id")
        .eq("entreprise_id", entrepriseId)
        .order("nom");

      if (!error && data) {
        setServices(data);
      }
    };

    fetchServices();
  }, [entrepriseId]);

  const buildTree = (parentId = null) =>
    services
      .filter(s => s.parent_id === parentId)
      .map(s => ({
        ...s,
        children: buildTree(s.id),
      }));

  const renderTree = (nodes) => (
    <ul className="child-list">
      {nodes.map(node => (
        <li key={node.id} className="tree-item">
          <div className="service-box">{node.nom}</div>
          {node.children.length > 0 && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );

  const tree = buildTree();

  return (
    <div className="hierarchy-modal">
      <div className="hierarchy-content">
        <h2>Arborescence des services</h2>
        <div className="tree-zone">
          <ul className="root-level">
            {tree.map(node => (
              <li key={node.id} className="tree-item">
                <div className="service-box">{node.nom}</div>
                {node.children.length > 0 && renderTree(node.children)}
              </li>
            ))}
          </ul>
        </div>
        <div className="hierarchy-buttons">
          <button onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}