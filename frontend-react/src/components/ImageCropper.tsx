import React, { useState, useCallback } from "react";
import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";
import { Slider } from "@mui/material";
import { Plus, Minus } from "lucide-react";
import { getCroppedImg } from "../utils/cropImage";
import { useTranslation } from "react-i18next";

interface ImageCropperProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (file: Blob, previewUrl: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onClose,
  onSave,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const { t } = useTranslation();

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const { url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(url);
      setIsPreview(true);
    } catch (e) {
      console.error("Erreur crop preview:", e);
    }
  }, [croppedAreaPixels, imageSrc]);

  const handleBack = () => {
    setIsPreview(false);
    setCroppedImage(null);
  };

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const { file, url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(file, url); // renvoie au parent
      onClose(); // ferme le cropper
    } catch (e) {
      console.error("Erreur sauvegarde crop:", e);
    }
  }, [croppedAreaPixels, imageSrc, onSave, onClose]);

  return (
    <div className="rounded shadow-md bg-white overflow-hidden">
      <div className="bg-blue-600 text-white text-center py-2 font-bold">
        {t("imageCropper.title")}
      </div>

      {/* Instructions */}
      {!isPreview && (
        <div className="p-2 text-center text-red-600 text-sm border-b">
          {t("imageCropper.instructions")}
        </div>
      )}
      {!isPreview ? (
        <div className="relative h-[300px] bg-gray-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      ) : (
        <div className="h-[300px] py-2 flex items-center justify-center bg-gray-100">
          <img
            src={croppedImage!}
            alt="Prévisualisation"
            className="max-h-full max-w-full rounded"
          />
        </div>
      )}

      {/* Contrôles zoom */}
      {!isPreview && (
        <div className="flex items-center justify-center gap-4 p-3">
          <button
            type="button"
            title="Zoom -"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="p-1 bg-blue-100 rounded-full"
          >
            <Minus className="w-4 h-4 text-blue-700" />
          </button>

          <Slider
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(_, value) => setZoom(value as number)}
            sx={{ width: 200 }}
          />

          <button
            type="button"
            title="Zoom +"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="p-1 bg-blue-100 rounded-full"
          >
            <Plus className="w-4 h-4 text-blue-700" />
          </button>
        </div>
      )}

      <div className="flex justify-between p-3 border-t bg-gray-50">
        {!isPreview ? (
          <button
            onClick={handlePreview}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("imageCropper.preview")}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
            >
              {t("imageCropper.back")}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t("imageCropper.save")}
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
        >
          {t("imageCropper.cancel")}
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
