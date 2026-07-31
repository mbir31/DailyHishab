import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';

// Offscreen 1x1 canvas for resolving ANY CSS color string (oklch, oklab, color(srgb...), etc.) to RGB/HEX natively
const colorCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (colorCanvas) {
  colorCanvas.width = 1;
  colorCanvas.height = 1;
}
const colorCtx = colorCanvas ? colorCanvas.getContext('2d', { willReadFrequently: true }) : null;

export function resolveCssColorToRgb(colorStr: string): string {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit' || colorStr === 'initial' || colorStr === 'none') {
    return colorStr;
  }
  if (!colorCtx) return colorStr;

  try {
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = '#000000';
    colorCtx.fillStyle = colorStr;

    const fill = colorCtx.fillStyle;
    if (fill.startsWith('#')) {
      const hex = fill.slice(1);
      const num = parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgb(${r}, ${g}, ${b})`;
    }
    return fill;
  } catch (e) {
    return colorStr;
  }
}

// Deep clone element & recursively replace all computed colors with explicit RGB/RGBA values
function cloneAndNormalizeElement(
  originalElement: HTMLElement,
  backgroundColor?: string | null
): { tempContainer: HTMLDivElement; tempClone: HTMLElement } {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '0px';
  tempContainer.style.top = '0px';
  tempContainer.style.zIndex = '-9999';
  tempContainer.style.opacity = '1';
  tempContainer.style.pointerEvents = 'none';
  tempContainer.style.overflow = 'visible';
  tempContainer.style.background = backgroundColor || '#FFFFFF';

  const tempClone = originalElement.cloneNode(true) as HTMLElement;
  tempClone.style.position = 'relative';
  tempClone.style.left = '0px';
  tempClone.style.top = '0px';
  tempClone.style.margin = '0px';
  tempClone.style.transform = 'none';

  tempContainer.appendChild(tempClone);
  document.body.appendChild(tempContainer);

  // Walk nodes in parallel to compute and set explicit RGB values
  const origNodes = Array.from(originalElement.querySelectorAll<HTMLElement>('*'));
  const cloneNodes = Array.from(tempClone.querySelectorAll<HTMLElement>('*'));

  // Also include root nodes
  const allOrig: HTMLElement[] = [originalElement, ...origNodes];
  const allClone: HTMLElement[] = [tempClone, ...cloneNodes];

  for (let i = 0; i < allOrig.length; i++) {
    const orig = allOrig[i];
    const clone = allClone[i];
    if (!orig || !clone) continue;

    try {
      const computed = window.getComputedStyle(orig);
      if (computed.color) clone.style.color = resolveCssColorToRgb(computed.color);
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        clone.style.backgroundColor = resolveCssColorToRgb(computed.backgroundColor);
      }
      if (computed.borderColor) clone.style.borderColor = resolveCssColorToRgb(computed.borderColor);
      if (computed.borderTopColor) clone.style.borderTopColor = resolveCssColorToRgb(computed.borderTopColor);
      if (computed.borderRightColor) clone.style.borderRightColor = resolveCssColorToRgb(computed.borderRightColor);
      if (computed.borderBottomColor) clone.style.borderBottomColor = resolveCssColorToRgb(computed.borderBottomColor);
      if (computed.borderLeftColor) clone.style.borderLeftColor = resolveCssColorToRgb(computed.borderLeftColor);
      if (computed.fill && computed.fill !== 'none') clone.style.fill = resolveCssColorToRgb(computed.fill);
      if (computed.stroke && computed.stroke !== 'none') clone.style.stroke = resolveCssColorToRgb(computed.stroke);
    } catch (e) {
      // ignore individual node failure
    }
  }

  return { tempContainer, tempClone };
}

export async function renderElementToCanvas(
  element: HTMLElement,
  options?: { backgroundColor?: string | null }
): Promise<HTMLCanvasElement> {
  const bgVal = options?.backgroundColor !== undefined && options.backgroundColor !== null ? options.backgroundColor : '#FFFFFF';

  const { tempContainer, tempClone } = cloneAndNormalizeElement(element, bgVal);

  // Give browser a quick tick to resolve fonts and layout
  await new Promise((r) => setTimeout(r, 60));

  try {
    // Primary Renderer: html-to-image (Uses native browser SVG foreignObject rendering, no JS color parser crashes)
    const canvas = await htmlToImage.toCanvas(tempClone, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: bgVal,
      cacheBust: true,
    });

    if (canvas && canvas.width > 0 && canvas.height > 0) {
      document.body.removeChild(tempContainer);
      return canvas;
    }
  } catch (htmlToImageErr) {
    console.warn('html-to-image rendering encountered an issue, running html2canvas fallback:', htmlToImageErr);
  }

  // Secondary Fallback: html2canvas with sanitized styles
  try {
    const canvas = await html2canvas(tempClone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgVal,
      logging: false,
      onclone: (clonedDoc) => {
        // Strip or convert any remaining raw <style> tags containing oklch
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((style) => {
          if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab') || style.textContent.includes('@theme'))) {
            style.textContent = style.textContent
              .replace(/oklch\([^)]+\)/gi, (m) => resolveCssColorToRgb(m))
              .replace(/oklab\([^)]+\)/gi, (m) => resolveCssColorToRgb(m));
          }
        });
      },
    });

    document.body.removeChild(tempContainer);
    return canvas;
  } catch (html2canvasErr) {
    document.body.removeChild(tempContainer);
    console.error('html2canvas fallback failed:', html2canvasErr);
    throw html2canvasErr;
  }
}

export interface ExportReportOptions {
  elementId: string;
  filename: string;
  format: 'jpg' | 'png';
  title?: string;
  language?: 'en' | 'bn';
}

export interface PageSlice {
  startY: number;
  endY: number;
  sliceHeight: number;
}

/**
 * Calculates smart vertical cut points so that no data row or section block is split across A4 page boundaries.
 */
export function calculateSmartPageSlices(
  element: HTMLElement | null,
  canvas: HTMLCanvasElement,
  pageCanvasHeight: number,
  options?: { topMargin?: number; bottomMargin?: number }
): PageSlice[] {
  const topMargin = options?.topMargin ?? Math.floor(pageCanvasHeight * 0.03); // ~3% top padding
  const bottomMargin = options?.bottomMargin ?? Math.floor(pageCanvasHeight * 0.05); // ~5% bottom padding (footer area)
  const maxContentHeight = pageCanvasHeight - topMargin - bottomMargin;

  if (canvas.height <= pageCanvasHeight) {
    return [{ startY: 0, endY: canvas.height, sliceHeight: canvas.height }];
  }

  const items: { top: number; bottom: number }[] = [];

  if (element) {
    const containerRect = element.getBoundingClientRect();
    const scale = canvas.width / (containerRect.width || element.offsetWidth || 1);

    const selectors = [
      '[data-page-break-avoid="true"]',
      '.statement-row',
      '.statement-block',
      'tr',
      '.avoid-page-break',
    ].join(', ');

    const breakAvoidNodes = Array.from(element.querySelectorAll<HTMLElement>(selectors));

    for (const node of breakAvoidNodes) {
      const rect = node.getBoundingClientRect();
      if (rect.height <= 0) continue;
      const top = (rect.top - containerRect.top) * scale;
      const bottom = (rect.bottom - containerRect.top) * scale;
      items.push({ top, bottom });
    }

    items.sort((a, b) => a.top - b.top);
  }

  const slices: PageSlice[] = [];
  let currentY = 0;

  while (currentY < canvas.height) {
    let idealEndY = currentY + maxContentHeight;

    if (idealEndY >= canvas.height - 15) {
      slices.push({
        startY: currentY,
        endY: canvas.height,
        sliceHeight: canvas.height - currentY,
      });
      break;
    }

    let adjustedCutY = idealEndY;

    // Check if idealEndY splits any non-breakable item
    for (const item of items) {
      if (item.top < idealEndY && item.bottom > idealEndY) {
        // Cut right above this row/block with a 6px safe buffer
        const safeCut = item.top - Math.floor(6 * (canvas.width / 820));
        if (safeCut > currentY + Math.floor(maxContentHeight * 0.25)) {
          adjustedCutY = safeCut;
        }
        break;
      }
    }

    if (adjustedCutY <= currentY) {
      adjustedCutY = idealEndY;
    }

    slices.push({
      startY: currentY,
      endY: adjustedCutY,
      sliceHeight: adjustedCutY - currentY,
    });

    currentY = adjustedCutY;
  }

  return slices;
}

export function sliceCanvasToA4Pages(
  canvas: HTMLCanvasElement,
  filename: string,
  language: 'en' | 'bn' = 'en',
  element?: HTMLElement | null
): { files: File[]; dataUrls: string[]; pageFilenames: string[] } {
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const pageCanvasHeight = Math.floor((imgWidth * 297) / 210);

  const topMargin = Math.floor(pageCanvasHeight * 0.03);
  const bottomMargin = Math.floor(pageCanvasHeight * 0.05);

  const slices = calculateSmartPageSlices(element || null, canvas, pageCanvasHeight, {
    topMargin,
    bottomMargin,
  });

  const totalPages = slices.length;
  const files: File[] = [];
  const dataUrls: string[] = [];
  const pageFilenames: string[] = [];

  const mimeType = 'image/jpeg';
  const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toBn = (n: number) => String(n).replace(/\d/g, (d) => bnNums[parseInt(d, 10)]);

  if (totalPages === 1) {
    const dataUrl = canvas.toDataURL(mimeType, 0.95);
    const curFilename = `${filename}.jpg`;
    dataUrls.push(dataUrl);
    pageFilenames.push(curFilename);

    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let j = 0; j < byteString.length; j++) {
      ia[j] = byteString.charCodeAt(j);
    }
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], curFilename, { type: mimeType });
    files.push(file);
    return { files, dataUrls, pageFilenames };
  }

  const footerH = Math.max(28, Math.floor(imgWidth / 30));

  for (let i = 0; i < totalPages; i++) {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = pageCanvasHeight;
    const ctx = pageCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, imgWidth, pageCanvasHeight);

      const slice = slices[i];

      // Draw slice onto page canvas starting cleanly at topMargin
      ctx.drawImage(
        canvas,
        0, slice.startY,
        imgWidth, slice.sliceHeight,
        0, topMargin,
        imgWidth, slice.sliceHeight
      );

      // Dynamic page footer on each multi-page image slice
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, pageCanvasHeight - footerH, imgWidth, footerH);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, pageCanvasHeight - footerH);
      ctx.lineTo(imgWidth, pageCanvasHeight - footerH);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      const fontSize = Math.max(12, Math.floor(imgWidth / 55));
      ctx.font = `600 ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';

      const pageLabel =
        language === 'bn'
          ? `পৃষ্ঠা ${toBn(i + 1)} / ${toBn(totalPages)}`
          : `Page ${i + 1} of ${totalPages}`;
      ctx.fillText(pageLabel, imgWidth / 2, pageCanvasHeight - Math.floor(footerH / 3));
    }

    const dataUrl = pageCanvas.toDataURL(mimeType, 0.95);
    dataUrls.push(dataUrl);

    const curFilename = `${filename}_Page_${i + 1}_of_${totalPages}.jpg`;
    pageFilenames.push(curFilename);

    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let j = 0; j < byteString.length; j++) {
      ia[j] = byteString.charCodeAt(j);
    }
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], curFilename, { type: mimeType });
    files.push(file);
  }

  return { files, dataUrls, pageFilenames };
}

export async function exportElementToImage(options: ExportReportOptions): Promise<boolean> {
  const { elementId, filename, format, language = 'en' } = options;
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export element #${elementId} not found`);
    return false;
  }

  try {
    const canvas = await renderElementToCanvas(element, {
      backgroundColor: format === 'jpg' ? '#FFFFFF' : null,
    });

    if (format === 'jpg') {
      const { files, dataUrls, pageFilenames } = sliceCanvasToA4Pages(canvas, filename, language, element);

      for (let i = 0; i < dataUrls.length; i++) {
        const link = document.createElement('a');
        link.download = pageFilenames[i];
        link.href = dataUrls[i];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (dataUrls.length > 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 150));
          await navigator.share({
            title: options.title || 'DailyHishab Financial Statement',
            text: 'Financial Summary from DailyHishab',
            files,
          });
        } catch (shareErr) {
          console.warn('Web Share failed or cancelled (copy already saved to device):', shareErr);
        }
      }
      return true;
    }

    const mimeType = 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, 0.95);

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (err) {
    console.error('Error rendering image report:', err);
    return false;
  }
}

export async function shareStatementAsImage(options: {
  elementId: string;
  filename: string;
  title: string;
  textSummary: string;
  targetApp?: 'whatsapp' | 'general';
  language?: 'en' | 'bn';
}): Promise<{ success: boolean; method: 'web-share' | 'whatsapp' | 'download' | 'error'; error?: string }> {
  const { elementId, filename, title, textSummary, targetApp, language = 'en' } = options;
  const element = document.getElementById(elementId);
  if (!element) {
    return { success: false, method: 'error', error: 'Statement preview template not found' };
  }

  try {
    const canvas = await renderElementToCanvas(element, {
      backgroundColor: '#FFFFFF',
    });

    const { files, dataUrls, pageFilenames } = sliceCanvasToA4Pages(canvas, filename, language, element);

    // Direct download each page JPG to device storage/gallery
    for (let i = 0; i < dataUrls.length; i++) {
      const link = document.createElement('a');
      link.download = pageFilenames[i];
      link.href = dataUrls[i];
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (dataUrls.length > 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Try Web Share API with all files
    if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await navigator.share({
          title: title,
          text: textSummary,
          files: files,
        });
        return { success: true, method: 'web-share' };
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'web-share', error: 'Share modal dismissed, copy saved to gallery' };
        }
        console.warn('Web Share failed, falling back to direct download & chat link:', shareErr);
      }
    }

    // If targeted for WhatsApp specifically or fallback mode
    if (targetApp === 'whatsapp') {
      const pageInfo = files.length > 1 ? ` (${files.length} JPG Pages)` : '';
      const waText = encodeURIComponent(`${textSummary}\n\n*(JPG Statement image${pageInfo} saved to device gallery - attach it to your message)*`);
      window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
      return { success: true, method: 'whatsapp' };
    }

    return { success: true, method: 'download' };
  } catch (err: any) {
    console.error('Failed to generate JPG image:', err);
    return { success: false, method: 'error', error: err.message || 'Image generation failed' };
  }
}
