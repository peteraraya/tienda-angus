import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    if (!file && !url) {
      return NextResponse.json({ error: 'Falta archivo o URL' }, { status: 400 });
    }

    let uploadResult;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'tienda-angus', format: 'webp', quality: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
    } else if (url) {
      uploadResult = await cloudinary.uploader.upload(url, {
        folder: 'tienda-angus',
        format: 'webp',
        quality: 'auto'
      });
    }

    return NextResponse.json({ 
      secure_url: (uploadResult as any).secure_url,
      public_id: (uploadResult as any).public_id
    });
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Error al subir imagen' }, { status: 500 });
  }
}
