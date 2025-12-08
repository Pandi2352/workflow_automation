import { Request } from 'express';

export interface BrowserInfo {
    name: string;
    version: string;
}

export interface EngineInfo {
    name: string;
    version: string;
}

export interface SystemInfo {
    os: string;
    osVersion?: string;
    cpuArchitecture: string;
}

export interface ClientInfo {
    browser: BrowserInfo;
    engine: EngineInfo;
    system: SystemInfo;
    userAgent: string;
    ip?: string;
    timestamp: Date;
}

export function parseUserAgent(userAgent: string): Omit<ClientInfo, 'ip' | 'timestamp'> {
    const result: Omit<ClientInfo, 'ip' | 'timestamp'> = {
        browser: { name: 'Unknown', version: '' },
        engine: { name: 'Unknown', version: '' },
        system: { os: 'Unknown', cpuArchitecture: 'Unknown' },
        userAgent,
    };

    if (!userAgent) {
        return result;
    }

    // Parse Browser
    result.browser = parseBrowser(userAgent);

    // Parse Engine
    result.engine = parseEngine(userAgent);

    // Parse System
    result.system = parseSystem(userAgent);

    return result;
}

function parseBrowser(ua: string): BrowserInfo {
    // Edge (Chromium-based)
    const edgMatch = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
    if (edgMatch) {
        return { name: 'Edge', version: edgMatch[1] };
    }

    // Edge (Legacy)
    const edgeMatch = ua.match(/Edge\/(\d+\.\d+)/);
    if (edgeMatch) {
        return { name: 'Edge Legacy', version: edgeMatch[1] };
    }

    // Opera
    const operaMatch = ua.match(/OPR\/(\d+\.\d+\.\d+\.\d+)/);
    if (operaMatch) {
        return { name: 'Opera', version: operaMatch[1] };
    }

    // Chrome
    const chromeMatch = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    if (chromeMatch && !ua.includes('Edg') && !ua.includes('OPR')) {
        return { name: 'Chrome', version: chromeMatch[1] };
    }

    // Firefox
    const firefoxMatch = ua.match(/Firefox\/(\d+\.\d+)/);
    if (firefoxMatch) {
        return { name: 'Firefox', version: firefoxMatch[1] };
    }

    // Safari
    const safariMatch = ua.match(/Version\/(\d+\.\d+).*Safari/);
    if (safariMatch) {
        return { name: 'Safari', version: safariMatch[1] };
    }

    // IE
    const ieMatch = ua.match(/MSIE (\d+\.\d+)/) || ua.match(/rv:(\d+\.\d+)/);
    if (ieMatch && ua.includes('Trident')) {
        return { name: 'Internet Explorer', version: ieMatch[1] };
    }

    return { name: 'Unknown', version: '' };
}

function parseEngine(ua: string): EngineInfo {
    // Blink (Chrome, Edge, Opera)
    const blinkMatch = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    if (blinkMatch && (ua.includes('Chrome') || ua.includes('Edg') || ua.includes('OPR'))) {
        return { name: 'Blink', version: blinkMatch[1] };
    }

    // Gecko (Firefox)
    const geckoMatch = ua.match(/Gecko\/(\d+)/) || ua.match(/rv:(\d+\.\d+)/);
    if (geckoMatch && ua.includes('Firefox')) {
        return { name: 'Gecko', version: geckoMatch[1] };
    }

    // WebKit (Safari)
    const webkitMatch = ua.match(/AppleWebKit\/(\d+\.\d+)/);
    if (webkitMatch && ua.includes('Safari') && !ua.includes('Chrome')) {
        return { name: 'WebKit', version: webkitMatch[1] };
    }

    // Trident (IE)
    const tridentMatch = ua.match(/Trident\/(\d+\.\d+)/);
    if (tridentMatch) {
        return { name: 'Trident', version: tridentMatch[1] };
    }

    // EdgeHTML (Legacy Edge)
    const edgeHtmlMatch = ua.match(/Edge\/(\d+\.\d+)/);
    if (edgeHtmlMatch) {
        return { name: 'EdgeHTML', version: edgeHtmlMatch[1] };
    }

    return { name: 'Unknown', version: '' };
}

function parseSystem(ua: string): SystemInfo {
    const system: SystemInfo = {
        os: 'Unknown',
        cpuArchitecture: 'Unknown',
    };

    // Operating System
    if (ua.includes('Windows NT 10.0')) {
        system.os = 'Windows 10/11';
        system.osVersion = '10.0';
    } else if (ua.includes('Windows NT 6.3')) {
        system.os = 'Windows 8.1';
        system.osVersion = '6.3';
    } else if (ua.includes('Windows NT 6.2')) {
        system.os = 'Windows 8';
        system.osVersion = '6.2';
    } else if (ua.includes('Windows NT 6.1')) {
        system.os = 'Windows 7';
        system.osVersion = '6.1';
    } else if (ua.includes('Windows')) {
        system.os = 'Windows';
    } else if (ua.includes('Mac OS X')) {
        const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
        system.os = 'macOS';
        if (macMatch) {
            system.osVersion = macMatch[1].replace(/_/g, '.');
        }
    } else if (ua.includes('Android')) {
        const androidMatch = ua.match(/Android (\d+\.\d+)/);
        system.os = 'Android';
        if (androidMatch) {
            system.osVersion = androidMatch[1];
        }
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
        const iosMatch = ua.match(/OS (\d+_\d+)/);
        system.os = ua.includes('iPad') ? 'iPadOS' : 'iOS';
        if (iosMatch) {
            system.osVersion = iosMatch[1].replace(/_/g, '.');
        }
    } else if (ua.includes('Linux')) {
        system.os = 'Linux';
    } else if (ua.includes('CrOS')) {
        system.os = 'Chrome OS';
    }

    // CPU Architecture
    if (ua.includes('Win64') || ua.includes('x64') || ua.includes('x86_64') || ua.includes('amd64')) {
        system.cpuArchitecture = 'amd64';
    } else if (ua.includes('arm64') || ua.includes('aarch64')) {
        system.cpuArchitecture = 'arm64';
    } else if (ua.includes('arm')) {
        system.cpuArchitecture = 'arm';
    } else if (ua.includes('WOW64') || ua.includes('i686') || ua.includes('i386')) {
        system.cpuArchitecture = 'x86';
    }

    return system;
}

export function extractClientInfo(req: Request): ClientInfo {
    const userAgent = req.headers['user-agent'] || '';
    const parsed = parseUserAgent(userAgent);

    // Get IP address
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.headers['x-real-ip'] as string
        || req.socket?.remoteAddress
        || req.ip;

    return {
        ...parsed,
        ip,
        timestamp: new Date(),
    };
}

export function extractClientInfoFromHeaders(headers: Record<string, string | string[] | undefined>): ClientInfo {
    const userAgent = (Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent']) || '';
    const parsed = parseUserAgent(userAgent);

    const forwarded = headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim()
        || (Array.isArray(headers['x-real-ip']) ? headers['x-real-ip'][0] : headers['x-real-ip']);

    return {
        ...parsed,
        ip,
        timestamp: new Date(),
    };
}
