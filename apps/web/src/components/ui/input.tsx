"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

import styles from "./ui.module.css";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label: string;
  helperText?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export function Input({
  id,
  label,
  helperText,
  error,
  required,
  disabled,
  prefix,
  suffix,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [props["aria-describedby"], helperId, errorId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div
        className={`${styles.controlWrap} ${error ? styles.controlWrapError : ""} ${disabled ? styles.controlWrapDisabled : ""}`}
      >
        {prefix && <span className={styles.affix}>{prefix}</span>}
        <input
          {...props}
          className={styles.control}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {suffix && <span className={styles.affix}>{suffix}</span>}
      </div>
      {error ? (
        <p className={styles.errorText} id={errorId}>
          {error}
        </p>
      ) : (
        helperText && (
          <p className={styles.helper} id={helperId}>
            {helperText}
          </p>
        )
      )}
    </div>
  );
}
