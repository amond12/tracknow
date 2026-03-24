import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CapacitorConfig } from '@capacitor/cli';

function readEnvFile(fileName: string) {
    try {
        const envContents = readFileSync(join(process.cwd(), fileName), 'utf8');

        return Object.fromEntries(
            envContents
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#'))
                .map((line) => {
                    const separatorIndex = line.indexOf('=');

                    if (separatorIndex === -1) {
                        return [line, ''];
                    }

                    const key = line.slice(0, separatorIndex).trim();
                    const value = line
                        .slice(separatorIndex + 1)
                        .trim()
                        .replace(/^['"]|['"]$/g, '');

                    return [key, value];
                }),
        );
    } catch {
        return {};
    }
}

const env = {
    ...readEnvFile('.env.example'),
    ...readEnvFile('.env'),
};

const serverUrl = process.env.CAPACITOR_SERVER_URL || env.APP_URL || 'http://127.0.0.1:8000';

const config: CapacitorConfig = {
    appId: 'com.tracknow.app',
    appName: 'TrackNow',
    webDir: 'public',
    server: {
        allowNavigation: ['*'],
        cleartext: serverUrl.startsWith('http://'),
        url: serverUrl,
    },
};

export default config;
