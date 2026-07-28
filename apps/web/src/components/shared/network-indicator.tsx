import styles from "./shared.module.css";

export function NetworkIndicator() {
  return (
    <div
      className={styles.network}
      aria-label="GIWA Sepolia testnet, chain ID 91342"
    >
      <span className={styles.networkDot} aria-hidden="true" />
      <span className={styles.networkName}>GIWA Sepolia</span>
      <span className={styles.networkChain}>91342 · Testnet</span>
    </div>
  );
}
