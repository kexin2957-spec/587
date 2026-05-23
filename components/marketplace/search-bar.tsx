"use client";

export function SearchBar({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">{placeholder}</span>
      <input
        data-testid="marketplace-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="polished-input h-12 w-full px-4 text-sm text-slate-950 placeholder:text-slate-400"
      />
    </label>
  );
}
