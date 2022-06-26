import { repeat, unless, when, watch, makeState } from "@woofjs/client";

import styles from "./index.module.css";

const viewIcon = "🔭";

export default function Tree($attrs, self) {
  const $nodes = $attrs.map("nodes");

  return (
    <ul class={styles.treeList}>
      {repeat($nodes, ($attrs, self) => {
        const $node = $attrs.map("value");

        return watch($node, () => {
          const node = $node.get();

          if (node.collection) {
            return <CollectionNode node={node.collection} />;
          } else if (node.children) {
            return <ChildrenNode node={node} />;
          } else {
            throw new TypeError(
              `Expected node to be an object with 'segment' and either 'collection' or 'children'. Got: ${JSON.stringify(
                node
              )}`
            );
          }
        });
      })}
    </ul>
  );
}

function CollectionNode($attrs, self) {
  self.debug.name = "Tree/CollectionNode";

  const $collection = $attrs.map("node");
  const $views = $collection.map("views");
  const $hasManyViews = $views.map(
    (views) => views.length > 1 || views[0].name !== "@default"
  );

  self.watchState($collection, (value) => {
    self.debug.log("collection", value);
  });

  return (
    <li>
      {when($hasManyViews, () => {
        return (
          <details open={true}>
            <summary className={styles.treeItem}>
              {$collection.map("name")}
            </summary>
            <div class={styles.nodeChildren}>
              <ul class={styles.treeList}>
                {repeat($views, ($attrs, self) => {
                  const $view = $attrs.map("value");

                  return (
                    <li>
                      <a class={styles.treeItem} href={$view.map("path")}>
                        {viewIcon} {$view.map("name")}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        );
      })}

      {unless($hasManyViews, () => {
        return (
          <a class={styles.treeItem} href={$collection.map("path")}>
            {viewIcon} {$collection.map("name")}
          </a>
        );
      })}
    </li>
  );
}

function ChildrenNode($attrs, self) {
  self.debug.name = "Tree/ChildrenNode";

  const $expanded = makeState(true);
  const $segment = $attrs.map("node.segment");
  const $children = $attrs.map("node.children");

  return (
    <li>
      <details open={$expanded}>
        <summary class={styles.treeItem}>{$segment}</summary>
        <div class={styles.nodeChildren}>
          <Tree nodes={$children} />
        </div>
      </details>
    </li>
  );
}
