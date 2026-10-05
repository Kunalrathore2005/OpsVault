import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models import User, Role
from app.security import hash_password

@pytest.fixture()
def client(tmp_path):
    engine=create_engine(f"sqlite:///{tmp_path}/test.db",connect_args={"check_same_thread":False})
    TestingSession=sessionmaker(bind=engine,autoflush=False,autocommit=False)
    Base.metadata.create_all(engine)
    def override_db():
        db=TestingSession()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db]=override_db
    with TestClient(app) as value:
        yield value
    app.dependency_overrides.clear();Base.metadata.drop_all(engine)

@pytest.fixture()
def admin(client):
    db=next(app.dependency_overrides[get_db]())
    user=User(email="admin@example.test",full_name="Admin",password_hash=hash_password("Password123!"),role=Role.ADMIN,is_active=True)
    db.add(user);db.commit();db.refresh(user);return user

def token(client,email,password):
    response=client.post("/api/v1/auth/login",json={"email":email,"password":password})
    assert response.status_code==200
    return {"Authorization":f"Bearer {response.json()['access_token']}"}
