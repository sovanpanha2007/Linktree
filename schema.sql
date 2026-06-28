-- ============================================================
-- Linktree Self-Hosted — D1 Database Schema
-- Run: wrangler d1 execute linktree-db --file=schema.sql
-- ============================================================

DROP TABLE IF EXISTS links;
CREATE TABLE links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  subtitle    TEXT    NOT NULL DEFAULT '',
  url         TEXT    NOT NULL,
  icon        TEXT    NOT NULL DEFAULT '🔗',
  order_num   INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR REPLACE INTO profile (key, value) VALUES ('name', 'Alex Rivera');
INSERT OR REPLACE INTO profile (key, value) VALUES ('bio', 'តំណភ្ជាប់ និងការទំនាក់ទំនងរបស់ខ្ញុំ');
INSERT OR REPLACE INTO profile (key, value) VALUES ('avatar', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs8PDIDDur4B0cwNc7lsNqWUt9e6Brql9lLb424izeZE0PZaO-WtqZwd40dp0k1SkcrxgsDVLWHXbN4tMMnS5AoWNckHUmrWmJwNh4KlcH7LV3LUYIVFxM-ne4zHsUm2MAW4hgtS7Gw5cOexbpzolUCyfqJvdPidcuz8uoNSc3FtCfvnlwwPeoMuEpatTBWfy55wo7XQHXJj-Z-fUek9GZdGrX-WOntFjB9ciQoiR7Qt_2JCLcL3NYCbMuTfQGsqd2Wz6uqVv2Uas');

INSERT INTO links (id, title, subtitle, url, icon, order_num) VALUES
  (1, 'TikTok', 'ទិកតុក', 'https://tiktok.com/@yourusername', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 410 113.11a121.28 121.28 0 0 0 38 6z"/></svg>', 1),
  (2, 'Instagram', 'អ៊ីនស្តាក្រាម', 'https://instagram.com/yourusername', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7 0-41.1 33.5-74.7 74.7-74.7 41.1 0 74.7 33.5 74.7 74.7 0 41.1-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.8 9.9 67.6 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>', 2),
  (3, 'Telegram', 'តេឡេក្រាម', 'https://t.me/yourusername', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c19.1-6.9 35.8 4.5 28.5 32.2z"/></svg>', 3),
  (4, 'Facebook', 'ហ្វេសប៊ុក', 'https://facebook.com/yourusername', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor"><path d="M80 299.3V256H12v-74.7h68V134.7c0-67.3 41-104 101.2-104 28.8 0 53.7 2.1 60.9 3v70.6h-41.8c-32.7 0-39 15.6-39 38.3V181.3h78.3L229 256h-70.6v199.7H80z"/></svg>', 4),
  (5, 'Email', 'អ៊ីមែល', 'mailto:you@email.com', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 180V400c0 26.5 21.5 48 48 48H464c26.5 0 48-21.5 48-48V180L281.6 339.2c-15.2 11.4-36 11.4-51.2 0L0 180z"/></svg>', 5);

