import { useEffect, useState, useRef } from "react";
import Tree from "react-d3-tree";
import { supabase } from "../helper/supabaseClient";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import "./css/ServiceTreePopup.css";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";

export default function ServiceTreePopup({ onClose }) {
  const [treeData, setTreeData] = useState([]);
  const [servicesRaw, setServicesRaw] = useState([]);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editedName, setEditedName] = useState("");
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

  const handleSaveEditName = async (nodeId) => {
    const newName = editedName.trim();
    if (!newName) return;

    const { error } = await supabase
      .from("services")
      .update({ nom: newName })
      .eq("id", nodeId);

    if (!error) {
      const updated = servicesRaw.map(s =>
        s.id === nodeId ? { ...s, nom: newName } : s
      );
      setServicesRaw(updated);
      updateTreeFromList(updated);
      setEditingNodeId(null);
      setEditedName("");
    }
  };

  const CustomNode = ({ nodeDatum }) => {
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
        setDraggedNode({ id: nodeDatum.id });
      }
    };

    const handleMouseUp = () => {
      if (isActive) {
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
        <circle r={18} fill={fillColor} stroke="none" strokeWidth={1} />

        {editingNodeId === nodeDatum.id ? (
          <foreignObject x={-70} y={-60} width={150} height={40}>
            <div style={{ display: "flex", gap: "3px", alignItems: "center", flexDirection: "column" }}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEditName(nodeDatum.id);
                }}
                style={{ fontSize: "12px", flex: 1 }}
              />
              <FiCheck
                size={20}
                color="#111"
                style={{ cursor: "pointer" }}
                onClick={() => handleSaveEditName(nodeDatum.id)}
              />
              <FiX
                size={14}
                color="gray"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setEditingNodeId(null);
                  setEditedName("");
                }}
              />
            </div>
          </foreignObject>
        ) : (
          <>
            <text fill="black" x={0} y={-30} textAnchor="middle" fontSize={12}>
              {nodeDatum.name}
            </text>
            <foreignObject x={-10} y={-9} width={20} height={20}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FiEdit
                  size={17}
                  color="white"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setEditingNodeId(nodeDatum.id);
                    setEditedName(nodeDatum.name);
                  }}
                />
              </div>
            </foreignObject>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="tree-popup-overlay">
      <div className="tree-popup-content">
        <button className="close-button" onClick={onClose}>✖</button>
        <h2>Organigramme des Services</h2>

        <div ref={treeContainerRef} style={{ width: "100%", height: "75%" }}>
          <DndContext onDragEnd={handleDrop}>
            {treeData.length > 0 && (
              <Tree
                data={treeData}
                orientation="vertical"
                translate={translate}
                zoom={1}
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