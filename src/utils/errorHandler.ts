import { AxiosError } from 'axios';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Server responded with error
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          return message || 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
        case 401:
          return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        case 403:
          return 'Bu işlem için yetkiniz yok.';
        case 404:
          return 'İstenen kaynak bulunamadı.';
        case 500:
          return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        default:
          return message || 'Bir hata oluştu.';
      }
    }

    // Network error
    if (error.request) {
      return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    }
  }

  return 'Beklenmeyen bir hata oluştu.';
};
