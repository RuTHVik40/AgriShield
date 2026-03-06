"""
Initial AgriShield database migration
Creates all tables and PostGIS extension
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")  # For text search

    # Users table
    op.create_table('users',
        sa.Column('id',          postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name',        sa.String(100),  nullable=True),
        sa.Column('email',       sa.String(200),  nullable=True),
        sa.Column('phone',       sa.String(20),   nullable=True),
        sa.Column('google_id',   sa.String(100),  nullable=True),
        sa.Column('avatar_url',  sa.Text(),        nullable=True),
        sa.Column('farm_name',   sa.String(200),  nullable=True),
        sa.Column('latitude',    sa.Float(),       nullable=True),
        sa.Column('longitude',   sa.Float(),       nullable=True),
        sa.Column('location',    geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('is_active',   sa.Boolean(),    server_default='true'),
        sa.Column('created_at',  sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at',  sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('phone'),
        sa.UniqueConstraint('google_id'),
    )

    # Spatial index on users.location for ST_DWithin queries
    op.execute("CREATE INDEX idx_users_location ON users USING GIST (location)")

    # Push subscriptions
    op.create_table('push_subscriptions',
        sa.Column('id',         postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id',    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('endpoint',   sa.Text(),  nullable=False),
        sa.Column('p256dh_key', sa.Text(),  nullable=False),
        sa.Column('auth_key',   sa.Text(),  nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endpoint'),
    )

    # Pest detections
    op.create_table('pest_detections',
        sa.Column('id',              postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id',         postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('pest_name',       sa.String(200), nullable=False),
        sa.Column('confidence',      sa.Float(),     nullable=False),
        sa.Column('severity',        sa.String(20),  nullable=False),
        sa.Column('latitude',        sa.Float(),     nullable=False),
        sa.Column('longitude',       sa.Float(),     nullable=False),
        sa.Column('location',        geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('alert_sent',      sa.Boolean(),   server_default='false'),
        sa.Column('alert_count',     sa.Integer(),   server_default='0'),
        sa.Column('raw_predictions', postgresql.JSON, nullable=True),
        sa.Column('created_at',      sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute("CREATE INDEX idx_detections_location ON pest_detections USING GIST (location)")
    op.execute("CREATE INDEX idx_detections_created ON pest_detections (created_at DESC)")

    # Community posts
    op.create_table('community_posts',
        sa.Column('id',            postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id',       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('detection_id',  postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('content',       sa.Text(),       nullable=False),
        sa.Column('image_url',     sa.Text(),       nullable=True),
        sa.Column('latitude',      sa.Float(),      nullable=True),
        sa.Column('longitude',     sa.Float(),      nullable=True),
        sa.Column('location',      geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('location_name', sa.String(200),  nullable=True),
        sa.Column('likes_count',   sa.Integer(),    server_default='0'),
        sa.Column('is_alert',      sa.Boolean(),    server_default='false'),
        sa.Column('created_at',    sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'],      ['users.id'],           ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['detection_id'], ['pest_detections.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Post likes
    op.create_table('post_likes',
        sa.Column('id',      postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('post_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['community_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],           ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),
    )

    # OTP records
    op.create_table('otp_records',
        sa.Column('id',         postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('phone',      sa.String(20),  nullable=False, index=True),
        sa.Column('otp_hash',   sa.String(200), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used',       sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('otp_records')
    op.drop_table('post_likes')
    op.drop_table('community_posts')
    op.drop_table('pest_detections')
    op.drop_table('push_subscriptions')
    op.drop_table('users')
