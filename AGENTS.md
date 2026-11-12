# Architecture rules

- Manage route-specific titles, descriptions, and self-referencing canonicals in PageMetadata with react-helmet-async inside the router, outside authenticated views; keep only sitewide fallback metadata in index.html so signed-out visits receive route metadata without duplicate canonicals.
- Keep the static sitemap limited to public entry/content pages, excluding authenticated study views and password recovery flows, so search discovery does not advertise private workflows.