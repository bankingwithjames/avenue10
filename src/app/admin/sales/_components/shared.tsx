"use client";

import { ReactNode } from "react";

export const inputClass =
  "w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
export const labelClass =
  "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";
export const sectionHeader =
  "text-[10px] tracking-[0.3em] uppercase text-warm-gray font-medium mb-4";
export const btnClass =
  "bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5";
export const btnSecondary =
  "bg-white text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium border border-light-gray hover:bg-cream transition px-4 py-2.5";
export const btnDanger =
  "bg-white text-red-600 text-[10px] tracking-[0.15em] uppercase font-medium border border-red-200 hover:bg-red-50 transition px-4 py-2.5";
export const tabBase =
  "px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition flex items-center gap-1.5 rounded-full";
export const badgeClass =
  "inline-flex items-center px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase font-medium rounded-full";

export function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
  placeholder,
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">
            {prefix}
          </span>
        )}
        <input
          type="number"
          className={`${inputClass} ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          step={step || 1}
          min={0}
          placeholder={placeholder}
          disabled={disabled}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        className={`${inputClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        className={`${inputClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border ${
                value === opt.value
                  ? "border-charcoal bg-charcoal"
                  : "border-light-gray"
              } flex items-center justify-center`}
              onClick={() => onChange(opt.value)}
            >
              {value === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <span className="text-xs text-charcoal">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-4 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5 ${
          checked ? "bg-charcoal" : "bg-light-gray"
        } relative`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
      <div>
        <span className="text-xs text-charcoal">{label}</span>
        {description && (
          <p className="text-[9px] text-warm-gray mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-light-gray p-6 ${className || ""}`}>
      {children}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const colors: Record<string, string> = {
    active: "bg-green-50 text-green-700 border border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    declined: "bg-red-50 text-red-700 border border-red-200",
    expired: "bg-gray-100 text-gray-500 border border-gray-200",
    paid: "bg-green-50 text-green-700 border border-green-200",
    none: "bg-gray-100 text-gray-500 border border-gray-200",
    sent: "bg-blue-50 text-blue-700 border border-blue-200",
    lost: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`${badgeClass} ${colors[status] || colors.none}`}>
      {status}
    </span>
  );
}

export function KPICard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-white border border-light-gray p-4">
      <p className={labelClass}>{label}</p>
      <p className="text-xl font-serif text-charcoal font-light mt-1">{value}</p>
      {sublabel && (
        <p className="text-[9px] text-warm-gray mt-1">{sublabel}</p>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-xs text-warm-gray py-8 text-center">{message}</p>
  );
}

export const fmt = (n: number) => `$${n.toFixed(2)}`;
