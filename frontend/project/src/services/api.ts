import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export const chatApi = {
  sendMessage: async (roomId: number, userPrompt: string): Promise<string> => {
    const response = await axios.post(
      `${API_BASE_URL}/${roomId}/chat`,
      null,
      {
        params: {
          userPrompt,
        },
      }
    );
    return response.data;
  },

  getRoomList: async () => {
    const response = await axios.get(`${API_BASE_URL}/rooms`);
    return response.data;
  },
};
