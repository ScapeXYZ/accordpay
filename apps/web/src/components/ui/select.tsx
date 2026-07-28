"use client";

import type { SelectHTMLAttributes } from "react";
import { useId } from "react";

import styles from "./ui.module.css";

type Option = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly Option[];
  placeholder?: string;
  helperText?: string;
  error?: string;
};

export function Select({
  id,
  label,
  options,
  placeholder,
  helperText,
  error,
  required,
  className = "",
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy =
    [props["aria-describedby"], helperId, errorId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        {...props}
        className={`${styles.select} ${error ? styles.selectError : ""}`}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
