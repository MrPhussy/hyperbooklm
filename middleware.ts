import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const apiKey = request.headers.get('x-api-key');
        const internalApiKey = process.env.INTERNAL_API_KEY;

        // If INTERNAL_API_KEY is not set, we allow the request (for initial setup/dev)
        if (internalApiKey && apiKey !== internalApiKey) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid API Key' },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/api/:path*',
};
