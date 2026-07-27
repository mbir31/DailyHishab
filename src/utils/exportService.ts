import html2canvas from 'html2canvas';

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
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for crisp high-DPI retina rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: format === 'jpg' ? '#FFFFFF' : null,
      logging: false,
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
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
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

