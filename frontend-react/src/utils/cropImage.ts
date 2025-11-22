import type { Area } from "react-easy-crop";

export const getCroppedImg = (
  imageSrc: string,
  crop: Area
): Promise<{ file: Blob; url: string }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return reject(new Error("Canvas non supporté"));
      }

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Erreur conversion Blob"));
        resolve({ file: blob, url: URL.createObjectURL(blob) });
      }, "image/jpeg");
    };
    image.onerror = () => reject(new Error("Erreur chargement image"));
  });
};
