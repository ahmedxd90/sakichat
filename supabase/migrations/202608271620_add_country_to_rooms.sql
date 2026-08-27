-- إضافة دولة الغرفة لأن الواجهة تعرضها وترسلها عند الإنشاء.
-- العمود nullable مع قيمة افتراضية للحفاظ على الغرف القديمة دون كسرها.
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS country text;

ALTER TABLE public.rooms
  ALTER COLUMN country SET DEFAULT 'SA';

UPDATE public.rooms
SET country = 'SA'
WHERE country IS NULL OR btrim(country) = '';

COMMENT ON COLUMN public.rooms.country IS 'ISO-style country code used for room discovery and display';
