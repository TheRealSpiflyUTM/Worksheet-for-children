INSERT INTO public.minigame1 (name, image_filename, image_content_type, created_at)
SELECT 'Cat', '754f189b-b7eb-410c-923d-9d3690251b9a.png', 'image/png', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM public.minigame1
    WHERE image_filename = '754f189b-b7eb-410c-923d-9d3690251b9a.png'
);

INSERT INTO public.minigame1 (name, image_filename, image_content_type, created_at)
SELECT 'Vegetables', 'a17f14db-469c-4bde-9d30-f210d40d4576.png', 'image/png', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM public.minigame1
    WHERE image_filename = 'a17f14db-469c-4bde-9d30-f210d40d4576.png'
);
