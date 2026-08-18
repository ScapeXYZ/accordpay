"use client";

import { useId, useRef } from "react";

import { Button } from "./button";
import styles from "./ui.module.css";

export function ConfirmationDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  disabled = false,
  onConfirm,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  disabled?: boolean;
  onConfirm?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={`${styles.button} ${
          destructive ? styles.destructive : styles.secondary
        }`}
        type="button"
        disabled={disabled}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <dialog
        className={styles.dialog}
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => triggerRef.current?.focus()}
      >
        <div className={styles.dialogContent}>
          <h2 className={styles.dialogTitle} id={titleId}>
            {title}
          </h2>
          <p className={styles.dialogDescription} id={descriptionId}>
            {description}
          </p>
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={closeDialog}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? "destructive" : "primary"}
              onClick={() => {
                onConfirm?.();
                closeDialog();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
