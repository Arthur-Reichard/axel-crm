import React, { useRef, useState } from 'react';

export default function ResizableTH({ children, width = 150 }) {
  const [colWidth, setColWidth] = useState(width);
  const thRef = useRef(null);

  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startWidth = thRef.current.offsetWidth;

    const handleMouseMove = (eMove) => {
      const newWidth = Math.max(80, startWidth + (eMove.clientX - startX));
      setColWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <th
      ref={thRef}
      style={{
        width: `${colWidth}px`,
        minWidth: '80px',
        position: 'relative',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ paddingRight: '10px' }}>{children}</div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '5px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1,
          userSelect: 'none',
        }}
      />
    </th>
  );
}
