-- =========================================================================
-- استعادة مستندات users/{uid} من البروفايلات الموجودة
-- =========================================================================
-- المشكلة: مجموعة "users" فارغة (0 مستند)، لذلك يعامل التطبيق كل دخول
-- كمستخدم جديد ويصفّر الحساب. هذه الجملة تعيد بناء مستندات users/
-- من ملفات البروفايلات السليمة (الـ20) حفاظاً على الـ XP والمستوى.
--
-- التشغيل:
--   1. لوحة Supabase Dashboard → SQL Editor → New Query
--   2. الصق هذا الكود وشغّله.
-- =========================================================================

INSERT INTO public.documents (path, collection, id, data, created_at, updated_at)
SELECT
  'users/' || p.id,
  'users',
  p.id,
  jsonb_build_object(
    'uid',                p.id,
    'displayName',        COALESCE(p.data->>'displayName', 'رائد فضاء'),
    'email',              COALESCE(p.data->>'email', ''),
    'photoURL',           COALESCE(p.data->>'photoURL', ''),
    'bio',                COALESCE(p.data->>'bio', ''),
    'level',              COALESCE((p.data->>'level')::int, 1),
    'xp',                 COALESCE((p.data->>'xp')::int, 0),
    'role',               COALESCE(p.data->>'role', 'user'),
    'friendsCount',       COALESCE((p.data->>'friendsCount')::int, 0),
    'banned',             COALESCE((p.data->>'banned')::boolean, false),
    'currentActivity',    COALESCE(p.data->>'currentActivity', 'في لوحة التحكم'),
    'streak',             COALESCE((p.data->>'streak')::int, 1),
    'lastActiveDate',     COALESCE(p.data->>'lastActiveDate', CURRENT_DATE::text),
    'lastActiveTime',     COALESCE((p.data->>'lastActiveTime')::bigint, 0),
    'missionRole',        p.data->>'missionRole',
    'completedWizard',    COALESCE((p.data->>'completedWizard')::boolean, false),
    'totalFocusSessions', COALESCE((p.data->>'totalFocusSessions')::int, 0)
  ),
  COALESCE(p.created_at, now()),
  COALESCE(p.updated_at, now())
FROM public.documents p
WHERE p.collection = 'profiles'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.documents u
    WHERE u.collection = 'users' AND u.id = p.id
  );

-- التحقق: كم مستند users/ أصبح موجوداً؟
SELECT collection, COUNT(*) FROM public.documents
WHERE collection IN ('users', 'profiles')
GROUP BY collection ORDER BY collection;
