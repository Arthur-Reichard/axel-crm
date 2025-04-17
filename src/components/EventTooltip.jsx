// 📁 components/EventTooltip.js
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

export default function EventTooltip({ children, event }) {
  const { title, description, lieu, duration } = event;

  const content = (
    <div style={{ maxWidth: '200px' }}>
      <strong>{title}</strong>
      {lieu && <div>📍 {lieu}</div>}
      {description && <div style={{ marginTop: 4 }}>{description}</div>}
      {duration && <div style={{ marginTop: 4 }}>⏱️ {duration} min</div>}
    </div>
  );

  return (
    <Tippy content={content} placement="top">
      {children}
    </Tippy>
  );
}