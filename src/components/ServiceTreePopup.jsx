import { useEffect, useState, useRef } from "react";
import Tree from "react-d3-tree";
import { supabase } from "../helper/supabaseClient";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import "./css/ServiceTreePopup.css";

export default function ServiceTreePopup({ onClose }) {
  const [treeData, setTreeData] = useState([]);
  const [servicesRaw, setServicesRaw] = useState([]);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const treeContainerRef = useRef(null);

  useEffect(() => {
    if (treeContainerRef.current) {
      const { offsetWidth, offsetHeight } = treeContainerRef.current;
      setTranslate({ x: offsetWidth / 2, y: offsetHeight / 4 });
    }
  }, [treeData]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", user?.user?.id)
        .single();

      if (!userData?.entreprise_id) return;

      const { data: services } = await supabase
        .from("services")
        .select("id, nom, parent_id")
        .eq("entreprise_id", userData.entreprise_id);

      setServicesRaw(services);
      updateTreeFromList(services);
    };

    fetchData();
  }, []);

  const updateTreeFromList = (services) => {
    const idMap = {};
    services.forEach(s => {
      idMap[s.id] = { name: s.nom, id: s.id, children: [] };
    });

    const rootNodes = [];
    services.forEach(service => {
      if (service.parent_id) {
        idMap[service.parent_id]?.children.push(idMap[service.id]);
      } else {
        rootNodes.push(idMap[service.id]);
      }
    });

    setTreeData(rootNodes);
  };

  const handleDrop = async (event) => {
    const source = event?.active?.data?.current?.service;
    const target = event?.over?.data?.current?.service;

    console.log("🎯 DROP détecté !");
    console.log("🔹 Source :", source?.name, `(id: ${source?.id})`);
    console.log("🔸 Cible :", target?.name, `(id: ${target?.id})`);

    if (!source || !target || source.id === target.id) return;

    const { error } = await supabase
      .from("services")
      .update({ parent_id: target.id })
      .eq("id", source.id);

    if (!error) {
      const updated = servicesRaw.map(s =>
        s.id === source.id ? { ...s, parent_id: target.id } : s
      );
      setServicesRaw(updated);
      updateTreeFromList(updated);
      setDraggedNode(null);
    }
  };

  const CustomNode = ({ nodeDatum }) => {
    console.log("🧩 Rendu d’un noeud :", nodeDatum.name, "ID :", nodeDatum.id);
    const isActive = draggedNode?.id === nodeDatum.id;

    const { attributes, listeners, setNodeRef: dragRef } = useDraggable({
      id: nodeDatum.id,
      data: { service: nodeDatum },
      disabled: !isActive,
    });

    const { setNodeRef: dropRef, isOver } = useDroppable({
      id: nodeDatum.id,
      data: { service: nodeDatum },
    });

    const combinedRef = (node) => {
      dragRef(node);
      dropRef(node);
    };

    const handleMouseDown = (e) => {
      if (e.altKey) {
        console.log("🔥 ALT + MOUSEDOWN sur :", nodeDatum.name);
        setDraggedNode({ id: nodeDatum.id });
      }
    };

    const handleMouseUp = () => {
      if (isActive) {
        console.log("🔚 MouseUp sur :", nodeDatum.name);
        setDraggedNode(null);
      }
    };

    const fillColor = isOver
      ? "#26a69a"
      : isActive
      ? "#8e24aa"
      : "#1976d2";

    return (
      <g
        ref={combinedRef}
        className="custom-node-group"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <circle r={18} fill={fillColor} stroke="black" strokeWidth={1} />
        <text
          fill="black"
          x={0}
          y={30}
          textAnchor="middle"
          fontSize={12}
        >
          {nodeDatum.name}
        </text>
        {isActive && (
          <text x={0} y={45} textAnchor="middle" fontSize={10} fill="gray">
            (drag actif)
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="tree-popup-overlay">
      <div className="tree-popup-content">
        <button className="close-button" onClick={onClose}>✖</button>
        <h2>Organigramme des Services</h2>

        <div ref={treeContainerRef} style={{ width: "100%", height: "600px" }}>
          <DndContext onDragEnd={handleDrop}>
            {treeData.length > 0 && (
              <Tree
                data={treeData}
                orientation="vertical"
                translate={translate}
                zoom={0.6}
                renderCustomNodeElement={(rd3tProps) => <CustomNode {...rd3tProps} />}
              />
            )}
          </DndContext>
        </div>

        <p style={{ fontSize: "0.9rem", marginTop: "1rem", color: "#555" }}>
          🛈 Maintiens <strong>Alt</strong> et clique sur un service pour pouvoir le déplacer dans un autre.
        </p>
      </div>
    </div>
  );
}