"""
backend/models.py

CRUD operations for the credentials table.
Passwords are encrypted before insert and decrypted only on demand.
"""

from database import get_connection
from encryption import encrypt_password, decrypt_password


def add_credential(website: str, username: str, plaintext_password: str) -> dict:
    encrypted = encrypt_password(plaintext_password)
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO credentials (website, username, encrypted_password) VALUES (?, ?, ?)",
        (website, username, encrypted),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "website": website, "username": username}


def get_all_credentials(reveal: bool = False) -> list[dict]:
    """By default returns metadata only, no decrypted passwords."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, website, username, encrypted_password, created_at, updated_at FROM credentials"
    ).fetchall()
    conn.close()

    result = []
    for row in rows:
        item = {
            "id": row["id"],
            "website": row["website"],
            "username": row["username"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        if reveal:
            item["password"] = decrypt_password(row["encrypted_password"])
        result.append(item)
    return result


def get_credential_by_id(cred_id: int, reveal: bool = False) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT id, website, username, encrypted_password, created_at, updated_at FROM credentials WHERE id = ?",
        (cred_id,),
    ).fetchone()
    conn.close()

    if row is None:
        return None

    item = {
        "id": row["id"],
        "website": row["website"],
        "username": row["username"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
    if reveal:
        item["password"] = decrypt_password(row["encrypted_password"])
    return item


def update_credential(cred_id: int, website: str = None, username: str = None, plaintext_password: str = None) -> bool:
    conn = get_connection()
    existing = conn.execute("SELECT * FROM credentials WHERE id = ?", (cred_id,)).fetchone()
    if existing is None:
        conn.close()
        return False

    new_website = website if website is not None else existing["website"]
    new_username = username if username is not None else existing["username"]
    new_encrypted = encrypt_password(plaintext_password) if plaintext_password is not None else existing["encrypted_password"]

    conn.execute(
        """UPDATE credentials
           SET website = ?, username = ?, encrypted_password = ?, updated_at = datetime('now')
           WHERE id = ?""",
        (new_website, new_username, new_encrypted, cred_id),
    )
    conn.commit()
    conn.close()
    return True


def delete_credential(cred_id: int) -> bool:
    conn = get_connection()
    cursor = conn.execute("DELETE FROM credentials WHERE id = ?", (cred_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0


def search_credentials(query: str) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, website, username, created_at, updated_at FROM credentials WHERE website LIKE ?",
        (f"%{query}%",),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]