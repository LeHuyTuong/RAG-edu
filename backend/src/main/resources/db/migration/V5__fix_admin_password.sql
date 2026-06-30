-- V5__fix_admin_password.sql — Fix admin seed password to match "Admin@123"
-- The original V1 migration used a Laravel test hash that corresponds to an unknown password.
-- This replaces it with the correct BCrypt hash for "Admin@123".

UPDATE user
SET password_hash = '$2b$10$7ByZTjd.z.4GCas6EzIs3uYxY8iA/Q6ByIvwGLKG7HzXdXGMm4qui'
WHERE email = 'admin@historyrag.edu.vn'
  AND password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
