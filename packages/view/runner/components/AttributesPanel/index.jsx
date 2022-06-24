import { bind, repeat, unless, when, watch, proxyState } from "@woofjs/client";

import styles from "./index.module.css";
import InputText from "./InputText";
import InputSelect from "./InputSelect";
import InputToggle from "./InputToggle";
import InputColor from "./InputColor";

/**
 * Displays the current view's attributes and provides inputs for editing them.
 */
export default ($attrs, self) => {
  self.debug.name = "AttributesPanel";

  const { $currentView } = self.getService("view");

  const $attributes = $currentView.map((view) => {
    return view?.attributes || [];
  });
  const $hasAttrs = $attributes.map((attrs) => attrs.length > 0);

  return (
    <div class={styles.panel}>
      <h1>Attributes</h1>

      {unless($hasAttrs, <p>This view has no attributes.</p>)}

      {when(
        $hasAttrs,
        <ul class={styles.attrsList}>
          {repeat($attributes, ($attrs, self) => {
            const $attribute = $attrs.map("value");

            const $name = $attribute.map("name");
            const $description = $attribute.map("description");

            // Using a proxy to have one state that can point to other states over time.
            const $value = proxyState($attribute.get("$value"));

            // Update which state the proxy points to when the attribute changes.
            self.watchState($attribute, (attr) => {
              self.debug.log(attr);

              $value.proxy(attr.$value);
            });

            return (
              <li>
                <h2>{$name}</h2>
                {when($description, <p>{$description}</p>)}

                {watch($attribute, ({ input }) => {
                  switch (input.type) {
                    case "text":
                      return <InputText $value={$value} />;
                    case "select":
                      return (
                        <InputSelect $value={$value} options={input.options} />
                      );
                    case "toggle":
                      return <InputToggle $value={$value} />;
                    case "color":
                      return <InputColor $value={$value} />;
                    default:
                      throw new Error(`Unknown input type: ${input.type}`);
                  }
                })}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
