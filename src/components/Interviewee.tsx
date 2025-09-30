import { Card, Upload, Typography, Space, Button, Input, Tag, message, Progress } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { RcFile } from 'antd/es/upload/interface'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { addAnswer, createCandidate, setCurrentCandidate, setCurrentIndex, setStatus, setQuestions, updateProfile, finalize } from '../store'
import { useEffect, useState } from 'react'
// import { z } from 'zod'
import type { CandidateProfile } from '../types'
import * as pdfjsLib from 'pdfjs-dist'
// @ts-ignore - vite worker import provides a Worker constructor
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min?worker'
import mammoth from 'mammoth'
import { generateQuestions, scoreAnswer, summarizeCandidate } from '../engine'

// Use workerPort with a constructed Worker instance in modern bundlers
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

// Schema kept for future validation (intentionally unused for now)
// const profileSchema = z.object({
// 	name: z.string().min(2).optional(),
// 	email: z.string().email().optional(),
// 	phone: z.string().regex(/\+?[0-9\-\s]{7,}/).optional(),
// })

function extractFields(text: string): Partial<CandidateProfile> {
	const nameMatch = text.match(/Name[:\s]+([A-Za-z ,.'-]{2,})/i)
	const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
	const phoneMatch = text.match(/(\+?\d[\d\-\s]{7,}\d)/)
	return {
		name: nameMatch?.[1]?.trim(),
		email: emailMatch?.[0]?.trim(),
		phone: phoneMatch?.[0]?.trim(),
	}
}

async function parsePdf(file: RcFile): Promise<string> {
	const arrayBuf = await file.arrayBuffer()
	const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise
	let text = ''
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i)
		const content = await page.getTextContent()
		text += content.items.map((it: any) => (it.str ?? '')).join(' ') + '\n'
	}
	return text
}

async function parseDocx(file: RcFile): Promise<string> {
	const arrayBuf = await file.arrayBuffer()
	const { value } = await mammoth.extractRawText({ arrayBuffer: arrayBuf })
	return value
}

export default function Interviewee() {
	const dispatch = useDispatch()
	const session = useSelector((s: RootState) => s.session)
	const candidates = useSelector((s: RootState) => s.candidates)
	const current = candidates.find(c => c.id === session.currentCandidateId)
	// local input state is controlled directly by Inputs bound to Redux profile

	const beforeUpload = async (file: RcFile) => {
		const isPdf = file.type === 'application/pdf'
		const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		if (!isPdf && !isDocx) {
			message.error('Please upload a PDF or DOCX resume')
			return Upload.LIST_IGNORE
		}
		try {
			const raw = isPdf ? await parsePdf(file) : await parseDocx(file)
			const fields = extractFields(raw)
			const base: CandidateProfile = {
				name: fields.name ?? '',
				email: fields.email ?? '',
				phone: fields.phone ?? '',
			}
			const action = dispatch(createCandidate(base)) as any
			const newId = action.payload?.id as string | undefined
			if (newId) {
				dispatch(setCurrentCandidate(newId))
			} else {
				const last = candidates[candidates.length - 1]
				dispatch(setCurrentCandidate(last ? last.id : candidates[0]?.id))
			}
			dispatch(setStatus('collecting_profile'))
			message.success('Resume parsed. Please confirm missing fields to begin.')
		} catch (e) {
			message.error('Failed to parse resume')
		}
		return Upload.LIST_IGNORE
	}

	const canStart = !!current && current.profile.name && current.profile.email && current.profile.phone

	const beginInterview = () => {
		if (!current) return
		dispatch(setQuestions({ candidateId: current.id, questions: generateQuestions() }))
		dispatch(setCurrentIndex(0))
		dispatch(setStatus('in_progress'))
	}

	const [answer, setAnswer] = useState('')
	const [remaining, setRemaining] = useState<number | null>(null)

	const currentQuestion = current && session.status === 'in_progress' ? current.questions[session.currentIndex] : null

	useEffect(() => {
		if (!currentQuestion) return
		setRemaining(currentQuestion.seconds)
		const interval = setInterval(() => {
			setRemaining(prev => {
				if (prev === null) return prev
				if (prev <= 1) {
					clearInterval(interval)
					if (!current) return 0
					const s = scoreAnswer(answer, currentQuestion.difficulty)
					dispatch(addAnswer({ candidateId: current.id, answer: { questionId: currentQuestion.id, answerText: answer, submittedAt: Date.now(), score: s } }))
					advance()
					return 0
				}
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(interval)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentQuestion?.id])

	const advance = () => {
		if (!current || !currentQuestion) return
		const nextIndex = session.currentIndex + 1
		if (nextIndex >= 6) {
			const scores = current.answers.map(a => a.score ?? 0)
			const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
			const summary = summarizeCandidate(current.profile.name, scores)
			dispatch(finalize({ candidateId: current.id, finalScore: avg, summary }))
			dispatch(setStatus('completed'))
			message.success('Interview completed')
		} else {
			dispatch(setCurrentIndex(nextIndex))
			setRemaining(null)
			setAnswer('')
		}
	}

	const submit = () => {
		if (!current || !currentQuestion) return
		const s = scoreAnswer(answer, currentQuestion.difficulty)
		dispatch(addAnswer({ candidateId: current.id, answer: { questionId: currentQuestion.id, answerText: answer, submittedAt: Date.now(), score: s } }))
		advance()
	}

	return (
		<Space direction="vertical" style={{ width: '100%' }}>
			<Card title="Upload Resume (PDF/DOCX)">
				<Upload.Dragger beforeUpload={beforeUpload} multiple={false} showUploadList={false}>
					<p className="ant-upload-drag-icon"><InboxOutlined /></p>
					<p>Click or drag file to this area to upload</p>
				</Upload.Dragger>
			</Card>
			{current && (
				<Card title="Profile">
					<Space direction="vertical" style={{ width: '100%' }}>
						<Input placeholder="Name" value={current.profile.name} onChange={e => dispatch(updateProfile({ candidateId: current.id, profile: { name: e.target.value } }))} />
						<Input placeholder="Email" value={current.profile.email} onChange={e => dispatch(updateProfile({ candidateId: current.id, profile: { email: e.target.value } }))} />
						<Input placeholder="Phone" value={current.profile.phone} onChange={e => dispatch(updateProfile({ candidateId: current.id, profile: { phone: e.target.value } }))} />
						<Button type="primary" disabled={!canStart} onClick={beginInterview}>Start Interview</Button>
					</Space>
				</Card>
			)}
			{currentQuestion && (
				<Card title={`Question ${session.currentIndex + 1} of 6`}>
					<Space direction="vertical" style={{ width: '100%' }}>
						<Typography.Text strong>{currentQuestion.text}</Typography.Text>
						<Progress percent={Math.max(0, Math.round(((currentQuestion.seconds - (remaining || 0)) / currentQuestion.seconds) * 100))} showInfo />
						<Input.TextArea rows={4} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer" />
						<Space>
							<Tag color={currentQuestion.difficulty === 'easy' ? 'green' : currentQuestion.difficulty === 'medium' ? 'blue' : 'red'}>{currentQuestion.difficulty.toUpperCase()}</Tag>
							<Typography.Text type={remaining && remaining <= 10 ? 'danger' : undefined}>Time left: {remaining ?? currentQuestion.seconds}s</Typography.Text>
						</Space>
						<Button type="primary" onClick={submit}>Submit</Button>
					</Space>
				</Card>
			)}
		</Space>
	)
}


