# Copyright (c) 2021, FOSS United and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, add_years
from frappe import _
from frappe.utils.pdf import get_pdf
from lms.lms.utils import is_certified
from htmlwebshot import WebShot
from lms.lms.utils import get_instructors
from frappe.utils.jinja import render_template


class LMSCertificate(Document):


    def validate(self):
        self.validate_duplicate()


    def validate_duplicate(self):
        certificates = frappe.get_all("LMS Certificate", {
            "member": self.member,
            "course": self.course
        })
        if len(certificates):
            full_name = frappe.db.get_value("User", self.member, "full_name")
            course_name = frappe.db.get_value("LMS Course", self.course, "title")
            frappe.throw(_("{0} is already certified for the course {1}").format(full_name, course_name))


@frappe.whitelist()
def create_certificate(course):
    certificate = is_certified(course)

    if certificate:
        return certificate

    else:
        expires_after_yrs = int(frappe.db.get_value("LMS Course", course, "expiry"))
        expiry_date = None
        if expires_after_yrs:
            expiry_date = add_years(nowdate(), expires_after_yrs)

        certificate = frappe.get_doc({
            "doctype": "LMS Certificate",
            "member": frappe.session.user,
            "course": course,
            "issue_date": nowdate(),
            "expiry_date": expiry_date
        })
        certificate.save(ignore_permissions=True)
        return certificate


@frappe.whitelist()
def get_certificate_pdf(html):
    print(html)
    frappe.local.response.filename = "certificate.pdf"
    frappe.local.response.filecontent = get_pdf(html, {"orientation": "LandScape"})
    frappe.local.response.type = "pdf"


@frappe.whitelist()
def generate_image(name):

    certificate = frappe.db.get_value("LMS Certificate", name,
        ["name", "member", "issue_date", "expiry_date", "course"], as_dict=True)

    course = frappe.db.get_value("LMS Course", certificate.course, ["title", "name", "image"], as_dict=True)
    instructors = (", ").join([x.full_name for x in get_instructors(certificate.course)])
    member = frappe.db.get_value("User", certificate.member, ["full_name"], as_dict=True)

    logo = frappe.db.get_single_value("Website Settings", "banner_image")
    template_name = frappe.db.get_single_value("LMS Settings", "custom_certificate_template")
    custom_certificate_template = frappe.db.get_value("Web Template", template_name, "template")

    template = custom_certificate_template if custom_certificate_template else "/templates/certificate.html"
    html = render_template(template, {
        "certificate": certificate,
        "course": course,
        "instructors": instructors,
        "member": member,
        "logo": logo
    })

    shot = WebShot()
    shot.quality = 100
    return shot.create_pic(html="<div>Jan</div>")
