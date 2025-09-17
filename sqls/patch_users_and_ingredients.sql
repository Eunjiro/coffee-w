ALTER TABLE users
  ADD COLUMN username VARCHAR(64) NULL AFTER email,
  ADD COLUMN status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE' AFTER role,
  ADD COLUMN phone VARCHAR(32) NULL AFTER status,
  ADD COLUMN hireDate DATE NULL AFTER phone;

UPDATE users
SET username = CASE
  WHEN username IS NOT NULL AND username <> '' THEN username
  WHEN INSTR(email, '@') > 0 THEN SUBSTRING_INDEX(email, '@', 1)
  WHEN name IS NOT NULL AND name <> '' THEN LOWER(REPLACE(name, ' ', ''))
  ELSE CONCAT('user', id)
END;

UPDATE users u
JOIN (
  SELECT username, COUNT(*) c FROM users GROUP BY username HAVING c > 1
) d ON u.username = d.username
SET u.username = CONCAT(u.username, '_', u.id);

ALTER TABLE users
  MODIFY COLUMN username VARCHAR(64) NOT NULL,
  ADD UNIQUE INDEX uq_users_username (username);

ALTER TABLE ingredients
  ADD COLUMN category VARCHAR(191) NOT NULL DEFAULT 'GENERAL';
