import apiClient from "./apiClient"; // 💡 같은 폴더에 있으므로 경로를 ./apiClient로 매끄럽게 수정

export const fileApi = {
  /**
   * 전역 단독 파일 업로드 API
   * @param {File} fileObject - 브라우저 인풋에서 선택된 실제 파일 객체
   */
  upload: (fileObject) => {
    const formData = new FormData();
    formData.append("file", fileObject);

    return apiClient.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
