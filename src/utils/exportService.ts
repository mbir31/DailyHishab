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
}

export async function exportElementToImage(options: ExportReportOptions): Promise<boolean> {
  const { elementId, filename, format } = options;
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export element #${elementId} not found`);
    return false;
  }

  try {
    const canvas = await renderElementToCanvas(element, {
      backgroundColor: format === 'jpg' ? '#FFFFFF' : null,
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, 0.95);

    // Always trigger direct download to save a copy to device storage/gallery
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Check Web Share API with File support
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${filename}.${format}`, { type: mimeType });

        if (navigator.canShare({ files: [file] })) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          await navigator.share({
            title: options.title || 'DailyHishab Financial Statement',
            text: 'Financial Summary from DailyHishab',
            files: [file],
          });
          return true;
        }
      } catch (shareErr) {
        console.warn('Web Share failed or cancelled (copy already saved to device):', shareErr);
      }
    }

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
}): Promise<{ success: boolean; method: 'web-share' | 'whatsapp' | 'download' | 'error'; error?: string }> {
  const { elementId, filename, title, textSummary, targetApp } = options;
  const element = document.getElementById(elementId);
  if (!element) {
    return { success: false, method: 'error', error: 'Statement preview template not found' };
  }

  try {
    const canvas = await renderElementToCanvas(element, {
      backgroundColor: '#FFFFFF',
    });

    const mimeType = 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, 0.92);

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${filename}.jpg`, { type: mimeType });

    // Always trigger direct download to guarantee a copy is saved to device storage/gallery
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Try Web Share API (native share drawer to WhatsApp, Telegram, etc.)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await navigator.share({
          title: title,
          text: textSummary,
          files: [file],
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
      const waText = encodeURIComponent(`${textSummary}\n\n*(JPG Statement image saved to device gallery - attach it to your message)*`);
      window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
      return { success: true, method: 'whatsapp' };
    }

    return { success: true, method: 'download' };
  } catch (err: any) {
    console.error('Failed to generate JPG image:', err);
    return { success: false, method: 'error', error: err.message || 'Image generation failed' };
  }
}
