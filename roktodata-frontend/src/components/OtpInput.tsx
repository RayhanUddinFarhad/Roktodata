"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

// Six single-digit boxes that behave like one field: typing moves forward, Backspace moves back,
// and pasting (or SMS autofill) a full code fills every box.
export default function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (index: number) => inputs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  // `value` holds digits only, without gaps: typing into an empty box past the end lands at the end.
  function fill(from: number, digits: string) {
    const start = Math.min(from, value.length);
    onChange((value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, LENGTH));
    focus(start + digits.length);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) onChange(value.slice(0, index) + value.slice(index + 1));
      else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focus(index - 1);
      }
    } else if (e.key === "ArrowLeft") focus(index - 1);
    else if (e.key === "ArrowRight") focus(index + 1);
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    e.preventDefault();
    fill(index, digits);
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" role="group" aria-label="৬ ডিজিটের ভেরিফিকেশন কোড">
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          // The first box accepts a whole autofilled code; the rest take one digit.
          maxLength={index === 0 ? LENGTH : 1}
          autoFocus={index === 0}
          disabled={disabled}
          aria-label={`ডিজিট ${index + 1}`}
          value={value[index] ?? ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits) fill(index, digits.length > 1 && index > 0 ? digits.slice(-1) : digits);
          }}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-11 rounded-xl border-2 bg-slate-50 text-center font-mono text-xl font-bold text-slate-900 transition-colors focus:bg-white focus:outline-none disabled:opacity-60 sm:h-14 sm:w-12 ${
            invalid
              ? "border-red-400 bg-red-50"
              : value[index]
                ? "border-red-500 bg-white"
                : "border-slate-300 focus:border-red-500"
          }`}
        />
      ))}
    </div>
  );
}
