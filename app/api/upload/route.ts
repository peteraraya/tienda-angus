import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/utils/supabase/admin';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_MULTIPART_SIZE = MAX_FILE_SIZE + 64 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isSupportedImage(buffer: Buffer): boolean {
  const isJpeg = buffer.length >= 3 &&
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  return isJpeg || isPng || isWebp;
}

function isAllowedRemoteImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !isIP(hostname) &&
      hostname !== 'localhost' &&
      !hostname.endsWith('.localhost') &&
      !hostname.endsWith('.local');
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!await isAdminRequest()) {
      return NextResponse.json({ error: 'Acceso restringido al administrador' }, { status: 403 });
    }

    const contentLengthHeader = request.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
    if (
      contentLengthHeader &&
      (!Number.isFinite(contentLength) || contentLength === null || contentLength <= 0 || contentLength > MAX_MULTIPART_SIZE)
    ) {
      return NextResponse.json({ error: 'La carga supera el límite permitido' }, { status: 413 });
    }

    const formData = await request.formData();
    const fileValue = formData.get('file');
    const urlValue = formData.get('url');
    const file = fileValue instanceof File ? fileValue : null;
    const url = typeof urlValue === 'string' ? urlValue.trim() : '';

    if (!file && !url) {
      return NextResponse.json({ error: 'Falta archivo o URL' }, { status: 400 });
    }
    if (file && url) {
      return NextResponse.json({ error: 'Envía un archivo o una URL, no ambos' }, { status: 400 });
    }

    let uploadResult: UploadApiResponse | undefined;

    if (file) {
      if (!ALLOWED_MIME_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Formato no permitido o archivo mayor a 5 MB' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!isSupportedImage(buffer)) {
        return NextResponse.json({ error: 'El contenido no corresponde a una imagen admitida' }, { status: 400 });
      }

      uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'tienda-angus',
            format: 'webp',
            quality: 'auto',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error('Cloudinary no devolvió un resultado de carga'));
          }
        );
        uploadStream.end(buffer);
      });
    } else if (url) {
      if (url.length > 2048 || !isAllowedRemoteImageUrl(url)) {
        return NextResponse.json({ error: 'La URL debe ser HTTPS y apuntar a un dominio público válido' }, { status: 400 });
      }

      uploadResult = await cloudinary.uploader.upload(url, {
        folder: 'tienda-angus',
        format: 'webp',
        quality: 'auto',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      });
    }

    if (!uploadResult?.secure_url || !uploadResult.public_id) {
      throw new Error('Cloudinary no devolvió un resultado de carga válido');
    }

    return NextResponse.json({
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
