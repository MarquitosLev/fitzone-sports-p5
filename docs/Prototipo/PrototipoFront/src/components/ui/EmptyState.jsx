import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No hay información para mostrar',
  description = 'No se encontraron registros disponibles para los criterios seleccionados.',
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  children,
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-8 sm:p-12
        bg-white rounded-3xl border border-slate-100 shadow-xs ${className}
      `}
    >
      {/* Icon with soft FitZone Navy/Coral aura */}
      <div className="w-16 h-16 rounded-3xl bg-[#1B2A55]/5 text-[#1B2A55] flex items-center justify-center mb-4 border border-[#1B2A55]/10 shadow-xs">
        {React.isValidElement(Icon) ? (
          Icon
        ) : (
          <Icon className="w-8 h-8 text-[#1B2A55]/70" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-black text-[#1B2A55] font-outfit mb-1.5">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {children && <div className="mb-6 w-full max-w-sm">{children}</div>}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}

          {actionLabel && onAction && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={actionIcon}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
