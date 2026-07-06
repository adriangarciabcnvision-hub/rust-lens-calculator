import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function Card({ children, className = '', title, description, icon }: CardProps) {
  return (
    <div className={`bg-slate-800 rounded-lg p-3 border border-slate-700 ${className}`}>
      {(title || icon) && (
        <div className="flex items-start gap-2 mb-2">
          {icon && <div className="text-lg flex-shrink-0">{icon}</div>}
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {description && <p className="text-xs text-slate-400">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function CardGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
}
