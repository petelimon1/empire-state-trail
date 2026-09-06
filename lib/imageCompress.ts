// Shrink/re-encode an image client-side before upload. Serverless function
// hosts (Netlify, Vercel) enforce a hard request-body limit around 4.5-6MB
// that Next.js config can't raise for Route Handlers — a single unedited
// phone photo (HEIC or high-res JPEG) routinely exceeds that on its own, so
// without this the upload fails before the request even reaches our code.
export async function compressImageForUpload(file: File, maxDimension = 2400, quality = 0.85): Promise<File> {
  // Already small enough — don't bother re-encoding.
  if (file.size <= 1.5 * 1024 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    // Browser couldn't decode this format client-side (e.g. HEIC support
    // varies outside Safari) — fall back to the original file and let the
    // server's sharp conversion handle it, same as before this existed.
    return file;
  }
}
