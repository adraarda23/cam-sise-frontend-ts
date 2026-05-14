import React from 'react';

interface ConfidenceBadgeProps {
  relativeUncertainty: number; // 0 - 1+, daha düşük = daha güvenilir
  className?: string;
}

/**
 * Tahminin ne kadar güvenilir olduğunu küçük bir chip ile gösterir.
 * Relatif belirsizlik (marginOfError / |mean|) ile çalışır.
 *
 *   < %10 → "Yüksek güven" (yeşil)
 *   %10–%25 → "Orta güven" (sarı)
 *   > %25 → "Düşük güven" (kırmızı)
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  relativeUncertainty,
  className = '',
}) => {
  const { label, classes } = classify(relativeUncertainty);
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${classes} ${className}`}
      title={`Görece belirsizlik: %${(relativeUncertainty * 100).toFixed(1)}`}
    >
      {label}
    </span>
  );
};

function classify(rel: number): { label: string; classes: string } {
  if (rel < 0.1) return { label: 'Yüksek güven', classes: 'bg-actual-100 text-actual-700' };
  if (rel < 0.25) return { label: 'Orta güven', classes: 'bg-estimated-100 text-estimated-700' };
  return { label: 'Düşük güven', classes: 'bg-anomaly-100 text-anomaly-700' };
}
