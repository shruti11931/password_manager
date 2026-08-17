"""
backend/auth.py

Handles master password creation and verification using Argon2.
The master password itself is NEVER stored — only its hash.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from database import get_connection

ph = PasswordHasher()


def is_setup_complete() -> bool:
    """Checks whether a master password has already been created."""
    conn = get_connection()
    row = conn.execute("SELECT id FROM security LIMIT 1").fetchone()
    conn.close()
    return row is not None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Basic strength check before hashing. Returns (is_valid, message)."""
    if len(password) < 8:
        return False, "Master password must be at least 8 characters."
    if not any(c.isupper() for c in password):
        return False, "Include at least one uppercase letter."
    if not any(c.isdigit() for c in password):
        return False, "Include at least one number."
    return True, "OK"


def create_master_password(password: str) -> tuple[bool, str]:
    """Creates and stores the Argon2 hash of the master password. Fails if already set up."""
    if is_setup_complete():
        return False, "Master password already set."

    valid, msg = validate_password_strength(password)
    if not valid:
        return False, msg

    hashed = ph.hash(password)
    conn = get_connection()
    conn.execute("INSERT INTO security (master_password_hash) VALUES (?)", (hashed,))
    conn.commit()
    conn.close()
    return True, "Master password created."


def verify_master_password(password: str) -> bool:
    """Verifies a submitted password against the stored hash. Never logs the password."""
    conn = get_connection()
    row = conn.execute("SELECT master_password_hash FROM security LIMIT 1").fetchone()
    conn.close()

    if row is None:
        return False

    try:
        ph.verify(row["master_password_hash"], password)
        return True
    except VerifyMismatchError:
        return False