from .conftest import token
import io

def test_public_registration_cannot_elevate(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "new@example.test",
        "password": "Password123!",
        "full_name": "New User",
        "role": "ADMIN"
    })
    assert response.status_code == 403

def test_login_and_admin_create_user(client, admin):
    headers = token(client, "admin@example.test", "Password123!")
    # Create Manager
    resp_mgr = client.post("/api/v1/users", headers=headers, json={
        "email": "manager@example.test",
        "password": "Password123!",
        "full_name": "Manager",
        "role": "MANAGER"
    })
    assert resp_mgr.status_code == 201
    assert resp_mgr.json()["role"] == "MANAGER"

    # Create 2 Employees
    resp_emp1 = client.post("/api/v1/users", headers=headers, json={
        "email": "emp1@example.test",
        "password": "Password123!",
        "full_name": "Employee One",
        "role": "EMPLOYEE"
    })
    assert resp_emp1.status_code == 201

    resp_emp2 = client.post("/api/v1/users", headers=headers, json={
        "email": "emp2@example.test",
        "password": "Password123!",
        "full_name": "Employee Two",
        "role": "EMPLOYEE"
    })
    assert resp_emp2.status_code == 201

    # Fetch users list as Admin (Must not fail or crash)
    list_resp = client.get("/api/v1/users", headers=headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert "items" in data
    emails = [u["email"] for u in data["items"]]
    assert "manager@example.test" in emails
    assert "emp1@example.test" in emails
    assert "emp2@example.test" in emails

def test_employee_personal_task_and_assignment_restrictions(client, admin):
    # Register employee
    client.post("/api/v1/auth/register", json={
        "email": "employee@example.test",
        "password": "Password123!",
        "full_name": "Employee"
    })
    emp_headers = token(client, "employee@example.test", "Password123!")

    # Employee CAN create personal task using only title + description
    res = client.post("/api/v1/tasks", headers=emp_headers, json={
        "title": "My Personal Task",
        "description": "Doing my independent work"
    })
    assert res.status_code == 201
    task_data = res.json()
    assert task_data["title"] == "My Personal Task"
    assert task_data["creator_id"] == task_data["assignee_id"]

    # Employee CANNOT assign task to another user through the API
    res_unauth = client.post("/api/v1/tasks", headers=emp_headers, json={
        "title": "Illegal assignment",
        "assignee_id": admin.id
    })
    assert res_unauth.status_code == 403

def test_admin_manager_assign_task_and_notifications(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")
    client.post("/api/v1/auth/register", json={
        "email": "assignee@example.test",
        "password": "Password123!",
        "full_name": "Assignee Employee"
    })
    emp_resp = client.get("/api/v1/users?search=Assignee", headers=admin_headers)
    assignee_id = emp_resp.json()["items"][0]["id"]

    # Admin creates and assigns task to employee
    res = client.post("/api/v1/tasks", headers=admin_headers, json={
        "title": "Assigned Security Audit",
        "description": "Check permissions",
        "assignee_id": assignee_id,
        "difficulty": "EASY"
    })
    assert res.status_code == 201
    task_id = res.json()["id"]

    # Employee checks notifications
    emp_headers = token(client, "assignee@example.test", "Password123!")
    notifs = client.get("/api/v1/notifications", headers=emp_headers)
    assert notifs.status_code == 200
    assert any("Assigned" in n["title"] for n in notifs.json())

    # Employee sees the assigned task
    my_tasks = client.get("/api/v1/tasks", headers=emp_headers)
    assert my_tasks.status_code == 200
    task_ids = [t["id"] for t in my_tasks.json()["items"]]
    assert task_id in task_ids

def test_employee_task_status_updates(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")
    client.post("/api/v1/auth/register", json={
        "email": "worker@example.test",
        "password": "Password123!",
        "full_name": "Worker"
    })
    emp_resp = client.get("/api/v1/users?search=Worker", headers=admin_headers)
    worker_id = emp_resp.json()["items"][0]["id"]

    # Assigned task
    assigned_res = client.post("/api/v1/tasks", headers=admin_headers, json={
        "title": "Assigned Task",
        "assignee_id": worker_id
    })
    assigned_id = assigned_res.json()["id"]

    emp_headers = token(client, "worker@example.test", "Password123!")

    # Worker can update status of assigned task: Pending -> IN_PROGRESS
    res_wip = client.patch(f"/api/v1/tasks/{assigned_id}", headers=emp_headers, json={"status": "IN_PROGRESS"})
    assert res_wip.status_code == 200
    assert res_wip.json()["status"] == "IN_PROGRESS"

    # Worker can update status: IN_PROGRESS -> COMPLETED
    res_done = client.patch(f"/api/v1/tasks/{assigned_id}", headers=emp_headers, json={"status": "COMPLETED"})
    assert res_done.status_code == 200
    assert res_done.json()["status"] == "COMPLETED"

    # Worker CANNOT modify title or details of assigned task
    res_mod = client.patch(f"/api/v1/tasks/{assigned_id}", headers=emp_headers, json={"title": "Hacked Title"})
    assert res_mod.status_code == 403

def test_task_deletion_rbac(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")
    client.post("/api/v1/auth/register", json={
        "email": "deleter@example.test",
        "password": "Password123!",
        "full_name": "Deleter Employee"
    })
    emp_headers = token(client, "deleter@example.test", "Password123!")
    emp_id = client.get("/api/v1/profile", headers=emp_headers).json()["profile"]["id"]

    # Create personal task
    personal = client.post("/api/v1/tasks", headers=emp_headers, json={"title": "My Personal To Delete"})
    personal_id = personal.json()["id"]

    # Create assigned task
    assigned = client.post("/api/v1/tasks", headers=admin_headers, json={"title": "Admin Assigned Task", "assignee_id": emp_id})
    assigned_id = assigned.json()["id"]

    # Employee CAN delete personal task
    del_personal = client.delete(f"/api/v1/tasks/{personal_id}", headers=emp_headers)
    assert del_personal.status_code == 204

    # Employee CANNOT delete assigned task
    del_assigned = client.delete(f"/api/v1/tasks/{assigned_id}", headers=emp_headers)
    assert del_assigned.status_code == 403

    # Admin CAN delete assigned task
    admin_del = client.delete(f"/api/v1/tasks/{assigned_id}", headers=admin_headers)
    assert admin_del.status_code == 204

def test_employee_request_lifecycle(client, admin):
    client.post("/api/v1/auth/register", json={
        "email": "requester@example.test",
        "password": "Password123!",
        "full_name": "Requester Employee"
    })
    emp_headers = token(client, "requester@example.test", "Password123!")

    # Employee creates request
    req = client.post("/api/v1/approvals", headers=emp_headers, json={
        "subject": "Equipment Request",
        "details": "Need external monitor for workstation"
    })
    assert req.status_code == 201
    req_id = req.json()["id"]

    # Employee cannot approve own request
    unauth = client.post(f"/api/v1/approvals/{req_id}/decision", headers=emp_headers, json={"approved": True})
    assert unauth.status_code == 403

    # Admin accepts request
    admin_headers = token(client, "admin@example.test", "Password123!")
    decide = client.post(f"/api/v1/approvals/{req_id}/decision", headers=admin_headers, json={
        "approved": True,
        "comment": "Approved by IT procurement"
    })
    assert decide.status_code == 200
    assert decide.json()["status"] == "APPROVED"

    # Requester receives notification
    notifs = client.get("/api/v1/notifications", headers=emp_headers).json()
    assert any("Approved" in n["title"] for n in notifs)

def test_department_management_and_employee_assignment(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")

    # Create department
    dept_res = client.post("/api/v1/departments", headers=admin_headers, json={
        "name": "Engineering",
        "description": "Software team"
    })
    assert dept_res.status_code == 201
    dept_id = dept_res.json()["id"]

    # Register employee
    client.post("/api/v1/auth/register", json={
        "email": "engineer@example.test",
        "password": "Password123!",
        "full_name": "Engineer One"
    })
    user_res = client.get("/api/v1/users?search=Engineer", headers=admin_headers)
    eng_id = user_res.json()["items"][0]["id"]

    # Assign employee to department
    assign_res = client.post(f"/api/v1/departments/{dept_id}/employees", headers=admin_headers, json={
        "user_id": eng_id
    })
    assert assign_res.status_code == 200
    assert assign_res.json()["employee_count"] == 1

    # Verify department list includes employee
    depts = client.get("/api/v1/departments", headers=admin_headers).json()
    eng_dept = next(d for d in depts if d["id"] == dept_id)
    assert eng_dept["employee_count"] == 1
    assert any(e["id"] == eng_id for e in eng_dept["employees"])

    # Remove employee from department
    unassign = client.delete(f"/api/v1/departments/{dept_id}/employees/{eng_id}", headers=admin_headers)
    assert unassign.status_code == 204

def test_task_completion_awards_xp_once(client, admin):
    headers = token(client, "admin@example.test", "Password123!")
    create = client.post("/api/v1/tasks", headers=headers, json={"title": "XP task", "difficulty": "EASY"})
    assert create.status_code == 201
    task_id = create.json()["id"]
    moving = client.patch(f"/api/v1/tasks/{task_id}", headers=headers, json={"status": "IN_PROGRESS"})
    assert moving.status_code == 200
    completed = client.patch(f"/api/v1/tasks/{task_id}", headers=headers, json={"status": "COMPLETED"})
    assert completed.status_code == 200
    profile = client.get("/api/v1/profile", headers=headers).json()
    assert profile["profile"]["xp"] == 50
    second = client.patch(f"/api/v1/tasks/{task_id}", headers=headers, json={"status": "COMPLETED"})
    assert second.status_code == 409

def test_incidents_crud(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")
    create = client.post("/api/v1/incidents", headers=admin_headers, json={
        "title": "Database connection drop",
        "description": "High connection pool wait time",
        "severity": "HIGH"
    })
    assert create.status_code == 201
    inc_id = create.json()["id"]

    # List incidents
    inc_list = client.get("/api/v1/incidents", headers=admin_headers)
    assert inc_list.status_code == 200
    assert inc_list.json()["total"] >= 1

    # Update incident
    update = client.patch(f"/api/v1/incidents/{inc_id}", headers=admin_headers, json={
        "status": "RESOLVED",
        "resolution": "Increased pool size"
    })
    assert update.status_code == 200
    assert update.json()["status"] == "RESOLVED"

    # Delete incident
    delete_res = client.delete(f"/api/v1/incidents/{inc_id}", headers=admin_headers)
    assert delete_res.status_code == 204

def test_assets_crud(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")
    create = client.post("/api/v1/assets", headers=admin_headers, json={
        "name": "ThinkPad X1 Carbon",
        "asset_tag": "TAG-TEST-9999",
        "status": "AVAILABLE"
    })
    assert create.status_code == 201
    asset_id = create.json()["id"]

    # List assets
    asset_list = client.get("/api/v1/assets", headers=admin_headers)
    assert asset_list.status_code == 200
    assert asset_list.json()["total"] >= 1

    # Delete asset
    del_res = client.delete(f"/api/v1/assets/{asset_id}", headers=admin_headers)
    assert del_res.status_code == 204

def test_documents_crud_and_download(client, admin):
    admin_headers = token(client, "admin@example.test", "Password123!")
    fake_file = io.BytesIO(b"Hello OpsVault document content")
    upload = client.post(
        "/api/v1/documents",
        headers=admin_headers,
        files={"file": ("test_doc.txt", fake_file, "text/plain")}
    )
    assert upload.status_code == 201
    doc_id = upload.json()["id"]

    # Download with auth header
    down = client.get(f"/api/v1/documents/{doc_id}/download", headers=admin_headers)
    assert down.status_code == 200
    assert down.content == b"Hello OpsVault document content"

    # Delete document
    del_doc = client.delete(f"/api/v1/documents/{doc_id}", headers=admin_headers)
    assert del_doc.status_code == 204

