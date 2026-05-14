import React from 'react';

/**
 * Sayfa üstüne yerleştirilen legend chip'i.
 * Hocanın "kesin / tahmin / anomali" ayrımının kullanıcıya görsel olarak
 * açıklanması için. Tek satır, yan yana 3 chip.
 */
export const DataLegend: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-wrap gap-2 items-center text-xs ${className}`}>
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-actual-50 text-actual-700 border border-actual-200">
      <span className="w-2 h-2 rounded-full bg-actual-500" />
      Gerçekleşmiş
    </span>
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-estimated-50 text-estimated-700 border border-estimated-200">
      <span className="w-2 h-2 rounded-full bg-estimated-500" />
      Tahmin
    </span>
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-anomaly-50 text-anomaly-700 border border-anomaly-200">
      <span className="w-2 h-2 rounded-full bg-anomaly-500" />
      Anomali
    </span>
  </div>
);
