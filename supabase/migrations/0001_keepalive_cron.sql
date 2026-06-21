-- ============================================================================
-- Typecade — Supabase Keep-Alive Migration
-- ----------------------------------------------------------------------------
-- Tujuan: Mencegah Supabase free-tier auto-pause (yang terjadi setelah 7 hari
-- tanpa aktivitas database) dengan menjadwalkan query rutin via pg_cron.
--
-- CARA PAKAI:
--   1. Buka Supabase Dashboard > SQL Editor
--   2. Paste seluruh isi file ini dan klik RUN
--   3. Cek apakah pg_cron aktif: SELECT * FROM cron.job;
--      Anda harus melihat job 'typecade-keepalive'.
--
-- CATATAN PENTING TENTANG AUTO-PAUSE:
--   Supabase free tier mem-pause project setelah ~7 hari tanpa *REST API /
--   Auth API* activity. pg_cron berjalan DI DALAM Postgres, sehingga tidak
--   selalu terhitung sebagai "aktivitas eksternal". Untuk jaminan penuh,
--   tambahkan ping HTTP eksternal (UptimeRobot / cron-job.org) yang meng-hit
--   endpoint anon (lihat catatan di bawah / README).
-- ============================================================================

-- 1. Aktifkan ekstensi pg_cron (gratis, sudah pre-installed di Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Buat tabel log sederhana untuk mencatat keep-alive berjalan.
--    Ini juga berfungsi sebagai "tulisan" yang menandai database aktif.
CREATE TABLE IF NOT EXISTS public.keepalive_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT
);

-- Izinkan siapa pun (anon) membaca log keep-alive (read-only). Tulisan hanya
-- via cron job (berjalan sebagai superuser). RLS diaktifkan untuk keamanan.
ALTER TABLE public.keepalive_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "keepalive_read_all" ON public.keepalive_log;
CREATE POLICY "keepalive_read_all" ON public.keepalive_log
    FOR SELECT TO anon, authenticated USING (true);

-- 3. Bersihkan log lama (>30 hari) supaya tabel tidak bengkak.
--    Dijalankan harian oleh cron terpisah.
CREATE OR REPLACE FUNCTION public.cleanup_keepalive_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.keepalive_log WHERE ran_at < now() - INTERVAL '30 days';
END;
$$;

-- 4. RPC keep-alive utama. Insert satu baris + baca pg_stat untuk menjaga
--    database tetap "panas". Dipanggil tiap jam oleh cron job di bawah.
CREATE OR REPLACE FUNCTION public.ping()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.keepalive_log (note) VALUES ('pg_cron keepalive');
END;
$$;

-- 5. Jadwalkan job cron.
--    - 'typecade-keepalive': tiap jam (interval aman, murah untuk free tier)
--    - 'typecade-cleanup' : tiap hari pukul 03:00 UTC
--    Hapus dulu jika sudah ada (idempoten).
DO $$
BEGIN
    -- Unschedule job lama (abaikan error jika belum ada)
    PERFORM cron.unschedule('typecade-keepalive');
    PERFORM cron.unschedule('typecade-cleanup');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
    'typecade-keepalive',
    '0 * * * *',                 -- tiap jam, menit ke-0
    $$ SELECT public.ping(); $$
);

SELECT cron.schedule(
    'typecade-cleanup',
    '0 3 * * *',                 -- tiap hari jam 03:00 UTC
    $$ SELECT public.cleanup_keepalive_log(); $$
);

-- ============================================================================
-- OPSIONAL: Index rekomendasi (jalankan SETELAH verifikasi dengan EXPLAIN).
-- Karena schema SQL tidak ada di repo ini, jalankan manual jika belum ada.
-- ----------------------------------------------------------------------------
-- CREATE INDEX IF NOT EXISTS idx_typing_tests_user_created
--     ON public.typing_tests (user_id, created_at DESC);
--
-- CREATE INDEX IF NOT EXISTS idx_mrp_room
--     ON public.multiplayer_room_players (room_id);
--
-- CREATE INDEX IF NOT EXISTS idx_profiles_username
--     ON public.profiles (username);
--
-- CREATE INDEX IF NOT EXISTS idx_profiles_user_id
--     ON public.profiles (user_id);
--
-- CREATE INDEX IF NOT EXISTS idx_rooms_status_private_created
--     ON public.multiplayer_rooms (status, is_private, created_at DESC);
-- ============================================================================
