import styles from "./index.module.css";

export default ($attrs, self) => {
  const $active = $attrs.get("$active");

  return (
    <button
      class={{ [styles.button]: true, [styles.active]: $active }}
      onclick={() => $active.set((active) => !active)}
    >
      <div class={styles.indicator} /> {self.children}
    </button>
  );
};
