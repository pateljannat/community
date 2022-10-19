frappe.provide('lms.setup')

// redirect to desk page 'lms' after setup wizard is complete
// 'lms' desk page redirects to '/get-started'
frappe.setup.welcome_page = '/get-started'
