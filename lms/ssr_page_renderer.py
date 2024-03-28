import frappe
from frappe.website.page_renderers.base_renderer import BaseRenderer
from frappe.website.page_renderers.template_page import TemplatePage


class VuePageRenderer(BaseRenderer):
	def can_render(self):
		return self.path.startswith("learning/courses") or self.path.startswith(
			"learning/batches"
		)

	def render(self):
		print(self.path)
		return render_portal_page("learning", path=self.path)


def render_portal_page(page, **kwargs):
	frappe.form_dict.update(kwargs)
	print(frappe.form_dict)
	return TemplatePage(page).render()
