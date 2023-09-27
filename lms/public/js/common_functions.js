frappe.ready(() => {
	setup_file_size();
	pin_header();

	$(".enroll-in-course").click((e) => {
		enroll_in_course(e);
	});

	$(".notify-me").click((e) => {
		notify_user(e);
	});

	$(".nav-link").click((e) => {
		change_hash(e);
	});

	if (window.location.hash) {
		open_tab();
	}

	if (window.location.pathname == "/statistics") {
		generate_graph("New Signups", "#new-signups");
		generate_graph("Course Enrollments", "#course-enrollments");
		generate_graph("Lesson Completion", "#lesson-completion");
		generate_course_completion_graph();
	}

	expand_the_active_chapter();

	$(".chapter-title")
		.unbind()
		.click((e) => {
			rotate_chapter_icon(e);
		});

	$(".no-preview").click((e) => {
		show_no_preview_dialog(e);
	});

	$("#create-batch").click((e) => {
		open_batch_dialog(e);
	});

	$("#course-filter").change((e) => {
		filter_courses(e);
	});
});

const pin_header = () => {
	const el = document.querySelector(".sticky");
	if (el) {
		const observer = new IntersectionObserver(
			([e]) =>
				e.target.classList.toggle("is-pinned", e.intersectionRatio < 1),
			{ threshold: [1] }
		);
		observer.observe(el);
	}
};

const setup_file_size = () => {
	frappe.provide("frappe.form.formatters");
	frappe.form.formatters.FileSize = file_size;
};

const file_size = (value) => {
	if (value > 1048576) {
		value = flt(flt(value) / 1048576, 1) + "M";
	} else if (value > 1024) {
		value = flt(flt(value) / 1024, 1) + "K";
	}
	return value;
};

const enroll_in_course = (e) => {
	e.preventDefault();
	let course = $(e.currentTarget).attr("data-course");
	if (frappe.session.user == "Guest") {
		window.location.href = `/login?redirect-to=/courses/${course}`;
		return;
	}

	let batch = $(e.currentTarget).attr("data-batch");
	batch = batch ? decodeURIComponent(batch) : "";
	frappe.call({
		method: "lms.lms.doctype.lms_enrollment.lms_enrollment.create_membership",
		args: {
			batch: batch ? batch : "",
			course: course,
		},
		callback: (data) => {
			if (data.message == "OK") {
				$(".no-preview-modal").modal("hide");
				frappe.show_alert(
					{
						message: __("Enrolled successfully"),
						indicator: "green",
					},
					3
				);
				setTimeout(function () {
					window.location.href = `/courses/${course}/learn/1.1`;
				}, 1000);
			}
		},
	});
};

const notify_user = (e) => {
	e.preventDefault();
	var course = decodeURIComponent($("#outline-heading").attr("data-course"));
	if (frappe.session.user == "Guest") {
		window.location.href = `/login?redirect-to=/courses/${course}`;
		return;
	}

	frappe.call({
		method: "lms.lms.doctype.lms_course_interest.lms_course_interest.capture_interest",
		args: {
			course: course,
		},
		callback: (data) => {
			$(".no-preview-modal").modal("hide");
			frappe.show_alert(
				{
					message: __(
						"You have opted to be notified for this course. You will receive an email when the course becomes available."
					),
					indicator: "green",
				},
				3
			);
			setTimeout(() => {
				window.location.reload();
			}, 3000);
		},
	});
};

const generate_graph = (chart_name, element, type = "line") => {
	let date = frappe.datetime;

	frappe.call({
		method: "lms.lms.utils.get_chart_data",
		args: {
			chart_name: chart_name,
			timespan: "Select Date Range",
			timegrain: "Daily",
			from_date: date.add_days(date.get_today(), -30),
			to_date: date.add_days(date.get_today(), +1),
		},
		callback: (data) => {
			render_chart(data.message, chart_name, element, type);
		},
	});
};

const render_chart = (data, chart_name, element, type) => {
	const chart = new frappe.Chart(element, {
		title: chart_name,
		data: data,
		type: type,
		height: 250,
		colors: ["#4563f1"],
		axisOptions: {
			xIsSeries: 1,
		},
		lineOptions: {
			regionFill: 1,
		},
	});
};

const generate_course_completion_graph = () => {
	frappe.call({
		method: "lms.lms.utils.get_course_completion_data",
		callback: (data) => {
			render_chart(
				data.message,
				"Course Completion",
				"#course-completion",
				"pie"
			);
		},
	});
};

const change_hash = (e) => {
	window.location.hash = $(e.currentTarget).attr("href");
};

const open_tab = () => {
	$(`a[href="${window.location.hash}"]`).click();
};

const expand_the_first_chapter = () => {
	let elements = $(".course-home-outline .collapse");
	elements.each((i, element) => {
		if (i < 1) {
			show_section(element);
			return false;
		}
	});
};

const expand_the_active_chapter = () => {
	let selector = $(".course-home-headings.title");

	if (selector.length && $(".course-details-page").length) {
		expand_for_course_details(selector);
	} else if ($(".active-lesson").length) {
		/* For course home page */
		selector = $(".active-lesson");
		show_section(selector.parent().parent());
	} else {
		/* If no active chapter then exapand the first chapter */
		expand_the_first_chapter();
	}
};

const expand_for_course_details = (selector) => {
	$(".lesson-info").removeClass("active-lesson");
	$(".lesson-info").each((i, elem) => {
		if ($(elem).data("lesson") == selector.data("lesson")) {
			$(elem).addClass("active-lesson");
			show_section($(elem).parent().parent());
		}
	});
};

const show_section = (element) => {
	$(element).addClass("show");
	$(element)
		.siblings(".chapter-title")
		.children(".chapter-icon")
		.css("transform", "rotate(90deg)");
	$(element).siblings(".chapter-title").attr("aria-expanded", true);
};

const rotate_chapter_icon = (e) => {
	let icon = $(e.currentTarget).children(".chapter-icon");
	if (icon.css("transform") == "none") {
		icon.css("transform", "rotate(90deg)");
	} else {
		icon.css("transform", "none");
	}
};

const show_no_preview_dialog = (e) => {
	$("#no-preview-modal").modal("show");
};

const open_batch_dialog = () => {
	this.batch_dialog = new frappe.ui.Dialog({
		title: __("New Batch"),
		fields: [
			{
				fieldtype: "Data",
				label: __("Title"),
				fieldname: "title",
				reqd: 1,
				default: batch_info && batch_info.title,
			},
			{
				fieldtype: "Check",
				label: __("Published"),
				fieldname: "published",
				default: batch_info && batch_info.published,
			},
			{
				fieldtype: "Column Break",
			},
			{
				fieldtype: "Int",
				label: __("Seat Count"),
				fieldname: "seat_count",
				default: batch_info && batch_info.seat_count,
			},
			{
				fieldtype: "Section Break",
			},
			{
				fieldtype: "Date",
				label: __("Start Date"),
				fieldname: "start_date",
				reqd: 1,
				default: batch_info && batch_info.start_date,
			},
			{
				fieldtype: "Date",
				label: __("End Date"),
				fieldname: "end_date",
				reqd: 1,
				default: batch_info && batch_info.end_date,
			},
			{
				fieldtype: "Select",
				label: __("Medium"),
				fieldname: "medium",
				options: ["Online", "Offline"],
				default: (batch_info && batch_info.medium) || "Online",
			},
			{
				fieldtype: "Column Break",
			},
			{
				fieldtype: "Time",
				label: __("Start Time"),
				fieldname: "start_time",
				default: batch_info && batch_info.start_time,
			},
			{
				fieldtype: "Time",
				label: __("End Time"),
				fieldname: "end_time",
				default: batch_info && batch_info.end_time,
			},
			{
				fieldtype: "Link",
				label: __("Category"),
				fieldname: "category",
				options: "LMS Category",
				only_select: 1,
				default: batch_info && batch_info.category,
			},
			{
				fieldtype: "Section Break",
			},
			{
				fieldtype: "Small Text",
				label: __("Description"),
				fieldname: "description",
				default: batch_info && batch_info.description,
				reqd: 1,
			},
			{
				fieldtype: "Text Editor",
				label: __("Batch Details"),
				fieldname: "batch_details",
				default: batch_info && batch_info.batch_details,
				reqd: 1,
			},
			{
				fieldtype: "Section Break",
				label: __("Pricing"),
				fieldname: "pricing",
			},
			{
				fieldtype: "Check",
				label: __("Paid Batch"),
				fieldname: "paid_batch",
				default: batch_info && batch_info.paid_batch,
			},
			{
				fieldtype: "Currency",
				label: __("Amount"),
				fieldname: "amount",
				default: batch_info && batch_info.amount,
				mandatory_depends_on: "paid_batch",
				depends_on: "paid_batch",
			},
			{
				fieldtype: "Link",
				label: __("Currency"),
				fieldname: "currency",
				options: "Currency",
				default: batch_info && batch_info.currency,
				mandatory_depends_on: "paid_batch",
				depends_on: "paid_batch",
				only_select: 1,
			},
		],
		primary_action_label: __("Save"),
		primary_action: (values) => {
			save_batch(values);
		},
	});
	this.batch_dialog.show();
};

const save_batch = (values) => {
	let args = {};
	if (batch_info) {
		args = Object.assign(batch_info, values);
	} else {
		args = values;
	}
	frappe.call({
		method: "lms.lms.doctype.lms_batch.lms_batch.create_batch",
		args: args,
		callback: (r) => {
			if (r.message) {
				frappe.show_alert({
					message: batch_info
						? __("Batch Updated")
						: __("Batch Created"),
					indicator: "green",
				});
				this.batch_dialog.hide();
				window.location.href = `/batches/details/${r.message.name}`;
			}
		},
	});
};

const filter_courses = (e) => {
	const course_lists = $(".course-cards-parent");
	const filter = $(e.currentTarget).val();
	course_lists.each((i, list) => {
		const course_cards = $(list).children(".course-card");
		course_cards.sort((a, b) => {
			var value1 = $(a).data(filter);
			var value2 = $(b).data(filter);
			return value1 > value2 ? -1 : value1 < value2 ? 1 : 0;
		});
		$(list).append(course_cards);
	});
};

const get_tools = () => {
	return {
		embed: {
			class: Embed,
			config: {
				services: {
					youtube: true,
					vimeo: true,
					codepen: true,
					slides: {
						regex: /https:\/\/docs\.google\.com\/presentation\/d\/e\/([A-Za-z0-9_-]+)\/pub/,
						embedUrl:
							"https://docs.google.com/presentation/d/e/<%= remote_id %>/embed",
						html: "<iframe width='100%' height='300' frameborder='0' allowfullscreen='true'></iframe>",
					},
					pdf: {
						regex: /(https?:\/\/.*\.pdf)/,
						embedUrl: "<%= remote_id %>",
						html: "<iframe width='100%' height='600px' frameborder='0'></iframe>",
					},
				},
			},
		},
		header: {
			class: Header,
			inlineToolbar: ["bold", "italic", "link"],
			config: {
				levels: [4, 5, 6],
				defaultLevel: 5,
			},
			icon: `<svg class="icon  icon-sm" style="">
				<use class="" href="#icon-header"></use>
			</svg>`,
		},
		paragraph: {
			class: Paragraph,
			inlineToolbar: true,
			config: {
				preserveBlank: true,
			},
		},
		youtube: YouTubeVideo,
		quiz: Quiz,
		upload: Upload,
	};
};

class YouTubeVideo {
	constructor({ data, api, readOnly }) {
		this.data = data;
		this.api = api;
		this.readOnly = readOnly;
	}

	static get toolbox() {
		return {
			title: "YouTube Video",
			icon: `<img src="/assets/lms/icons/video.svg" width="15" height="15">`,
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	render() {
		this.wrapper = document.createElement("div");
		this.wrapper.contentEditable = !this.readOnly;
		if (this.data && this.data.youtube) {
			$(this.wrapper).html(this.render_youtube(this.data.youtube));
		} else {
			this.render_youtube_dialog();
		}
		return this.wrapper;
	}

	render_youtube_dialog() {
		let me = this;
		let youtubedialog = new frappe.ui.Dialog({
			title: __("YouTube Video"),
			fields: [
				{
					fieldname: "youtube",
					fieldtype: "Data",
					label: __("YouTube Video ID"),
					reqd: 1,
				},
				{
					fieldname: "instructions_section_break",
					fieldtype: "Section Break",
					label: __("Instructions:"),
				},
				{
					fieldname: "instructions",
					fieldtype: "HTML",
					label: __("Instructions"),
					options: __(
						"Enter the YouTube Video ID. The ID is the part of the URL after <code>watch?v=</code>. For example, if the URL is <code>https://www.youtube.com/watch?v=QH2-TGUlwu4</code>, the ID is <code>QH2-TGUlwu4</code>"
					),
				},
			],
			primary_action_label: __("Insert"),
			primary_action(values) {
				youtubedialog.hide();
				me.youtube = values.youtube;
				$(me.wrapper).html(me.render_youtube(values.youtube));
			},
		});
		youtubedialog.show();
	}

	render_youtube(youtube) {
		return `<iframe width="100%" height="400"
			src="https://www.youtube.com/embed/${youtube}"
			title="YouTube video player"
			frameborder="0"
			style="border-radius: var(--border-radius-lg); margin: 1rem 0;"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen>
		</iframe>`;
	}

	validate(savedData) {
		return !savedData.youtube || !savedData.youtube.trim() ? false : true;
	}

	save(block_content) {
		return {
			youtube: this.data.youtube || this.youtube,
		};
	}
}

class Quiz {
	static get toolbox() {
		return {
			title: "Quiz",
			icon: `<img src="/assets/lms/icons/quiz.svg" width="15" height="15">`,
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	constructor({ data, api, readOnly }) {
		this.data = data;
		this.api = api;
		this.readOnly = readOnly;
	}

	render() {
		this.wrapper = document.createElement("div");
		this.wrapper.contentEditable = !this.readOnly;
		if (this.data && this.data.quiz) {
			$(this.wrapper).html(this.render_quiz(this.data.quiz));
		} else {
			this.render_quiz_dialog();
		}
	}

	render_quiz_dialog() {
		let me = this;
		let quizdialog = new frappe.ui.Dialog({
			title: __("Manage Quiz"),
			fields: [
				{
					fieldname: "quiz",
					fieldtype: "Link",
					label: __("Quiz"),
					options: "LMS Quiz",
					only_select: 1,
				},
			],
			primary_action_label: __("Insert"),
			primary_action(values) {
				me.quiz = values.quiz;
				quizdialog.hide();
				$(me.wrapper).html(me.render_quiz(me.quiz));
			},
			secondary_action_label: __("Create New"),
			secondary_action: () => {
				window.location.href = `/quizzes`;
			},
		});
		quizdialog.show();
		setTimeout(() => {
			$(".modal-body").css("min-height", "200px");
			$(".modal-body input").focus();
		}, 1000);
	}

	render_quiz(quiz) {
		let me = this;
		if (this.readOnly) {
			frappe.call({
				method: "lms.plugins.quiz_renderer",
				args: {
					quiz_name: quiz,
				},
				callback: (data) => {
					return $(me.wrapper).html(data.message);
				},
			});
		} else {
			return `<div class="common-card-style p-2 my-2 bold-heading">
				Quiz: ${quiz}
			</div>`;
		}
	}

	validate(savedData) {
		return !savedData.quiz || !savedData.quiz.trim() ? false : true;
	}

	save(block_content) {
		return {
			quiz: this.data.quiz || this.quiz,
		};
	}
}

class Upload {
	static get toolbox() {
		return {
			title: "Upload",
			icon: `<img src="/assets/lms/icons/upload.svg" width="15" height="15">`,
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	constructor({ data, api, readOnly }) {
		this.data = data;
		this.api = api;
		this.readOnly = readOnly;
	}

	render() {
		this.wrapper = document.createElement("div");
		this.wrapper.contentEditable = !this.readOnly;
		if (this.data && this.data.file_url) {
			$(this.wrapper).html(this.render_upload(this.data.file_url));
		} else {
			this.render_upload_dialog();
		}
		return this.wrapper;
	}

	render_upload_dialog() {
		let self = this;
		new frappe.ui.FileUploader({
			disable_file_browser: true,
			folder: "Home/Attachments",
			make_attachments_public: true,
			restrictions: {
				allowed_file_types: ["image/*", "video/*"],
			},
			on_success: (file_doc) => {
				self.file_url = file_doc.file_url;
				$(self.wrapper).html(self.render_upload(self.file_url));
			},
		});
	}

	render_upload(url) {
		this.is_video = is_video(url);
		if (this.is_video) {
			return `<video controls width='100%'>
				<source src=${encodeURI(url)} type='video/mp4'>
			</video>`;
		} else {
			return `<img src=${encodeURI(url)} width='100%'>`;
		}
	}

	validate(savedData) {
		return !savedData.file_url || !savedData.file_url.trim() ? false : true;
	}

	save(block_content) {
		return {
			file_url: this.data.file_url || this.file_url,
			is_video: this.is_video,
		};
	}
}

const is_video = (url) => {
	let video_types = ["mov", "mp4", "mkv"];
	let video_extension = url.split(".").pop();
	return video_types.indexOf(video_extension) >= 0;
};

frappe.get_tools = get_tools;
