import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/`,
});

export const IMAGE_BASE_URL = import.meta.env.VITE_API_URL;

// 🔥 Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;


// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:3000/api/",
// });

// export const IMAGE_BASE_URL = "http://localhost:3000";

// // const API = axios.create({
// //   baseURL: "http://52.60.184.203:3000/api/",
// // });

// // export const IMAGE_BASE_URL = "http://52.60.184.203:3000";


// // 🔥 Attach token automatically
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     req.headers.Authorization = `Bearer ${token}`;
//   }

//   return req;
// });

// export default API;