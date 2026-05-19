import axios from 'axios';

const api = axios.create({
    // Укажите URL, на котором запущен ваш ASP.NET Core API (см. Properties/launchSettings.json)
    baseURL: 'http://localhost:5281/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;