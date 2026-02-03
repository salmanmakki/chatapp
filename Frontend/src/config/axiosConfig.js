import axios from "axios";
import API_CONFIG from "./api.js";

// Configure global Axios defaults to point to the backend API
axios.defaults.baseURL = API_CONFIG.BASE_URL;
axios.defaults.withCredentials = true;

// Optional: you can customize headers here if needed
// axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

export default axios;
