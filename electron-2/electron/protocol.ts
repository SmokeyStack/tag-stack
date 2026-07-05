import { net, protocol } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { MEDIA_SCHEME } from '../shared/ipc';
import { PathManager } from './security/paths';

protocol.registerSchemesAsPrivileged([
    {
        scheme: MEDIA_SCHEME,
        privileges: {
            standard: true, // Standard scheme, like http or https
            secure: true,
            stream: true, // Eventually will allow for <video> and <audio> tags to use this scheme
            supportFetchAPI: true
        }
    }
]);

export function registerMediaProtocol(): void {
    protocol.handle(MEDIA_SCHEME, (request) => {
        const url = new URL(request.url);
        const filePath = decodeURIComponent(url.pathname).replace(/^\//, '');
        if (!PathManager.isGrantedPath(filePath))
            return new Response(
                `File has not been granted access: ${filePath}`,
                { status: 403 }
            );

        const resolved = path.resolve(filePath);
        return net.fetch(pathToFileURL(resolved).toString());
    });
}
