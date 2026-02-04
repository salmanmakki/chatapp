import axios from "axios";

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axios.post(
    `${import.meta.env.VITE_BACKEND_URL}/api/user/upload`,
    formData,
    { withCredentials: true }
  );

  return res.data.imageUrl;
};
