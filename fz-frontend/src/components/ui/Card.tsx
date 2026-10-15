import React from 'react';

export type CardVariant = 'default' | 'glass' | 'flat' | 'navy' | 'highlight';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode | React.ElementType;
  variant?: CardVariant;
  interactive?: boolean;
  hoverable?: boolean; // Alias for interactive
  padded?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export function Card({
  children,
  title,
  subtitle,
  action,
  footer,
  icon: Icon,
  variant = 'default',
  interactive = false,
  hoverable = false, // Alias for interactive
  padded = true,
  onClick,
  className = '',
  ...props
}: CardProps) {
  const isInteractive = interactive || hoverable || Boolean(onClick);

  const variantClasses: Record<CardVariant, string> = {
    default: 'bg-white border border-slate-100 shadow-card text-slate-800',
    glass: 'glass-panel text-slate-800 shadow-card',
    flat: 'bg-white border border-slate-200/80 shadow-xs text-slate-800',
    navy: 'bg-[#1B2A55] text-white border border-white/10 shadow-card',
    highlight: 'bg-white border border-slate-100 border-t-4 border-t-[#F26D6D] shadow-card text-slate-800',
  };

  const interactiveClasses = isInteractive
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.99]'
    : '';

  const isDark = variant === 'navy';

  const renderIcon = (IconInput: React.ReactNode | React.ElementType) => {
    if (!IconInput) return null;
    if (React.isValidElement(IconInput)) return IconInput;
    const Resolved = IconInput as React.ElementType;
    return <Resolved className="w-5 h-5" />;
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl overflow-hidden
        ${variantClasses[variant] || variantClasses.default}
        ${interactiveClasses}
        ${className}
      `}
      {...props}
    >
      {/* Header if title, subtitle or action are provided via props */}
      {(title || subtitle || action || Icon) && (
        <div
          className={`
            px-6 py-5 flex items-start justify-between gap-4
            ${isDark ? 'border-b border-white/10' : 'border-b border-slate-100/80'}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
                  ${isDark ? 'bg-white/10 text-white' : 'bg-[#1B2A55]/5 text-[#1B2A55]'}
                `}
              >
                {renderIcon(Icon)}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3
                  className={`
                    text-base sm:text-lg font-black font-outfit truncate tracking-tight
                    ${isDark ? 'text-white' : 'text-[#1B2A55]'}
                  `}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={`
                    text-xs mt-0.5 truncate leading-relaxed
                    ${isDark ? 'text-white/60' : 'text-slate-500'}
                  `}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Main Content Area */}
      <div className={padded ? 'p-6' : ''}>
        {children}
      </div>

      {/* Footer slot */}
      {footer && (
        <div
          className={`
            px-6 py-4 flex items-center justify-between gap-3
            ${isDark ? 'bg-white/5 border-t border-white/10' : 'bg-slate-50/60 border-t border-slate-100'}
          `}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

// Subcomponents for compound pattern
export function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }: CardSectionProps) {
  return (
    <h3 className={`text-base sm:text-lg font-black text-[#1B2A55] font-outfit tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }: CardSectionProps) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
