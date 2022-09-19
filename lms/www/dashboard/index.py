import frappe
from lms.lms.utils import can_create_course, has_course_moderator_role


def get_context(context):
    context.no_cache = 1
    context.show_creators_section = can_create_course()
    context.show_review_section = has_course_moderator_role()
