import { Card, Table, Input, Space, Typography, Drawer, Descriptions, Tag, List } from 'antd'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

export default function Interviewer() {
	const candidates = useSelector((s: RootState) => s.candidates)
	const [query, setQuery] = useState('')
	const [openId, setOpenId] = useState<string | null>(null)
	const data = useMemo(() => {
		return candidates
			.map(c => ({
				key: c.id,
				name: c.profile.name || '(Unnamed)',
				email: c.profile.email,
				phone: c.profile.phone,
				score: c.finalScore ?? '-',
				createdAt: c.createdAt,
			}))
			.filter(row => [row.name, row.email, row.phone].join(' ').toLowerCase().includes(query.toLowerCase()))
			.sort((a, b) => (b.score as number) - (a.score as number))
	}, [candidates, query])

	return (
		<Space direction="vertical" style={{ width: '100%' }}>
			<Card>
				<Space style={{ width: '100%', justifyContent: 'space-between' }}>
					<Typography.Title level={4} style={{ margin: 0 }}>Candidates</Typography.Title>
					<Input.Search placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} style={{ maxWidth: 320 }} />
				</Space>
				<Table
					style={{ marginTop: 16 }}
					columns={[
						{ title: 'Name', dataIndex: 'name' },
						{ title: 'Email', dataIndex: 'email' },
						{ title: 'Phone', dataIndex: 'phone' },
						{ title: 'Score', dataIndex: 'score', sorter: (a: any, b: any) => (a.score || 0) - (b.score || 0) },
					]}
					dataSource={data}
					onRow={(row) => ({ onClick: () => setOpenId(row.key) })}
					pagination={{ pageSize: 8 }}
				/>
			</Card>
			<Drawer open={!!openId} width={720} onClose={() => setOpenId(null)} title="Candidate Detail">
				{openId && (() => {
					const cand = candidates.find(c => c.id === openId)
					if (!cand) return null
					return (
						<Space direction="vertical" style={{ width: '100%' }}>
							<Descriptions bordered column={1} size="small">
								<Descriptions.Item label="Name">{cand.profile.name || '(Unnamed)'}</Descriptions.Item>
								<Descriptions.Item label="Email">{cand.profile.email}</Descriptions.Item>
								<Descriptions.Item label="Phone">{cand.profile.phone}</Descriptions.Item>
								<Descriptions.Item label="Final Score">{cand.finalScore ?? '-'}</Descriptions.Item>
								<Descriptions.Item label="Summary">{cand.summary ?? '-'}</Descriptions.Item>
							</Descriptions>
							<Typography.Title level={5}>Q&A</Typography.Title>
							<List
								dataSource={cand.questions}
								renderItem={(q, idx) => {
									const ans = cand.answers.find(a => a.questionId === q.id)
									return (
										<List.Item>
											<List.Item.Meta
												title={<Space><span>{`Q${idx + 1}: ${q.text}`}</span><Tag color={q.difficulty === 'easy' ? 'green' : q.difficulty === 'medium' ? 'blue' : 'red'}>{q.difficulty.toUpperCase()}</Tag></Space>}
												description={<>
													<Typography.Paragraph><strong>Answer:</strong> {ans?.answerText || '-'}</Typography.Paragraph>
													<Typography.Text><strong>Score:</strong> {ans?.score ?? '-'}</Typography.Text>
												</>}
											/>
										</List.Item>
									)
								}}
							/>
						</Space>
					)
				})()}
			</Drawer>
		</Space>
	)
}


