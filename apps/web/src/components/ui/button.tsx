"use client";

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { Spinner } from "./spinner";
import styles from "./ui.module.css";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  loadingText?: string;
  className?: string;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    disabled?: boolean;
  };

export type ButtonOrLinkProps = ButtonProps | LinkProps;

export function Button(props: ButtonOrLinkProps) {
  const {
    children,
    variant = "primary",
    loading = false,
    loadingText = "Loading",
    className = "",
    ...elementProps
  } = props;
  const classes = `${styles.button} ${styles[variant]} ${className}`;

  if ("href" in elementProps && elementProps.href) {
    const {
      href,
      disabled = false,
      onClick,
      target,
      rel,
      ...anchorProps
    } = elementProps;
    const unavailable = disabled || loading;

    return (
      <a
        {...anchorProps}
        className={classes}
        href={unavailable ? undefined : href}
        aria-disabled={unavailable || undefined}
        aria-busy={loading || undefined}
        tabIndex={unavailable ? -1 : anchorProps.tabIndex}
        target={target}
        rel={target === "_blank" ? (rel ?? "noopener noreferrer") : rel}
        onClick={(event) => {
          if (unavailable) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
      >
        {loading && <Spinner size="small" label={loadingText} />}
        <span>{loading ? loadingText : children}</span>
      </a>
    );
  }

  const {
    disabled = false,
    type = "button",
    ...buttonProps
  } = elementProps as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      {...buttonProps}
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner size="small" label={loadingText} />}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}
