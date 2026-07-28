import { Button } from "../ui";
import styles from "./shared.module.css";

export function WalletPlaceholder({ onConnect }: { onConnect?: () => void }) {
  return (
    <div className={styles.wallet}>
      <span className={styles.walletStatus}>Wallet disconnected</span>
      <Button onClick={onConnect}>Connect wallet</Button>
    </div>
  );
}
