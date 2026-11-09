/**
 * Google Lens reverse image search utilities.
 * Connects high-resolution cropped garment photos directly into Google Lens.
 */

export interface GoogleLensActionResult {
  success: boolean;
  clipboardCopied: boolean;
  method: "form_upload" | "clipboard_direct";
}

/**
 * Converts any image blob or dataUrl to a PNG Blob (required by ClipboardItem in Safari & Chrome).
 */
export async function convertToPngBlob(imageSource: string | Blob): Promise<Blob> {
  if (imageSource instanceof Blob && imageSource.type === "image/png") {
    return imageSource;
  }

  const src = typeof imageSource === "string" ? imageSource : URL.createObjectURL(imageSource);

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context failed"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Blob conversion failed"));
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

/**
 * Searches Google Lens directly with the provided garment image:
 * 1. Copies the garment image directly into the user's system clipboard (PNG format)
 * 2. Attempts a native browser multipart form upload to https://lens.google.com/upload
 * 3. Opens Google Lens in a new tab ready for immediate visual analysis
 */
export async function searchInGoogleLens(imageSource: string): Promise<GoogleLensActionResult> {
  let clipboardCopied = false;
  let method: "form_upload" | "clipboard_direct" = "clipboard_direct";

  try {
    // 1. Prepare PNG blob for clipboard
    try {
      const pngBlob = await convertToPngBlob(imageSource);
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
        clipboardCopied = true;
      }
    } catch (clipErr) {
      console.warn("Could not write image to clipboard (permissions or format):", clipErr);
    }

    // 2. Fetch original blob for form submission
    const res = await fetch(imageSource);
    const blob = await res.blob();
    const file = new File([blob], "garment-piece.jpg", { type: blob.type || "image/jpeg" });

    // 3. Attempt native multipart browser form POST to https://lens.google.com/upload
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://lens.google.com/upload";
      form.enctype = "multipart/form-data";
      form.target = "_blank";
      form.rel = "noopener noreferrer";
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "file";
      input.name = "encoded_image";

      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();

      setTimeout(() => form.remove(), 1200);
      method = "form_upload";
    } catch (formErr) {
      console.warn("Direct form upload unavailable, opening lens homepage:", formErr);
      window.open("https://lens.google.com/", "_blank", "noopener,noreferrer");
    }

    return { success: true, clipboardCopied, method };
  } catch (err) {
    console.error("Failed to execute Google Lens search:", err);
    window.open("https://lens.google.com/", "_blank", "noopener,noreferrer");
    return { success: false, clipboardCopied, method: "clipboard_direct" };
  }
}

/**
 * Downloads the garment image to local disk for 1-click drag-and-drop onto Google Lens
 */
export function downloadGarmentImage(imageSource: string, filename = "garment-piece.png") {
  const link = document.createElement("a");
  link.href = imageSource;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
