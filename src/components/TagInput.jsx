import React, { useState, forwardRef, useImperativeHandle } from "react";
import "./css/TagInput.css";

const TagInput = forwardRef(({ tags, setTags, placeholder = "Ajouter un tag...", suggestions = [] }, ref) => {
  const [input, setInput] = useState("");

  const addInputAsTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInput("");
    }
  };

  useImperativeHandle(ref, () => ({
    flushInput: () => addInputAsTag()
  }));

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim() !== "") {
      e.preventDefault();
      addInputAsTag();
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="tag-input-wrapper">
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
    </div>
  );
});

export default TagInput;
