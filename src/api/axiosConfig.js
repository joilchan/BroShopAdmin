import axios from 'axios';

const api = axios.create({
    // Укажите URL, на котором запущен ваш ASP.NET Core API (см. Properties/launchSettings.json)
    baseURL: 'http://94.232.43.184:8080/api', 
    //baseURL: 'http://localhost:5281', 
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;