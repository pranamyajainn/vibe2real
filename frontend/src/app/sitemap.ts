import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        { url: 'https://vibe2real.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
        { url: 'https://vibe2real.com/play', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: 'https://vibe2real.com/play/1/1-1', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/1/1-2', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/1/1-3', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/1/1-4', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/1/1-5', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/2/2-1', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/2/2-2', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/2/2-3', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/2/2-4', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/2/2-5', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/3/3-1', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/3/3-2', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/3/3-3', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/3/3-4', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: 'https://vibe2real.com/play/3/3-5', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ]
}
