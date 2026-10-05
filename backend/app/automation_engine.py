import json
import logging
from sqlalchemy.orm import Session
from .models import (
    User, Role, Department, Task, Approval, Incident, Document, Asset,
    Notification, Escalation, AutomationRule, AutomationExecution, utcnow
)

logger = logging.getLogger(__name__)

def check_condition(entity_dict: dict, condition: dict) -> bool:
    field = condition.get("field")
    operator = condition.get("operator", "equals").lower()
    target_value = condition.get("value", "")

    if not field:
        return True

    actual_value = entity_dict.get(field)
    if actual_value is None:
        actual_str = ""
    else:
        actual_str = str(actual_value)

    target_str = str(target_value)

    if operator in ("equals", "=="):
        return actual_str.lower() == target_str.lower()
    elif operator in ("not_equals", "!="):
        return actual_str.lower() != target_str.lower()
    elif operator == "contains":
        return target_str.lower() in actual_str.lower()
    elif operator == "greater_than":
        try:
            return float(actual_str) > float(target_str)
        except ValueError:
            return actual_str > target_str
    elif operator == "less_than":
        try:
            return float(actual_str) < float(target_str)
        except ValueError:
            return actual_str < target_str
    elif operator == "is_empty":
        return not actual_str
    elif operator == "is_not_empty":
        return bool(actual_str)
    return True

def trigger_automation(
    db: Session,
    trigger_type: str,
    source_type: str,
    source_id: int,
    context: dict
) -> list[AutomationExecution]:
    executions = []
    try:
        rules = db.query(AutomationRule).filter(
            AutomationRule.enabled == True,
            AutomationRule.trigger_type == trigger_type
        ).all()

        for rule in rules:
            # Check department scoping if rule specifies department
            rule_dept = rule.department_id
            entity_dept = context.get("department_id")
            if rule_dept and entity_dept and rule_dept != entity_dept:
                continue

            # Check conditions
            conditions_met = True
            if rule.conditions:
                try:
                    conditions_list = json.loads(rule.conditions) if isinstance(rule.conditions, str) else rule.conditions
                    for cond in conditions_list:
                        if not check_condition(context, cond):
                            conditions_met = False
                            break
                except Exception as e:
                    logger.warning(f"Error parsing conditions for rule {rule.id}: {e}")

            if not conditions_met:
                continue

            # Execute actions
            actions_executed = []
            try:
                actions_list = json.loads(rule.actions) if isinstance(rule.actions, str) else rule.actions
                for action in actions_list:
                    act_type = action.get("type", "NOTIFY_ADMIN")
                    msg = action.get("message") or f"Automation rule '{rule.name}' triggered by {source_type} #{source_id}"
                    level = action.get("level", "LEVEL_1")

                    if act_type == "NOTIFY_USER":
                        target_user_id = context.get("assignee_id") or context.get("requester_id") or context.get("reporter_id") or context.get("owner_id")
                        if target_user_id:
                            db.add(Notification(
                                user_id=target_user_id,
                                title=f"Alert: {rule.name}",
                                body=msg,
                                type="AUTOMATION"
                            ))
                            actions_executed.append(f"Notified user #{target_user_id}")

                    elif act_type == "NOTIFY_MANAGER":
                        dept_id = context.get("department_id")
                        q = db.query(User).filter(User.role.in_([Role.MANAGER, Role.ADMIN]), User.is_active == True)
                        if dept_id:
                            q = q.filter((User.department_id == dept_id) | (User.role == Role.ADMIN))
                        managers = q.all()
                        for m in managers:
                            db.add(Notification(
                                user_id=m.id,
                                title=f"Manager Alert: {rule.name}",
                                body=msg,
                                type="AUTOMATION"
                            ))
                        actions_executed.append(f"Notified {len(managers)} managers")

                    elif act_type == "NOTIFY_ADMIN":
                        admins = db.query(User).filter(User.role == Role.ADMIN, User.is_active == True).all()
                        for a in admins:
                            db.add(Notification(
                                user_id=a.id,
                                title=f"Admin Alert: {rule.name}",
                                body=msg,
                                type="AUTOMATION"
                            ))
                        actions_executed.append(f"Notified {len(admins)} admins")

                    elif act_type == "CREATE_ESCALATION":
                        esc = Escalation(
                            source_type=source_type,
                            source_id=source_id,
                            title=f"Escalation: {context.get('title') or context.get('subject') or f'{source_type} #{source_id}'}",
                            reason=msg,
                            level=level,
                            status="OPEN",
                            assigned_to_id=context.get("assignee_id"),
                            department_id=context.get("department_id")
                        )
                        db.add(esc)
                        actions_executed.append(f"Created escalation (Level: {level})")

                # Update rule metrics
                rule.last_run_at = utcnow()
                rule.execution_count += 1

                # Record execution
                exec_record = AutomationExecution(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    status="SUCCESS",
                    triggered_by=f"{source_type} #{source_id}",
                    details=", ".join(actions_executed) if actions_executed else "Rule executed successfully."
                )
                db.add(exec_record)
                executions.append(exec_record)

            except Exception as e:
                logger.error(f"Error executing rule {rule.id}: {e}")
                fail_record = AutomationExecution(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    status="FAILED",
                    triggered_by=f"{source_type} #{source_id}",
                    details=f"Execution error: {str(e)}"
                )
                db.add(fail_record)
                executions.append(fail_record)

        db.commit()
    except Exception as e:
        logger.error(f"Global error in trigger_automation: {e}")
        db.rollback()

    return executions
