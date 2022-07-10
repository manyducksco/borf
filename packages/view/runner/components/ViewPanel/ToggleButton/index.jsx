import styles from "./index.module.css";

export default function ToggleButton() {
  const $active = this.$attrs.get("$active");

  return (
    <button
      class={{ [styles.button]: true, [styles.active]: $active }}
      onclick={() => $active.set((active) => !active)}
    >
      <div class={styles.indicator} /> {this.children}
    </button>
  );
}
