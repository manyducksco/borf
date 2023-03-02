import {
  repeat,
  unless,
  when,
  watch,
  makeState,
  mergeStates,
} from "@woofjs/client";

import styles from "./index.module.css";

const viewIcon = "🔭";

export default function Tree() {
  const $nodes = this.$attrs.map("nodes");

  return (
    <ul class={styles.treeList}>
      {repeat($nodes, function ListNode() {
        const $node = this.$attrs.map("value");

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

function CollectionNode() {
  this.debug.name = "Tree/CollectionNode";

  const { $params } = this.services.router;
  const $collection = this.$attrs.map("node");
  const $views = $collection.map("views");
  const $hasManyViews = $views.map(
    (views) => views.length > 1 || views[0].name !== "@default"
  );

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
                {repeat($views, function View() {
                  const $view = this.$attrs.map("value");
                  const $active = mergeStates(
                    $view,
                    $params,
                    (view, params) => {
                      return view.path === params.wildcard;
                    }
                  );

                  return (
                    <li>
                      <a
                        class={{
                          [styles.treeItem]: true,
                          [styles.highlight]: $active,
                        }}
                        title={$view.map("description")}
                        href={$view.map("path")}
                      >
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
        const $active = mergeStates(
          $collection,
          $params,
          (collection, params) => {
            return collection.path === params.wildcard;
          }
        );

        return (
          <a
            class={{
              [styles.treeItem]: true,
              [styles.highlight]: $active,
            }}
            title={$collection.map("views[0].description")}
            href={$collection.map("path")}
          >
            {viewIcon} {$collection.map("name")}
          </a>
        );
      })}
    </li>
  );
}

function ChildrenNode() {
  this.debug.name = "Tree/ChildrenNode";

  const $expanded = makeState(true);
  const $segment = this.$attrs.map("node.segment");
  const $children = this.$attrs.map("node.children");

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
