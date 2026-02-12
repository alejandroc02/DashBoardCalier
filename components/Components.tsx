import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext: string;
  color: string;
  dotColor?: string;
}

import CountUp from './react-bits/CountUp';
import SpotlightCard from './react-bits/SpotlightCard';

export const KPICard: React.FC<KPICardProps> = ({ label, value, subtext, color, dotColor }) => {
  const numericValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const isPercentage = String(value).includes('%');
  const isCurrency = String(value).startsWith('$');

  return (
    <SpotlightCard className="h-full">
      <div className="p-[18px_20px] transition-all duration-300 group">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${dotColor || 'bg-teal'}`}></div>
          <span className="text-[11px] font-semibold text-t3 uppercase tracking-[0.8px]">{label}</span>
        </div>
        <div className={`text-[28px] font-bold font-mono mb-1 ${color}`}>
          {isCurrency && '$'}
          {!isNaN(numericValue) ? (
            <CountUp to={numericValue} duration={1.5} separator="." />
          ) : value}
          {isPercentage && '%'}
        </div>
        <div className="text-xs text-t2">{subtext}</div>
      </div>
    </SpotlightCard>
  );
};

interface BadgeProps {
  type: 'clasificacion' | 'estado' | 'derivado' | 'status' | 'default';
  value: string | boolean;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  let bg = 'bg-gray-800 text-gray-300';
  let label = String(value);

  const v = String(value).toLowerCase();

  if (type === 'clasificacion') {
    if (v.includes('compra')) bg = 'bg-teal-d text-teal';
    else if (v.includes('info')) bg = 'bg-blue-d text-blue';
    else if (v.includes('baja')) bg = 'bg-rose-d text-rose';
  } else if (type === 'estado') {
    if (v === 'respondido') bg = 'bg-teal-d text-teal';
    else if (v === 'enviado') bg = 'bg-amber-d text-amber';
  } else if (type === 'derivado') {
    label = value ? 'Sí' : 'No';
    bg = value ? 'bg-violet-d text-violet' : 'bg-bg2 text-t3';
  } else if (type === 'status') {
    label = value ? 'Activo' : 'Inactivo';
    bg = value ? 'bg-teal-d text-teal' : 'bg-rose-d text-rose';
  }

  return (
    <span className={`inline-block px-2 py-[2px] rounded-[4px] text-[10px] font-bold uppercase tracking-wide ${bg}`}>
      {label}
    </span>
  );
};

export const ChartCard: React.FC<{ title: string; tag?: string; children: React.ReactNode; className?: string }> = ({ title, tag, children, className }) => (
  <div className={`bg-card border border-brd rounded-[14px] p-5 flex flex-col ${className}`}>
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-sm font-semibold text-t1">{title}</h3>
      {tag && <span className="text-[10px] font-bold bg-bg2 text-t2 px-2 py-1 rounded uppercase">{tag}</span>}
    </div>
    <div className="flex-1 min-h-[250px] w-full">
      {children}
    </div>
  </div>
);
