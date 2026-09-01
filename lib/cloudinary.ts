import { createHash } from "crypto";
import { getCloudinaryEnv } from "@/lib/env";

type UploadResult = {
  url: string;
  publicId: string;
};

export async function uploadImage(file: File): Promise<UploadResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const data = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(data.error?.message ?? "Image upload failed.");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}
