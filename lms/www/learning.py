import frappe
from frappe.utils.telemetry import capture
import subprocess


def get_context(context):
	context.no_cache = 1
	print("inside learning")
	csrf_token = frappe.sessions.get_csrf_token()
	frappe.db.commit()
	if frappe.session.user != "Guest":
		capture("active_site", "lms")
	context.csrf_token = csrf_token

	output = get_html_from_vue(frappe.form_dict.path)
	print(output)
	file_path = frappe.get_app_source_path("lms") + "/lms/www/"
	with open(f"{file_path}learning.html", "w") as f:
		f.write(output)


def get_html_from_vue(path):
	app_path = frappe.get_app_source_path("lms") + "/frontend"
	process = subprocess.Popen(
		["node", "--trace-warnings", "server.js", path],
		cwd=app_path,
		stdout=subprocess.PIPE,
		stderr=subprocess.PIPE,
	)
	stdout, stderr = process.communicate()
	print(stderr)
	return stdout.decode()
