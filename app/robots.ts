import { MetadataRoute } from 'next';

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://typecade.pages.dev';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/profile',
                '/api/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
