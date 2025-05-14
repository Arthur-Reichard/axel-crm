export default function ArborescenceServices({ services }) {
  const buildTree = (parentId = null) =>
    services
      .filter(s => s.parent_id === parentId)
      .map(s => ({
        ...s,
        children: buildTree(s.id),
      }));

  const renderTree = (nodes) => (
    <ul>
      {nodes.map(node => (
        <li key={node.id}>
          <div className="service-box">{node.nom}</div>
          {node.children.length > 0 && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );

  const tree = buildTree();

  return <div className="arbo-container">{renderTree(tree)}</div>;
}