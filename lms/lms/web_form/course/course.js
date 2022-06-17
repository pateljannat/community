frappe.ready(() => {
    frappe.web_form.after_save = () => {
        redirect_to_course()
    }
});

const redirect_to_course = () => {
    let route;
    if (frappe.web_form.doc.name) {
        route  = `/courses/${frappe.web_form.doc.name}`;
    }
    else {
        frappe.call({
            method: "lms.lms.doctype.lms_course.lms_course.get_course_name",
            args: {
                "title": frappe.web_form.doc.title
            },
            callback: (data) => {
                route = `/courses/${data}`;
            }
        });
    }

    let redirect = setInterval(() => {
        if (route) {
            debugger
            clearInterval(redirect);
            window.location.href = route;
        }
    }, 1000);
}
