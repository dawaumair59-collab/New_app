import { Router, type IRouter } from "express";
import { v2 as cloudinary } from "cloudinary";
import { UploadMediaBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router: IRouter = Router();

router.post("/upload", async (req, res): Promise<void> => {
  const parsed = UploadMediaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data, resourceType, folder } = parsed.data;

  try {
    const result = await cloudinary.uploader.upload(data, {
      resource_type: resourceType as "image" | "video",
      folder: folder ?? "tasty-point",
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      width: result.width ?? null,
      height: result.height ?? null,
      format: result.format ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Cloudinary upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
