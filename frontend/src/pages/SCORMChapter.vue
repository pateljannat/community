<template>
	<header
		class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-3 py-2.5 sm:px-5"
	>
		<Breadcrumbs class="h-7" :items="breadcrumbs" />
	</header>
	<div
		v-if="
			readyToRender &&
			(enrollment.data?.length ||
				user.data?.is_moderator ||
				user.data?.is_instructor)
		"
	>
		<iframe
			:srcdoc="chapter.data.launch_file_content"
			ref="iframe"
			@load="changeInvalidPaths"
			class="w-full h-screen"
		/>
		<!-- <iframe :src="chapter.data.launch_file" class="w-full h-screen" /> -->
		<!-- <div v-html="chapter.data.launch_file_content" class="w-full h-screen"></div> -->
	</div>
	<div v-else-if="!enrollment.data?.length">
		<div class="text-center pt-10 px-5 md:px-0 pb-10">
			<div class="text-center">
				<div class="mb-4">
					{{
						__(
							'You are not enrolled in this course. Please enroll to access this lesson.'
						)
					}}
				</div>
				<Button variant="solid" @click="enrollStudent()">
					{{ __('Start Learning') }}
				</Button>
			</div>
		</div>
	</div>
</template>
<script setup>
import {
	Breadcrumbs,
	Button,
	call,
	createDocumentResource,
	createListResource,
	createResource,
} from 'frappe-ui'
import { computed, inject, onBeforeMount, onMounted, ref } from 'vue'
import { useSidebar } from '@/stores/sidebar'
import { updateDocumentTitle } from '@/utils'

const sidebarStore = useSidebar()
const user = inject('$user')
const readyToRender = ref(false)
const iframe = ref(null)

const props = defineProps({
	courseName: {
		type: String,
		required: true,
	},
	chapterName: {
		type: String,
		required: true,
	},
})

onBeforeMount(() => {
	sidebarStore.isSidebarCollapsed = true
	setupSCORMAPI()
})

onMounted(() => {
	if (props.chapterName && !props.chapterName.includes('.html')) {
		console.log(props.chapterName)
		chapter.submit({
			chapterName: props.chapterName,
		})
	}
})

const chapter = createResource({
	url: 'lms.lms.api.get_scorm_chapter',
	makeParams(values) {
		return {
			chapter: values.chapterName,
		}
	},
	cache: ['chapter', props.chapterName],
	onSuccess(data) {
		progress.submit()
	},
})

const enrollment = createListResource({
	doctype: 'LMS Enrollment',
	fields: ['member', 'course'],
	filters: {
		course: props.courseName,
		member: user.data?.name,
	},
	auto: true,
	cache: ['enrollments', props.courseName, user.data?.name],
})

const getDataFromLMS = (key) => {
	if (key == 'cmi.core.lesson_status') {
		if (progress.data?.status == 'Complete') {
			return 'passed'
		}
		return 'incomplete'
	}
	return ''
}

const saveDataToLMS = (key, value) => {
	if (key == 'cmi.core.lesson_status' && value == 'passed') {
		saveProgress()
	}
}

const saveProgress = () => {
	call('lms.lms.doctype.course_lesson.course_lesson.save_progress', {
		lesson: chapter.data.lessons[0].lesson,
		course: props.courseName,
	})
}

const progress = createResource({
	url: 'frappe.client.get_value',
	makeParams(values) {
		return {
			doctype: 'LMS Course Progress',
			fieldname: 'status',
			filters: {
				member: user.data?.name,
				lesson: chapter.data.lessons[0].lesson,
				chapter: chapter.data.name,
				course: chapter.data?.course,
			},
		}
	},
	onSuccess(data) {
		readyToRender.value = true
	},
})

const enrollStudent = () => {
	enrollment.insert.submit(
		{
			course: props.courseName,
			member: user.data?.name,
		},
		{
			onSuccess(data) {
				window.location.reload()
			},
		}
	)
}

const setupSCORMAPI = () => {
	window.API_1484_11 = {
		Initialize: () => 'true',
		Terminate: () => 'true',
		GetValue: (key) => {
			console.log(`GET: ${key}`)
			return getDataFromLMS(key)
		},
		SetValue: (key, value) => {
			console.log(`SET: ${key} to value: ${value}`)

			saveDataToLMS(key, value)
			return 'true'
		},
		Commit: () => 'true',
		GetLastError: () => '0',
		GetErrorString: () => '',
		GetDiagnostic: () => '',
	}
	window.API = {
		LMSInitialize: () => 'true',
		LMSFinish: () => 'true',
		LMSGetValue: (key) => {
			console.log(`GET: ${key}`)
			return getDataFromLMS(key)
		},
		LMSSetValue: (key, value) => {
			console.log(`SET: ${key} to value: ${value}`)
			saveDataToLMS(key, value)
			return 'true'
		},
		LMSCommit: () => 'true',
		LMSGetLastError: () => '0',
		LMSGetErrorString: () => '',
		LMSGetDiagnostic: () => '',
	}
}

const changeInvalidPaths = () => {
	if (iframe.value) {
		const iframeDocument = iframe.value.contentDocument
		if (iframeDocument) {
			// Example: Replace all 'about://' paths in the iframe's content
			const elements = iframeDocument.querySelectorAll('[src], [href]')
			elements.forEach((el) => {
				const attr = el.hasAttribute('src') ? 'src' : 'href'
				const value = el.getAttribute(attr)

				if (value && value.startsWith('about://')) {
					const basePath = chapter.data?.parent_directory // Replace with actual logic
					const newPath = value.replace('about://', basePath)
					el.setAttribute(attr, newPath)
				}
			})
		}
	}
}

const breadcrumbs = computed(() => {
	return [
		{
			label: 'Courses',
			route: { name: 'Courses' },
		},
		{
			label: chapter.data?.course_title,
			route: { name: 'CourseDetail', params: { courseName: props.courseName } },
		},
		{
			label: chapter.data?.title,
		},
	]
})

const pageMeta = computed(() => {
	return {
		title: chapter?.doc?.title,
		description: __('This is a chapter in the course {0}').format(
			chapter?.doc?.course_title
		),
	}
})

updateDocumentTitle(pageMeta)
</script>
