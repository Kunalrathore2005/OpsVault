from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Role
from .security import decode_token

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def current_user(token: str | None = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = db.get(User, decode_token(token, "access"))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user

def roles(*allowed: Role):
    def check(user: User = Depends(current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action.")
        return user
    return check

def can_manage_departments(user: User = Depends(current_user)) -> User:
    """Department management capability, architected to easily extend to HR role."""
    department_management_roles = {Role.ADMIN, Role.MANAGER}
    if user.role not in department_management_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to manage departments.")
    return user

def can_access_task(task, user: User):
    if user.role == Role.ADMIN or task.creator_id == user.id or task.assignee_id == user.id:
        return
    if user.role == Role.MANAGER and user.department_id and user.department_id == task.department_id:
        return
    raise HTTPException(status_code=403, detail="You do not have permission to access this task.")
