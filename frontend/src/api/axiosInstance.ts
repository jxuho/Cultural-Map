import axios from 'axios';

// const API_BASE_URL = import.meta.env.PROD
//   ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1"
//   : "http://localhost:5000/api/v1";

//axios.create creates a custom Axios instance (object). This instance can contain common settings such as base URL, headers, timeouts, etc., making it easier to manage API requests. For example, if you need to use the same base URL and authentication token for all requests, using instances created with axios.create can reduce code duplication and make maintenance easier.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
