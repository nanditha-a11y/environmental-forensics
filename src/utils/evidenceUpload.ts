/**
 * Calculates SHA-256 hash of a File object using Web Crypto API.
 */
export async function calculateSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export interface UploadResult {
  fileUrl: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
}

interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  key?: string;
}

interface ApiErrorResponse {
  message?: string;
}

/**
 * Uploads a file directly using a presigned S3 upload URL
 * and computes its SHA-256 integrity hash.
 */
export async function uploadEvidenceFile(
  file: File,
  apiBaseUrl: string = 'http://localhost:5000'
): Promise<UploadResult> {
  // 1. Calculate client-side SHA-256 checksum
  const fileHash = await calculateSHA256(file);

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Request presigned upload URL from backend
  const presignResponse = await fetch(`${apiBaseUrl}/api/evidence/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }),
  });

  if (!presignResponse.ok) {
    const errorData = (await presignResponse.json()) as ApiErrorResponse;
    throw new Error(errorData.message || 'Failed to request upload URL');
  }

  const { uploadUrl, fileUrl } = (await presignResponse.json()) as PresignResponse;

  // 3. Directly upload binary payload to Object Storage via PUT request
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Direct binary upload to storage failed');
  }

  return {
    fileUrl,
    fileHash,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}