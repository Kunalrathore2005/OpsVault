from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from .config import settings
# PBKDF2 avoids the passlib/bcrypt binary compatibility problem on current
# containers while retaining salted, one-way password hashing.
pwd=CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
def hash_password(value:str): return pwd.hash(value)
def verify_password(value:str, hashed:str): return pwd.verify(value, hashed)
def create_token(user_id:int, kind:str, expires:timedelta):
    return jwt.encode({"sub":str(user_id),"kind":kind,"exp":datetime.now(timezone.utc)+expires}, settings.secret_key, algorithm="HS256")
def decode_token(token:str, kind:str):
    try:
        payload=jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        if payload.get("kind") != kind: raise ValueError()
        return int(payload["sub"])
    except Exception: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
