import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { uploadImage, uploadRaw } from "@/lib/cloudinary";

const maxBytes = 5 * 1024 * 1024;
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const pdfTypes = new Set(["application/pdf"]);

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return jsonError("File is required.", 400);
  }

  if (file.size > maxBytes) {
    return jsonError("File must be 5 MB or smaller.", 400);
  }

  const isImage = imageTypes.has(file.type);
  const isPdf = pdfTypes.has(file.type);

  if (!isImage && !isPdf) {
    return jsonError("Use a JPG, PNG, WebP, GIF image, or PDF document.", 400);
  }

  try {
    const uploaded = isPdf ? await uploadRaw(file) : await uploadImage(file);
    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      publicId: uploaded.publicId,
      type: isPdf ? "pdf" : "image",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return jsonError(message, 500);
  }
}
