import { MetadataRoute } from 'next';
import { LEARN_MODULES } from '@/features/learn/data/lessons';

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://typecade.com';

    const staticRoutes: MetadataRoute.Sitemap = [
        '',
        '/learn',
        '/race',
        '/board',
        '/arena',
        '/auth',
        '/about',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    const moduleRoutes: MetadataRoute.Sitemap = LEARN_MODULES.map((module) => ({
        url: `${baseUrl}/learn/${module.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const dynamicRoutes: MetadataRoute.Sitemap = LEARN_MODULES.flatMap((module) =>
        module.lessons.map((lesson) => ({
            url: `${baseUrl}/learn/${module.slug}/${lesson.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }))
    );

    return [...staticRoutes, ...moduleRoutes, ...dynamicRoutes];
}
