"""
backend/encryption.py

Encrypts/decrypts website passwords using AES-256-GCM (authenticated encryption).
The encryption key is derived once and stored in a local key file that is
git-ignored — it never lives in source code.
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "vault.key")


def _load_or_create_key() -> bytes:
    """
    Loads the AES-256 key from a local file, generating one on first run.
    This file must stay out of git (see .gitignore: secrets/, *.key patterns
    should be added — we'll keep it inside database/ which .gitignore should cover).
    """
    if os.path.exists(KEY_PATH):
        with open(KEY_PATH, "rb") as f:
            return f.read()

    key = AESGCM.generate_key(bit_length=256)
    os.makedirs(os.path.dirname(KEY_PATH), exist_ok=True)
    with open(KEY_PATH, "wb") as f:
        f.write(key)
    return key


_KEY = _load_or_create_key()


def encrypt_password(plaintext_password: str) -> str:
    """
    Encrypts a password with AES-256-GCM.
    Returns base64(nonce + ciphertext) so it can be stored as TEXT in SQLite.
    """
    aesgcm = AESGCM(_KEY)
    nonce = os.urandom(12)  # 96-bit nonce, required for GCM, must be unique per encryption
    ciphertext = aesgcm.encrypt(nonce, plaintext_password.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_password(encrypted_b64: str) -> str:
    """
    Decrypts a value produced by encrypt_password.
    Raises an exception (caught by caller) if the ciphertext was tampered with.
    """
    aesgcm = AESGCM(_KEY)
    raw = base64.b64decode(encrypted_b64)
    nonce, ciphertext = raw[:12], raw[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")
