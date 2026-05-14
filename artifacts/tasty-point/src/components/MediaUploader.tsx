import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Video, X, CheckCircle2, AlertCircle, CloudUpload } from "lucide-react";
import { useUploadMedia } from "@workspace/api-client-react";

type UploadState = "idle" | "uploading" | "success" | "error";

interface MediaUploaderProps {
  label: string;
  accept: "image" | "video";
  value: string;
  onChange: (url: string) => void;
}

export function MediaUploader({ label, accept, value, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isImage = accept === "image";
  const hasValue = !!value;

  const upload = useCallback(async (file: File) => {
    const isValidType = isImage
      ? file.type.startsWith("image/")
      : file.type.startsWith("video/");

    if (!isValidType) {
      setErrorMsg(`Please select a ${isImage ? "image" : "video"} file.`);
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setProgress(0);
    setErrorMsg("");

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 18, 88));
    }, 200);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      try {
        const result = await uploadMedia.mutateAsync({
          data: {
            data: `data:${file.type};base64,${base64}`,
            resourceType: isImage ? "image" : "video",
          },
        });
        clearInterval(progressInterval);
        setProgress(100);
        setUploadState("success");
        onChange(result.url);
      } catch {
        clearInterval(progressInterval);
        setUploadState("error");
        setErrorMsg("Upload failed. Check Cloudinary settings.");
      }
    };
    reader.readAsDataURL(file);
  }, [isImage, onChange, uploadMedia]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }, [upload]);

  const handleRemove = () => {
    onChange("");
    setUploadState("idle");
    setProgress(0);
    setErrorMsg("");
  };

  const Icon = isImage ? ImageIcon : Video;
  const acceptAttr = isImage ? "image/*" : "video/*";

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        capture={isImage ? "environment" : undefined}
        className="hidden"
        onChange={handleFileInput}
      />

      <AnimatePresence mode="wait">
        {hasValue && uploadState !== "uploading" ? (
          /* Preview Card */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative rounded-2xl overflow-hidden border-2 border-green-200 bg-black group"
          >
            {isImage ? (
              <img
                src={value}
                alt="preview"
                className="w-full h-40 object-cover"
                onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
              />
            ) : (
              <video
                src={value}
                className="w-full h-40 object-cover"
                muted
                playsInline
                controls
              />
            )}

            {/* Success badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <CheckCircle2 size={10} />
              Uploaded
            </div>

            {/* Change / Remove overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>

            {/* Remove button always visible */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X size={13} />
            </button>
          </motion.div>
        ) : uploadState === "uploading" ? (
          /* Upload Progress */
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CloudUpload size={18} className="text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Uploading to Cloudinary…
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-red-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ) : uploadState === "error" ? (
          /* Error State */
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Upload failed</p>
                <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setUploadState("idle"); setErrorMsg(""); }}
              className="mt-3 w-full text-xs font-semibold text-red-600 border border-red-200 py-1.5 rounded-xl hover:bg-red-100 transition-colors"
            >
              Try again
            </button>
          </motion.div>
        ) : (
          /* Idle / Drop Zone */
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative rounded-2xl border-2 border-dashed cursor-pointer
              transition-all duration-200 select-none
              ${dragging
                ? "border-primary bg-primary/8 scale-[1.01]"
                : "border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/4"
              }
            `}
          >
            <div className="flex flex-col items-center justify-center py-7 px-4 gap-3">
              <motion.div
                animate={{ scale: dragging ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dragging ? "bg-primary/15" : "bg-white border border-gray-200 shadow-sm"}`}
              >
                <Icon size={22} className={dragging ? "text-primary" : "text-gray-400"} />
              </motion.div>

              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {dragging ? "Drop to upload" : isImage ? "Upload photo" : "Upload video"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Drag & drop or tap to choose from gallery
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                <Icon size={13} />
                {isImage ? "Choose Photo" : "Choose Video"}
              </div>
            </div>

            {dragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
