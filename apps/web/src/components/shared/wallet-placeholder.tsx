import { WalletControl } from "../web3";
import styles from "./shared.module.css";

export function WalletPlaceholder() {
  return (
    <div className={styles.wallet}>
      <span className={styles.walletStatus}>GIWA Sepolia wallet</span>
      <WalletControl />
    </div>
  );
}
