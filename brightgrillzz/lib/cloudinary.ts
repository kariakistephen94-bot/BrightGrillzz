// Cloudinary SIGNED-upload helper. Images AND short videos are uploaded straight
// from the browser to Cloudinary (bypassing the server, so large video files
// never hit the Next.js body limit). Each upload is authorised by a short-lived
// signature minted server-side at /api/media/sign, using the API key + secret.
// The API secret NEVER touches the client.
//
// Set these in .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name   (public: gates the UI)
//   CLOUDINARY_API_KEY=your-api-key                     (server only)
//   CLOUDINARY_API_SECRET=your-api-secret               (server only)

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''

// The API key/secret are server-only, so the client can't verify them directly.
// The public cloud name gates the upload UI; a missing secret surfaces as an
// error from the signing route when an upload is actually attempted.
export const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME)

interface CloudinarySignature {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
}

/** Ask the server to mint an upload signature (admin/staff only). */
async function fetchUploadSignature(): Promise<CloudinarySignature> {
  const res = await fetch('/api/media/sign', { method: 'POST' })
  if (!res.ok) {
    let message = `Could not authorise upload (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      /* keep the default message */
    }
    throw new Error(message)
  }
  return (await res.json()) as CloudinarySignature
}

/** Short-form cap: videos must be UNDER 5 minutes. */
export const MAX_VIDEO_SECONDS = 5 * 60

export type MediaKind = 'image' | 'video'

export interface CloudinaryUploadResult {
  kind: MediaKind
  url: string
  publicId: string
  posterUrl: string | null
  width: number | null
  height: number | null
  duration: number | null
  format: string | null
  bytes: number | null
}

/**
 * Read a video file's duration (seconds) in the browser without uploading it,
 * so we can reject anything 5 minutes or longer before it leaves the device.
 */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this video'))
    }
    video.src = url
  })
}

/** Turn a Cloudinary video secure_url into a still poster (first frame) URL. */
function derivePosterUrl(secureUrl: string): string | null {
  // .../video/upload/v123/abc.mp4  ->  .../video/upload/so_0/v123/abc.jpg
  if (!secureUrl.includes('/video/upload/')) return null
  return secureUrl
    .replace('/video/upload/', '/video/upload/so_0/')
    .replace(/\.[a-zA-Z0-9]+$/, '.jpg')
}

/**
 * Signed upload to Cloudinary. Fetches a fresh signature from the server, then
 * uploads directly to Cloudinary with the signed params. `onProgress` reports
 * 0–1 when available. Uses XHR (not fetch) purely so we can surface upload
 * progress to the admin.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured')
  }

  const sig = await fetchUploadSignature()

  const kind: MediaKind = file.type.startsWith('video/') ? 'video' : 'image'
  const resourceType = kind === 'video' ? 'video' : 'image'
  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', sig.apiKey)
  form.append('timestamp', String(sig.timestamp))
  form.append('folder', sig.folder)
  form.append('signature', sig.signature)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
    }

    xhr.onload = () => {
      let json: Record<string, unknown> = {}
      try {
        json = JSON.parse(xhr.responseText)
      } catch {
        /* fall through to the status check */
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const err = (json?.error as { message?: string } | undefined)?.message
        reject(new Error(err || `Upload failed (${xhr.status})`))
        return
      }
      const secureUrl = String(json.secure_url ?? '')
      resolve({
        kind,
        url: secureUrl,
        publicId: String(json.public_id ?? ''),
        posterUrl: kind === 'video' ? derivePosterUrl(secureUrl) : null,
        width: typeof json.width === 'number' ? json.width : null,
        height: typeof json.height === 'number' ? json.height : null,
        duration: typeof json.duration === 'number' ? json.duration : null,
        format: typeof json.format === 'string' ? json.format : null,
        bytes: typeof json.bytes === 'number' ? json.bytes : null,
      })
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}
