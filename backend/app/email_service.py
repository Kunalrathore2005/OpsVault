import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from .config import settings

logger = logging.getLogger(__name__)

def send_email(
    to_emails: list[str],
    subject: str,
    body_text: str,
    attachment_name: str | None = None,
    attachment_bytes: bytes | None = None,
    attachment_mime: str = "text/csv"
) -> bool:
    """
    Sends an email with optional attachment. If SMTP is not configured in settings,
    logs the event and returns True gracefully without breaking workflows.
    """
    if not to_emails:
        return False

    smtp_host = getattr(settings, "smtp_host", None)
    smtp_port = getattr(settings, "smtp_port", 587)
    smtp_user = getattr(settings, "smtp_user", None)
    smtp_pass = getattr(settings, "smtp_password", None)
    smtp_from = getattr(settings, "smtp_from", "no-reply@opsvault.local")

    if not smtp_host:
        logger.info(f"[Email Service] SMTP not configured. Simulated email to {to_emails} with subject: '{subject}'")
        return True

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_from
        msg["To"] = ", ".join(to_emails)
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))

        if attachment_name and attachment_bytes:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment_bytes)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f'attachment; filename="{attachment_name}"')
            msg.attach(part)

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, to_emails, msg.as_string())
        server.quit()
        logger.info(f"[Email Service] Email sent successfully to {to_emails}")
        return True
    except Exception as e:
        logger.warning(f"[Email Service] Failed to send email via SMTP ({smtp_host}:{smtp_port}): {e}")
        return False
