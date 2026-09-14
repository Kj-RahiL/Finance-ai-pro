"""accounts.is_archived, transactions.updated_at, index on transactions.date

Revision ID: 0002_archive_updated_at
Revises: 0001_initial
Create Date: 2026-09-14
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_archive_updated_at"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # batch mode is a no-op on Postgres and lets SQLite add a NOT NULL column
    # with a non-constant default (it rebuilds the table).
    with op.batch_alter_table("accounts") as batch:
        batch.add_column(
            sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false())
        )

    with op.batch_alter_table("transactions") as batch:
        batch.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            )
        )
        batch.create_index("ix_transactions_date", ["date"])


def downgrade() -> None:
    with op.batch_alter_table("transactions") as batch:
        batch.drop_index("ix_transactions_date")
        batch.drop_column("updated_at")

    with op.batch_alter_table("accounts") as batch:
        batch.drop_column("is_archived")
