from cryptography.fernet import Fernet
from app.core.config import settings

# This key needs to be a 32-byte URL-safe base64-encoded key
# We will derive it from the SECRET_KEY in the config
key = settings.ENCRYPTION_KEY.encode()
fernet = Fernet(key)

def encrypt_data(data: str) -> str:
    if not data:
        return data
    encrypted_data = fernet.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_data(encrypted_data: str) -> str:
    if not encrypted_data:
        return encrypted_data
    decrypted_data = fernet.decrypt(encrypted_data.encode())
    return decrypted_data.decode()

from sqlalchemy import TypeDecorator, String, Text
import json

class EncryptedString(TypeDecorator):
    """A SQLAlchemy type that encrypts and decrypts string values."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """
        Encrypt data on its way to the database.
        """
        if value is not None:
            return encrypt_data(str(value))
        return value

    def process_result_value(self, value, dialect):
        """
        Decrypt data on its way from the database.
        """
        if value is not None:
            return decrypt_data(str(value))
        return value

class EncryptedText(TypeDecorator):
    """A SQLAlchemy type that encrypts and decrypts text values."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """
        Encrypt data on its way to the database.
        """
        if value is not None:
            return encrypt_data(str(value))
        return value

    def process_result_value(self, value, dialect):
        """
        Decrypt data on its way from the database.
        """
        if value is not None:
            return decrypt_data(str(value))
        return value 