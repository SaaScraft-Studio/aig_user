// app/utils/fileValidation.ts
export const validateFileUpload = (
  file: File,
  allowedExtensions?: string,
  maxSizeMB?: number
): { valid: boolean; error?: string } => {
  // Validate file size
  if (maxSizeMB) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }
  }

  // Validate file extension if provided
  if (allowedExtensions) {
    const extensions = allowedExtensions
      .split(",")
      .map((ext) => ext.trim().toLowerCase().replace(".", ""));

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !extensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed: ${allowedExtensions}`,
      };
    }
  }

  return { valid: true };
};

// Helper function to get accept attribute for file input
export const getAcceptAttribute = (allowedExtensions?: string): string => {
  if (!allowedExtensions) return "*/*";

  const extensions = allowedExtensions
    .split(",")
    .map((ext) => ext.trim().toLowerCase());

  // Map common extensions to MIME types
  const mimeTypeMap: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",

    // Archives
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    // Media
    mp3: "audio/mpeg",
    wav: "audio/wav",
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wmv: "video/x-ms-wmv",
  };

  // Try to get MIME types, fallback to extensions
  const acceptTypes = extensions.map((ext) => {
    const mimeType = mimeTypeMap[ext];
    return mimeType ? mimeType : `.${ext}`;
  });

  return acceptTypes.join(",");
};

// Helper to get file icon based on extension
export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return "📄";
    case "doc":
    case "docx":
      return "📝";
    case "xls":
    case "xlsx":
      return "📊";
    case "ppt":
    case "pptx":
      return "📈";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return "🖼️";
    case "mp3":
    case "wav":
      return "🎵";
    case "mp4":
    case "avi":
    case "mov":
      return "🎬";
    case "zip":
    case "rar":
    case "7z":
      return "📦";
    case "txt":
    case "csv":
    case "json":
      return "📄";
    default:
      return "📎";
  }
};

// Helper to format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
