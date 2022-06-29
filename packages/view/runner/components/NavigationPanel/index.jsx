import styles from "./index.module.css";

import Panel from "../Panel";
import Tree from "./Tree";

/**
 * Displays a tree of all views and links to navigate to each.
 */
export default ($attrs, self) => {
  self.debug.name = "NavigationPanel";

  const { $collections } = self.getService("view");

  function findNodeWithSegment(tree, segment) {
    for (const node of tree) {
      if (node.segment == segment) {
        return node;
      }
    }

    return null;
  }

  // Organize collections into a tree based on path segments.
  const $tree = $collections.map((collections) => {
    const tree = [];

    for (const collection of collections) {
      const pathSegments = collection.path
        .split("/")
        .filter((segment) => segment.trim() !== "");

      let currentNode = null;

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];

        const node = currentNode
          ? findNodeWithSegment(currentNode.children, segment)
          : findNodeWithSegment(tree, segment);

        if (node) {
          currentNode = node;
          continue;
        }

        if (currentNode) {
          const newNode = {
            segment,
          };

          // Add collection to node when on collection's final path segment, otherwise prepare for more children.
          if (i + 1 === pathSegments.length) {
            newNode.collection = collection;
          } else {
            newNode.children = [];
          }

          currentNode.children.push(newNode);
          currentNode = newNode;
        } else {
          const newNode = {
            segment,
            children: [],
          };

          tree.push(newNode);
          currentNode = newNode;
        }
      }
    }

    return tree;
  });

  return (
    <Panel header={<h1>🔭 Views</h1>} padded={false}>
      <Tree nodes={$tree} />
    </Panel>
  );
};
