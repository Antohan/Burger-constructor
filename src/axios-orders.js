import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://react-burger-api.firebaseio.com/'
});

export default instance;