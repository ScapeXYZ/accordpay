"use client";

import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";

import styles from "./ui.module.css";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helperText?: string;
  error?: string;
  showCharacterCount?: boolean;
};

export function Textarea({
  id,
  label,
  helperText,
  error,
  required,
  showCharacterCount = false,
  value,
  defaultValue,
  maxLength,
  className = "",
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const helperId = helperText ? `${textareaId}-helper` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const countId = showCharacterCount ? `${textareaId}-count` : undefined;
  const currentLength = String(value ?? defaultValue ?? "").length;
  const describedBy =
    [props["aria-describedby"], helperId, errorId, countId]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={textareaId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        {...props}
        className={`${styles.textarea} ${error ? styles.textareaError : ""}`}
        id={textareaId}
        required={required}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <div className={styles.fieldMeta}>
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
        {showCharacterCount && (
          <span className={styles.count} id={countId}>
            {currentLength}
            {maxLength ? ` / ${maxLength}` : ""} characters
          </span>
        )}
      </div>
    </div>
  );
}
