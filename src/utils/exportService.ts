import html2canvas from 'html2canvas';

const oklchCache = new Map<string, string>();

function convertSingleOklchToRgb(match: string): string {
  if (oklchCache.has(match)) {
    return oklchCache.get(match)!;
  }

  try {
    const div = document.createElement('div');
    div.style.color = match;
    document.body.appendChild(div);
    const computed = window.getComputedStyle(div).color;
    document.body.removeChild(div);

    if (computed && !computed.includes('oklch') && computed !== '') {
      oklchCache.set(match, computed);
      return computed;
    }
  } catch (e) {
    // ignore
  }

  const fallback = 'rgb(100, 116, 139)';
  oklchCache.set(match, fallback);
  return fallback;
}

export function replaceOklchInCssText(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return cssText;
  if (!cssText.includes('oklch') && !cssText.includes('oklab')) return cssText;

  return cssText
    .replace(/oklch\([^)]+\)/gi, (m) => convertSingleOklchToRgb(m))
    .replace(/oklab\([^)]+\)/gi, (m) => convertSingleOklchToRgb(m));
}

export function sanitizeClonedDocForCanvas(clonedDoc: Document, targetElementId?: string) {
  try {
    // 1. Sanitize all <style> elements
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((style) => {
      if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
        style.textContent = replaceOklchInCssText(style.textContent);
      }
    });

    // 2. Sanitize inline style attributes
    const elements = clonedDoc.querySelectorAll('*');
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.getAttribute) {
        const inlineStyle = htmlEl.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('oklab'))) {
          htmlEl.setAttribute('style', replaceOklchInCssText(inlineStyle));
        }
      }
    });

    // 3. Ensure target container in cloned doc is positioned correctly if offscreen
    if (targetElementId) {
      const clonedTarget = clonedDoc.getElementById(targetElementId);
      if (clonedTarget) {
        clonedTarget.style.position = 'relative';
        clonedTarget.style.left = '0';
        clonedTarget.style.top = '0';
        if (clonedTarget.parentElement) {
          clonedTarget.parentElement.style.position = 'relative';
          clonedTarget.parentElement.style.left = '0';
          clonedTarget.parentElement.style.top = '0';
        }
      }
    }
  } catch (err) {
    console.warn('Error sanitizing cloned doc for html2canvas:', err);
  }
}

export async function renderElementToCanvas(
  element: HTMLElement,
  options?: { backgroundColor?: string | null }
): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: 2, // 2x resolution for crisp high-DPI retina rendering
    useCORS: true,
    allowTaint: true,
    backgroundColor: options?.backgroundColor !== undefined ? options.backgroundColor : '#FFFFFF',
    logging: false,
    onclone: (clonedDoc) => {
      sanitizeClonedDocForCanvas(clonedDoc, element.id);
    },
  });
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

    // Check Web Share API with File support
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${filename}.${format}`, { type: mimeType });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: options.title || 'DailyHishab Financial Statement',
            text: 'Financial Summary from DailyHishab',
            files: [file],
          });
          return true;
        }
      } catch (shareErr) {
        console.warn('Web Share failed or cancelled, falling back to download:', shareErr);
      }
    }

    // Fallback standard download trigger
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
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

    // Try Web Share API (native share drawer to WhatsApp, Telegram, etc.)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: title,
          text: textSummary,
          files: [file],
        });
        return { success: true, method: 'web-share' };
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { success: false, method: 'web-share', error: 'Share cancelled' };
        }
        console.warn('Web Share failed, falling back to direct download & chat link:', shareErr);
      }
    }

    // Fallback: Trigger direct image download
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // If targeted for WhatsApp specifically or fallback mode
    if (targetApp === 'whatsapp') {
      const waText = encodeURIComponent(`${textSummary}\n\n*(JPG Statement image downloaded - attach it to your message)*`);
      window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
      return { success: true, method: 'whatsapp' };
    }

    return { success: true, method: 'download' };
  } catch (err: any) {
    console.error('Failed to generate JPG image:', err);
    return { success: false, method: 'error', error: err.message || 'Image generation failed' };
  }
}

