import os
import pytest
from fastapi import HTTPException

# Safe test-only settings. No real database / Supabase credentials are used
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.auth import require_supervisor

def test_supervisor_is_allowed():
    supervisor = {
        "user_id": "supervisor-test-id",
        "email": "supervisor@example.com",
        "role": "SUPERVISOR",
    }

    result = require_supervisor(supervisor)
    assert result == supervisor


def test_standard_user_is_rejected():
    standard_user = {
        "user_id": "user-test-id",
        "email": "user@example.com",
        "role": "USER",
    }

    with pytest.raises(HTTPException) as error:
        require_supervisor(standard_user)

    assert error.value.status_code == 403
    assert error.value.detail == "Only SUPERVISOR users may perform this action"