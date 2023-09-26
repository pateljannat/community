import frappe
import re
import json
from frappe.utils import get_timestamp, getdate


def execute():
	frappe.reload_doc("lms", "doctype", "")
	lessons = frappe.get_all(
		"Course Lesson", fields=["name", "body", "instructor_notes", "youtube", "quiz_id"]
	)

	for lesson in lessons:
		migrate_lesson_content(lesson)
		if lesson.instructor_notes:
			print(lesson.name)
			migrate_instructor_notes(lesson)


def migrate_lesson_content(lesson):
	blocks = get_blocks(lesson.body)
	if lesson.youtube:
		blocks.insert(0, {"type": "youtube", "data": {"youtube": lesson.youtube}})
	if lesson.quiz_id:
		blocks.append({"type": "quiz", "data": {"quiz": lesson.quiz_id}})
	content = {"time": get_timestamp(getdate()), "blocks": blocks}
	frappe.db.set_value(
		"Course Lesson", lesson.name, "lesson_content", json.dumps(content)
	)


def migrate_instructor_notes(lesson):
	blocks = get_blocks(lesson.instructor_notes)
	content = {"time": get_timestamp(getdate()), "blocks": blocks}
	frappe.db.set_value(
		"Course Lesson", lesson.name, "instructor_notes", json.dumps(content)
	)


def get_blocks(content):
	blocks = content.split("\n")
	lesson_blocks = []

	for block in blocks:
		if "{{ YouTubeVideo" in block:
			youtube_id = re.search(r"\(['\"](.*?)['\"]\)", block).group(1)
			lesson_blocks.append(
				{
					"type": "youtube",
					"data": {
						"youtube": youtube_id,
					},
				}
			)
			print(youtube_id)
			print(lesson_blocks)
		elif "{{ Quiz" in block:
			quiz = re.search(r"\(['\"](.*?)['\"]\)", block).group(1)
			lesson_blocks.append(
				{
					"type": "quiz",
					"data": {
						"quiz": quiz,
					},
				}
			)
		elif "{{ Video" in block:
			video = re.search(r"\(['\"](.*?)['\"]\)", block).group(1)
			lesson_blocks.append(
				{
					"type": "upload",
					"data": {
						"file_url": video,
					},
				}
			)
		elif "{{ Embed" in block:
			embed = re.search(r"\((.*?)\)", block).group(1)
			embed_parts = embed.split("|||")
			lesson_blocks.append(
				{
					"type": "embed",
					"data": {
						"service": embed_parts[0],
						"embed": embed_parts[1],
					},
				}
			)
		elif "![]" in block:
			image = re.search(r"\((.*?)\)", block).group(1)
			lesson_blocks.append(
				{
					"type": "upload",
					"data": {
						"file_url": image,
					},
				}
			)
		elif "#" in block:
			level = len(re.findall(r"#", block))
			text = block.replace("#", "").strip()
			lesson_blocks.append(
				{
					"type": "header",
					"data": {
						"text": text,
						"level": level,
					},
				}
			)
		else:
			lesson_blocks.append(
				{
					"type": "paragraph",
					"data": {
						"text": block,
					},
				}
			)

	return lesson_blocks
