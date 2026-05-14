import React from 'react';

interface EstimatedValueProps {
  value: number;
  stdDev?: number;
  sampleSize?: number;
  lowerBound?: number;
  upperBound?: number;
  confidenceLevel?: number;
  unit?: string;
  showRange?: boolean;
  precision?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  tooltip?: string;
}

const SIZE_CLASSES: Record<NonNullable<EstimatedValueProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

/**
 * Görsel olarak "tahmin / belirsizlik içeren" değerleri ifade eder.
 * Turuncu tonlar + italik + ± aralığı = sistemin geçmiş veriden ürettiği tahmin.
 *
 * - 1.96 × stdDev kullanılarak %95 güven aralığı varsayılır
 * - Backend zaten lowerBound / upperBound döndürüyorsa onları kullanır
 * - mean'in mutlak değeri 0 ise tek başına gösterir, aralık göstermez
 *
 * Kullanım örneği: stoktaki "tahmin edilen mevcut" miktar, kayıp oranı,
 * forecast horizonundaki beklenen değer.
 */
export const EstimatedValue: React.FC<EstimatedValueProps> = ({
  value,
  stdDev,
  sampleSize,
  lowerBound,
  upperBound,
  confidenceLevel = 0.95,
  unit,
  showRange = true,
  precision = 1,
  size = 'md',
  className = '',
  tooltip,
}) => {
  const margin = computeMargin({ stdDev, sampleSize, lowerBound, upperBound, value });
  const hasUncertainty = margin > 0;

  const valueText = value.toFixed(precision);
  const marginText = hasUncertainty ? margin.toFixed(precision) : null;

  const fullTooltip = tooltip ?? buildTooltip({
    stdDev, sampleSize, lowerBound, upperBound, confidenceLevel,
  });

  return (
    <span
      className={`text-estimated-700 italic ${SIZE_CLASSES[size]} ${className}`}
      title={fullTooltip}
    >
      <span aria-hidden className="text-estimated-500 mr-1">~</span>
      <span className="font-semibold">{valueText}</span>
      {hasUncertainty && showRange && (
        <span className="text-estimated-600 ml-1">
          ± {marginText}
        </span>
      )}
      {unit && <span className="ml-1 text-estimated-600 not-italic">{unit}</span>}
    </span>
  );
};

interface MarginInputs {
  value: number;
  stdDev?: number;
  sampleSize?: number;
  lowerBound?: number;
  upperBound?: number;
}

function computeMargin({ value, stdDev, sampleSize, lowerBound, upperBound }: MarginInputs): number {
  if (lowerBound != null && upperBound != null) {
    return Math.max(value - lowerBound, upperBound - value);
  }
  if (stdDev != null && stdDev > 0) {
    const n = sampleSize && sampleSize > 1 ? sampleSize : 1;
    return (1.96 * stdDev) / Math.sqrt(n);
  }
  return 0;
}

function buildTooltip(inputs: {
  stdDev?: number;
  sampleSize?: number;
  lowerBound?: number;
  upperBound?: number;
  confidenceLevel?: number;
}): string {
  const level = ((inputs.confidenceLevel ?? 0.95) * 100).toFixed(0);
  const parts: string[] = ['Tahmin değeri'];
  if (inputs.stdDev != null && inputs.stdDev > 0) {
    parts.push(`Std. sapma: ${inputs.stdDev.toFixed(2)}`);
  }
  if (inputs.sampleSize != null) {
    parts.push(`Örnek sayısı: ${inputs.sampleSize}`);
  }
  if (inputs.lowerBound != null && inputs.upperBound != null) {
    parts.push(`Aralık: [${inputs.lowerBound.toFixed(1)} – ${inputs.upperBound.toFixed(1)}]`);
  }
  parts.push(`Güven seviyesi: %${level}`);
  return parts.join(' • ');
}
