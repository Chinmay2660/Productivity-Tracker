import clsx from "clsx";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, suppressHydrationWarning, ...props }, ref) {
    // ponytail: browsers/password managers rewrite autocomplete before hydration
    const suppress =
      suppressHydrationWarning ?? (props.autoComplete != null && props.autoComplete !== false);
    return (
      <input
        ref={ref}
        className={clsx("input", className)}
        suppressHydrationWarning={suppress}
        {...props}
      />
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx("input min-h-[80px] resize-y", className)}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={clsx("input", className)} {...props}>
        {children}
      </select>
    );
  }
);
