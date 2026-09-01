import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { uploadImage } from "@/lib/cloudinary";

const maxBytes = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return jsonError("Image file is required.", 400);
  }

  if (!allowedTypes.has(file.type)) {
    return jsonError("Use a JPG, PNG, WebP, or GIF image.", 400);
  }

  if (file.size > maxBytes) {
    return jsonError("Image must be 5 MB or smaller.", 400);
  }

  try {
    const uploaded = await uploadImage(file);
    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";
    return jsonError(message, 500);
  }
}
