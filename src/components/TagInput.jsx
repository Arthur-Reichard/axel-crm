// components/TagInput.jsx
import React, { useState } from "react";
import "./css/TagInput.css";

export default function TagInput({ tags, setTags, placeholder = "Ajouter un tag..." }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        setTags([...tags, input.trim()]);
      }
      setInput("");
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="tag-input-container">
      {tags.map((tag, index) => (
        <span className="tag" key={index}>
          {tag}
          <button onClick={() => removeTag(index)}>x</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
}