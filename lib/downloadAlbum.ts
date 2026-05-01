// lib/downloadAlbum.ts — Utility for downloading showcase album as PNG image

/**
 * Downloads a DOM element as PNG image using html2canvas.
 * Workaround: html2canvas v1 doesn't support CSS lab()/oklch() color functions
 * used by Tailwind CSS v4. We override computed styles in the cloned DOM to
 * convert unsupported color values to fallback hex colors before rendering.
 */
export async function downloadElementAsImage(
  element: HTMLElement | null,
  fileName: string
): Promise<void> {
  if (!element) {
    console.error('Element not found for download');
    return;
  }

  try {
    // Dynamically import html2canvas to avoid issues if not installed
    const html2canvas = (await import('html2canvas')).default;

    // Regex to detect unsupported color functions
    const unsupportedColorRegex = /\b(lab|oklch|oklab|lch|color)\s*\(/i;

    // Create canvas from element with error handling for CSS color functions
    const canvas = await html2canvas(element, {
      backgroundColor: '#fff5e1',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (el: Element) => {
        // Skip script, style tags
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return true;
        // Skip hidden elements
        if (window.getComputedStyle(el).display === 'none') return true;
        return false;
      },
      onclone: (clonedDocument: Document) => {
        // Walk through all elements in the cloned DOM and replace any
        // unsupported color function values with safe fallbacks
        const allElements = clonedDocument.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const computedStyle = window.getComputedStyle(el);
          
          // Properties that commonly contain color values
          const colorProps = [
            'color', 'backgroundColor', 'borderColor',
            'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
            'outlineColor', 'textDecorationColor', 'boxShadow', 'caretColor',
          ];

          for (const prop of colorProps) {
            const value = computedStyle.getPropertyValue(
              prop.replace(/([A-Z])/g, '-$1').toLowerCase()
            );
            if (value && unsupportedColorRegex.test(value)) {
              // Replace with a safe fallback
              if (prop === 'backgroundColor') {
                htmlEl.style.backgroundColor = 'transparent';
              } else if (prop === 'color') {
                htmlEl.style.color = '#1a1a1a';
              } else if (prop.includes('border') || prop.includes('Border')) {
                htmlEl.style.setProperty(
                  prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
                  '#4a1f2e'
                );
              } else if (prop === 'boxShadow') {
                htmlEl.style.boxShadow = 'none';
              } else {
                htmlEl.style.setProperty(
                  prop.replace(/([A-Z])/g, '-$1').toLowerCase(),
                  'transparent'
                );
              }
            }
          }

          // Also clean up CSS custom properties that use unsupported functions
          // by overriding the inline style
          const inlineStyle = htmlEl.getAttribute('style') || '';
          if (unsupportedColorRegex.test(inlineStyle)) {
            htmlEl.setAttribute(
              'style',
              inlineStyle.replace(
                /(?:lab|oklch|oklab|lch|color)\s*\([^)]*\)/gi,
                'transparent'
              )
            );
          }
        });

        // Add a blanket style override for any remaining issues
        const overrideStyle = clonedDocument.createElement('style');
        overrideStyle.textContent = `
          * {
            --tw-ring-color: transparent !important;
            --tw-ring-offset-color: transparent !important;
          }
        `;
        clonedDocument.head.appendChild(overrideStyle);
      },
    });

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Album downloaded:', fileName);
    }, 'image/png');
  } catch (error) {
    console.error('Error downloading album:', error);
    alert('Gagal mengunduh album. Silakan coba beberapa saat lagi.');
  }
}

/**
 * Generates a filename with timestamp
 */
export function generateAlbumFileName(ownerName: string): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `Katapixel_Album_${ownerName}_${timestamp}.png`;
}
