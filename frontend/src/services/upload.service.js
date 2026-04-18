const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

export async function uploadFileToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo subir el archivo.");
  }

  const payload = await response.json();
  const data = payload.data;
  // Normalise field names so callers can use either convention
  return {
    ...data,
    url: data.url ?? data.fileUrl,
    thumbnailUrl: data.thumbnailUrl ?? data.fileThumbUrl ?? data.fileUrl,
  };
}
