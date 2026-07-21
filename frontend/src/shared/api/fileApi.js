import apiClient from "./apiClient";

const fetchFile = (fileUrl, inline = false) => apiClient.get("/files/download", {
  params: { fileUrl, inline },
  responseType: "blob",
});

const extractFileName = (response, fileUrl) => {
  const disposition = response.headers?.["content-disposition"] || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); }
    catch { return encoded; }
  }
  return String(fileUrl || "evidence-file").split("/").pop() || "evidence-file";
};

const createObjectUrl = (response) => URL.createObjectURL(response.data);

export const fileApi = {
  status: async (fileUrl) => {
    const response = await apiClient.get("/files/status", { params: { fileUrl } });
    return response.data?.data ?? response.data;
  },

  upload: (fileObject) => {
    const formData = new FormData();
    formData.append("file", fileObject);

    return apiClient.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  open: async (fileUrl) => {
    const previewWindow = window.open("", "_blank");
    if (previewWindow) previewWindow.opener = null;
    try {
      const response = await fetchFile(fileUrl, true);
      const objectUrl = createObjectUrl(response);
      if (previewWindow) previewWindow.location.href = objectUrl;
      else window.location.assign(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      if (previewWindow) previewWindow.close();
      throw error;
    }
  },

  download: async (fileUrl) => {
    const response = await fetchFile(fileUrl);
    const objectUrl = createObjectUrl(response);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = extractFileName(response, fileUrl);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },
};
