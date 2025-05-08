import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function DraggableHeader({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#e0f7ff' : undefined,
    border: isDragging ? '1px dashed #007bff' : undefined,
    borderRadius: isDragging ? '6px' : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="draggable-th"
    >
      {children}
    </th>
  );
}