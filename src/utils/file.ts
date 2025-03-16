export const sanitizeFileName = (fileName: string): string => {
  // 파일 확장자 추출
  const extension = fileName.split(".").pop() || "";

  // 파일 이름에서 확장자 제거
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf("."));

  // 파일 이름에서 특수 문자 및 공백 제거하고 안전한 문자로 대체
  const sanitizedName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9]/g, "_") // 영문자, 숫자 외 모든 문자를 '_'로 대체
    .replace(/_+/g, "_") // 연속된 '_'를 하나로 합침
    .replace(/^_|_$/g, ""); // 시작과 끝의 '_' 제거

  // 고유한 파일 이름 생성 (타임스탬프 추가)
  const timestamp = Date.now();

  // 안전한 파일 이름 반환 (이름_타임스탬프.확장자)
  return `${sanitizedName}_${timestamp}.${extension}`;
};
