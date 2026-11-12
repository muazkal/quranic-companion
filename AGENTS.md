# Architecture rules

- Manage route-specific titles, descriptions, and self-referencing canonicals in PageMetadata with react-helmet-async inside the router, outside authenticated views; keep only sitewide fallback metadata in index.html so signed-out visits receive route metadata without duplicate canonicals.