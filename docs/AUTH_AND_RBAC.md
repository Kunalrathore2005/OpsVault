# OpsVault — Authentication & Role-Based Access Control (RBAC)

## 1. Authentication Architecture (JWT)

### How Login Works
1. **Request:** User submits email and plain-text password to `POST /api/v1/auth/login`.
2. **Hash Verification:** FastAPI queries `users` table by email. If found, Passlib's `bcrypt` algorithm compares the password with the stored `password_hash`.
3. **Token Generation:** PyJWT generates a signed JSON Web Token using the server's `SECRET_KEY` with algorithm `HS256`.
4. **Token Payload:**
   ```json
   {
     "sub": "1",
     "email": "admin@opsvault.local",
     "role": "ADMIN",
     "exp": 1759400000
   }
   ```
5. **Client Storage:** The frontend stores the token in `localStorage.token`.
6. **Subsequent Calls:** `apiClient.js` automatically attaches `Authorization: Bearer <token>` to every HTTP header.

---

## 2. Role-Based Access Control (RBAC) Matrix

OpsVault enforces three distinct roles: `ADMIN`, `MANAGER`, and `EMPLOYEE`.

| Feature / Capability | ADMIN | MANAGER | EMPLOYEE |
| :--- | :---: | :---: | :---: |
| **Personal Task Creation & Tracking** | ✅ | ✅ | ✅ |
| **Cross-Department Task Assignment** | ✅ | ✅ (Dept only) | ❌ |
| **Task Discussion & Comments** | ✅ | ✅ | ✅ |
| **Submit Operational Requests** | ✅ | ✅ | ✅ |
| **Review & Approve/Reject Requests** | ✅ | ✅ | ❌ |
| **Report Incident / Outage** | ✅ | ✅ | ✅ |
| **Manage Organizational Departments** | ✅ | ❌ | ❌ |
| **Create & Manage Staff Accounts** | ✅ | ❌ | ❌ |
| **Configure Automation Rules** | ✅ | ✅ | ❌ |
| **Manage Escalations & SLA Breaches** | ✅ | ✅ | ❌ |
| **Generate & Schedule Business Reports** | ✅ | ✅ | ❌ |
| **Hardware Asset Registry** | Full Read/Write | Full Read/Write | Assigned Items Only |
| **Document Repository** | Full Read/Write | Full Read/Write | Own + Shared Items |

---

## 3. Why Frontend-Only Protection Is Never Enough
- **Frontend Security:** Hides sidebar items and buttons for a clean UX (`if (user.role === 'ADMIN') ...`).
- **Backend Security (True Defense):** Any user can open DevTools or curl and send a `POST /api/v1/automations` request. FastAPI protects routes with dependency guards:
  ```python
  @app.post("/api/v1/automations")
  def create_rule(data: AutomationRuleIn, user: User = Depends(roles(Role.ADMIN, Role.MANAGER))):
      ...
  ```
- If an `EMPLOYEE` sends this request, FastAPI's `roles()` dependency intercepts the JWT before any database query executes and throws an immediate `HTTP 403 Forbidden` response.
