import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export interface BuscadorDniProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (dni: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Componente de búsqueda de usuarios por DNI con debounce automático y botón de búsqueda rápida.
 */
export function BuscadorDni({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Buscar por DNI (ej: 30123456)...',
  debounceMs = 300,
  disabled = false,
  className = '',
  autoFocus = false,
}: BuscadorDniProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar estado interno si la prop value cambia externamente
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Manejo del debounce al tipear
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInternalValue(rawValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => {
      setIsSearching(false);
      onChange?.(rawValue);
      onSearch?.(rawValue);
    }, debounceMs);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setInternalValue('');
    setIsSearching(false);
    onChange?.('');
    onSearch?.('');
    onClear?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsSearching(false);
    onChange?.(internalValue);
    onSearch?.(internalValue);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center gap-2 ${className}`}
    >
      <div className="relative flex-1">
        {/* Left Search Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1B2A55]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full h-11 pl-10 pr-9 text-xs sm:text-sm font-medium text-[#1B2A55]
            bg-white border border-slate-200 rounded-xl transition-all duration-150
            placeholder:text-slate-400 focus:outline-none focus:border-[#1B2A55]
            focus:ring-2 focus:ring-[#1B2A55]/15 disabled:bg-slate-100 disabled:cursor-not-allowed
          `}
        />

        {/* Clear Button */}
        {internalValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#1B2A55] transition-colors rounded-lg cursor-pointer"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Button
        type="submit"
        variant="secondary"
        size="md"
        disabled={disabled}
        className="shrink-0"
      >
        Buscar
      </Button>
    </form>
  );
}
