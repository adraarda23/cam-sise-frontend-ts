import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Beklemede',
      APPROVED: 'Onaylandı',
      REJECTED: 'Reddedildi',
      SCHEDULED: 'Planlandı',
      CANCELLED: 'İptal Edildi',
      GENERATED: 'Oluşturuldu',
      ASSIGNED: 'Araç Atandı',
      IN_PROGRESS: 'Devam Ediyor',
      COMPLETED: 'Tamamlandı',
    };
    return statusMap[status] || status;
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {getStatusText(status)}
    </span>
  );
};
