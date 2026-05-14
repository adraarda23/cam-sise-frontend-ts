import React from 'react';

interface ActualValueProps {
  value: number | string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ActualValueProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

/**
 * Görsel olarak "kesin / fiili" değerleri ifade eder.
 * Yeşil tonlar + kalın yazı = sistemin doğrudan kaydettiği, kesin bilinen sayı.
 *
 * Kullanım örneği: gerçekleşmiş stok girişi, onaylı toplama miktarı, tamamlanmış
 * plan mesafesi vb.
 */
export const ActualValue: React.FC<ActualValueProps> = ({
  value,
  unit,
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`text-actual-700 font-semibold ${SIZE_CLASSES[size]} ${className}`}
      title="Gerçekleşmiş (fiili) değer"
    >
      {value}
      {unit && <span className="ml-1 text-actual-600 font-normal">{unit}</span>}
    </span>
  );
};
