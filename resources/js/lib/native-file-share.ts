import { Capacitor } from '@capacitor/core';

type ShareRemoteFileOptions = {
    url: string;
    fallbackFileName: string;
    title?: string;
};

function toAbsoluteUrl(url: string): string {
    return new URL(url, window.location.origin).toString();
}

function ensurePdfExtension(fileName: string): string {
    return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
}

function sanitizeFileName(fileName: string): string {
    return ensurePdfExtension(
        fileName
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\s+/g, ' ')
            .trim(),
    );
}

function parseFileNameFromDisposition(
    contentDisposition: string | null,
): string | null {
    if (!contentDisposition) {
        return null;
    }

    const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return sanitizeFileName(decodeURIComponent(utf8Match[1]));
    }

    const asciiMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
    if (asciiMatch?.[1]) {
        return sanitizeFileName(asciiMatch[1]);
    }

    const bareMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
    if (bareMatch?.[1]) {
        return sanitizeFileName(bareMatch[1].trim());
    }

    return null;
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            reject(new Error('No se pudo preparar el archivo para compartir.'));
        };

        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('No se pudo preparar el archivo para compartir.'));
                return;
            }

            const base64SeparatorIndex = reader.result.indexOf(',');
            resolve(
                base64SeparatorIndex >= 0
                    ? reader.result.slice(base64SeparatorIndex + 1)
                    : reader.result,
            );
        };

        reader.readAsDataURL(blob);
    });
}

export function isNativePdfShareAvailable(): boolean {
    return Capacitor.isNativePlatform();
}

export async function shareRemoteFile({
    url,
    fallbackFileName,
    title = 'Compartir PDF',
}: ShareRemoteFileOptions): Promise<void> {
    if (!isNativePdfShareAvailable()) {
        window.open(toAbsoluteUrl(url), '_blank', 'noopener,noreferrer');
        return;
    }

    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import('@capacitor/filesystem'),
        import('@capacitor/share'),
    ]);

    const response = await fetch(toAbsoluteUrl(url), {
        credentials: 'include',
        headers: {
            Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
        },
    });

    if (!response.ok) {
        throw new Error('No se pudo descargar el PDF.');
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
        throw new Error(
            'La sesión ha caducado o el servidor no devolvió un PDF válido.',
        );
    }

    const blob = await response.blob();
    const fileName =
        parseFileNameFromDisposition(response.headers.get('content-disposition')) ??
        sanitizeFileName(fallbackFileName);

    const cachePath = `downloads/${Date.now()}-${fileName}`;
    const fileData = await blobToBase64(blob);
    const writeResult = await Filesystem.writeFile({
        path: cachePath,
        data: fileData,
        directory: Directory.Cache,
        recursive: true,
    });

    const canShare = await Share.canShare();
    if (!canShare.value) {
        throw new Error('Este dispositivo no permite compartir archivos ahora mismo.');
    }

    await Share.share({
        title,
        files: [writeResult.uri],
        dialogTitle: title,
    });
}
