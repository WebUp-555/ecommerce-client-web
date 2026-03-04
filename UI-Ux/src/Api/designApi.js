import api from "./axiosInstance";

export const generateAnimeDesign = async ({
  prompt,
  imageFile,
  highResolutionExport = false,
  customPlacement = false,
}) => {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("highResolutionExport", String(highResolutionExport));
  formData.append("customPlacement", String(customPlacement));
  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {
    const response = await api.post("/designs/anime", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Design generation failed";
    throw new Error(message);
  }
};

export const getMyDesignById = async (designId) => {
  const response = await api.get(`/designs/my/${designId}`);
  return response.data;
};
