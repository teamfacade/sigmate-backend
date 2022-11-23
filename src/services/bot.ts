import axios from 'axios';

export const activateBotServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    return await axios.get(process.env.LAMBDA_BOT_URL);
  }
};
