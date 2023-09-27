frappe.ready(() => {
	let self = this;

	frappe.telemetry.capture("on_lesson_creation_page", "lms");

	if ($("#instructor-notes").length) {
		parse_string_to_content("notes");
	}

	if ($("#current-lesson-content").length) {
		parse_string_to_content("lesson");
	}

	setup_editor_for_lesson_content();
	setup_editor_for_instructor_notes();

	$("#save-lesson").click((e) => {
		save_lesson(e);
	});
});

const setup_editor_for_lesson_content = () => {
	self.lesson_editor = new EditorJS({
		holder: "lesson-content",
		tools: frappe.get_tools(),
		data: {
			blocks: self.lesson_blocks ? self.lesson_blocks : [],
		},
	});
};

const setup_editor_for_instructor_notes = () => {
	self.notes_editor = new EditorJS({
		holder: "instructor-notes",
		tools: frappe.get_tools(),
		data: {
			blocks: self.note_blocks ? self.note_blocks : [],
		},
	});
};

const parse_string_to_content = (type) => {
	console.log(type);
	let content;
	if (type == "lesson") {
		content = $("#current-lesson-content").html();
		this.lesson_blocks = JSON.parse(content).blocks;
	} else {
		content = $("#current-instructor-notes").html();
		this.note_blocks = JSON.parse(content).blocks;
	}
};

const save_lesson = (e) => {
	self.editor.save().then((outputData) => {
		parse_lesson_to_string(outputData);
	});
};

const parse_lesson_to_string = (data) => {
	let lesson_content = "";
	console.log(data);
	debugger;
	data.blocks.forEach((block) => {
		if (block.type == "youtube") {
			lesson_content += `{{ YouTubeVideo("${block.data.youtube}") }}\n`;
		} else if (block.type == "quiz") {
			lesson_content += `{{ Quiz("${block.data.quiz}") }}\n`;
		} else if (block.type == "upload") {
			let url = block.data.file_url;
			lesson_content += block.data.is_video
				? `{{ Video("${url}") }}\n`
				: `![](${url})`;
		} else if (block.type == "header") {
			lesson_content +=
				"#".repeat(block.data.level) + ` ${block.data.text}\n`;
		} else if (block.type == "paragraph") {
			lesson_content += `${block.data.text}\n`;
		} else if (block.type == "embed") {
			if (block.data.service == "pdf") {
				if (!block.data.embed.startsWith(window.location.origin)) {
					frappe.throw(__("Invalid PDF URL"));
				}
			}
			lesson_content += `{{ Embed("${
				block.data.service
			}|||${block.data.embed.replace(/&amp;/g, "&")}") }}\n`;
		}
	});
	save(lesson_content);
};

const save = (lesson_content) => {
	validate_mandatory(lesson_content);
	let lesson = $("#lesson-title").data("lesson");

	frappe.call({
		method: "lms.lms.doctype.lms_course.lms_course.save_lesson",
		args: {
			title: $("#lesson-title").val(),
			body: lesson_content,
			chapter: $("#lesson-title").data("chapter"),
			preview: $("#preview").prop("checked") ? 1 : 0,
			idx: $("#lesson-title").data("index"),
			lesson: lesson ? lesson : "",
			instructor_notes:
				this.instructor_notes.get_values().instructor_notes,
		},
		callback: (data) => {
			frappe.show_alert({
				message: __("Saved"),
				indicator: "green",
			});
			setTimeout(() => {
				window.location.href = window.location.href.split("?")[0];
			}, 1000);
		},
	});
};

const validate_mandatory = (lesson_content) => {
	if (!$("#lesson-title").val()) {
		let error = $("p")
			.addClass("error-message")
			.text(__("Please enter a Lesson Title"));
		$(error).insertAfter("#lesson-title");
		$("#lesson-title").focus();
		throw "Title is mandatory";
	}

	if (!lesson_content.trim()) {
		let error = $("p")
			.addClass("error-message")
			.text(__("Please enter some content for the lesson"));
		$(error).insertAfter("#lesson-content");
		document
			.getElementById("lesson-content")
			.scrollIntoView({ block: "start" });
		throw "Lesson Content is mandatory";
	}
};
