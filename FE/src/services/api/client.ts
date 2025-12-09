import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:4000/api', // Adjust if BE port differs
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
