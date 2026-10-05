from .conftest import token
import pytest

def test_sla_summary(client, admin):
    headers = token(client, "admin@example.test", "Password123!")
    res = client.get("/api/v1/sla/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "tasks_on_track" in data
    assert "requests_on_track" in data
    assert "incidents_on_track" in data
    assert "open_escalations" in data

def test_calendar_events_crud_and_merged_view(client, admin):
    headers = token(client, "admin@example.test", "Password123!")
    
    # 1. Create a personal calendar event
    event_payload = {
        "title": "Quarterly Operations Review",
        "description": "Review Q3 team KPIs",
        "start_time": "2026-10-15T10:00:00Z",
        "end_time": "2026-10-15T11:30:00Z",
        "event_type": "MEETING",
        "reminder_minutes": 30,
        "is_all_day": False
    }
    create_res = client.post("/api/v1/calendar/events", json=event_payload, headers=headers)
    assert create_res.status_code == 201
    event_data = create_res.json()
    event_id = event_data["id"]
    assert event_data["title"] == "Quarterly Operations Review"

    # 2. Query merged calendar events
    list_res = client.get("/api/v1/calendar/events", headers=headers)
    assert list_res.status_code == 200
    events = list_res.json()
    assert any(e["raw_id"] == event_id for e in events)

    # 3. Update the event
    update_res = client.patch(f"/api/v1/calendar/events/{event_id}", json={"title": "Updated Operations Review"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Operations Review"

    # 4. Delete the event
    del_res = client.delete(f"/api/v1/calendar/events/{event_id}", headers=headers)
    assert del_res.status_code == 204

def test_automations_crud_and_toggle(client, admin):
    headers = token(client, "admin@example.test", "Password123!")

    rule_payload = {
        "name": "Auto Escalate High Priority Tasks",
        "description": "Trigger escalation on high priority task creation",
        "trigger_type": "TASK_CREATED",
        "conditions": [{"field": "priority", "operator": "equals", "value": "HIGH"}],
        "actions": [{"type": "CREATE_ESCALATION", "level": "HIGH", "message": "High priority task submitted"}],
        "enabled": True
    }
    create_res = client.post("/api/v1/automations", json=rule_payload, headers=headers)
    assert create_res.status_code == 201
    rule = create_res.json()
    rule_id = rule["id"]
    assert rule["name"] == "Auto Escalate High Priority Tasks"

    # Toggle rule
    toggle_res = client.post(f"/api/v1/automations/{rule_id}/toggle", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["enabled"] is False

    # Clean up
    del_res = client.delete(f"/api/v1/automations/{rule_id}", headers=headers)
    assert del_res.status_code == 204

def test_reports_generation_and_history(client, admin):
    headers = token(client, "admin@example.test", "Password123!")

    # 1. List available report types
    types_res = client.get("/api/v1/reports/types", headers=headers)
    assert types_res.status_code == 200
    types = types_res.json()
    assert len(types) >= 7

    # 2. Generate on-demand CSV report
    gen_payload = {
        "report_type": "DAILY_OPS",
        "format": "CSV"
    }
    gen_res = client.post("/api/v1/reports/generate", json=gen_payload, headers=headers)
    assert gen_res.status_code == 200
    assert "text/csv" in gen_res.headers["content-type"]
    assert "Daily Operations Summary" in gen_res.text

    # 3. Generate JSON report
    gen_json = client.post("/api/v1/reports/generate", json={"report_type": "INCIDENT_RISK", "format": "JSON"}, headers=headers)
    assert gen_json.status_code == 200
    assert "application/json" in gen_json.headers["content-type"]

    # 4. Check report history
    hist_res = client.get("/api/v1/reports/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1

def test_escalations_management(client, admin):
    headers = token(client, "admin@example.test", "Password123!")

    # 1. Create an escalation
    esc_payload = {
        "source_type": "TASK",
        "source_id": 1,
        "title": "Task Deadline Slippage",
        "reason": "Critical server maintenance delay",
        "level": "CRITICAL"
    }
    create_res = client.post("/api/v1/escalations", json=esc_payload, headers=headers)
    assert create_res.status_code == 201
    esc = create_res.json()
    esc_id = esc["id"]
    assert esc["level"] == "CRITICAL"
    assert esc["status"] == "OPEN"

    # 2. List escalations
    list_res = client.get("/api/v1/escalations", headers=headers)
    assert list_res.status_code == 200
    assert any(e["id"] == esc_id for e in list_res.json())

    # 3. Resolve escalation
    resolve_res = client.post(f"/api/v1/escalations/{esc_id}/resolve", json={"resolution_note": "Server reboot completed successfully"}, headers=headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
    assert resolve_res.json()["resolution_notes"] == "Server reboot completed successfully"
