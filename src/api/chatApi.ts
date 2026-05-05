import apiClient from './axiosConfig';

export interface MessagePair {
  role: 'user' | 'model';
  text: string;
}

export const chatApi = {
  welcome: async (): Promise<string> => {
    const response = await apiClient.get('/api/chat/welcome');
    return response.data.reply;
  },
  send: async (message: string, history: MessagePair[]): Promise<string> => {
    const response = await apiClient.post('/api/chat', { message, history });
    return response.data.reply;
  },
};
