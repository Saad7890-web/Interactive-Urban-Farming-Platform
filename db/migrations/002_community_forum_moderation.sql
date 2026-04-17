BEGIN;

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible'
CHECK (moderation_status IN ('visible', 'hidden', 'removed'));

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_community_posts_moderation_status
ON community_posts(moderation_status);

CREATE INDEX IF NOT EXISTS idx_community_posts_deleted_at
ON community_posts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_created
ON community_posts(user_id, post_date DESC);

COMMIT;