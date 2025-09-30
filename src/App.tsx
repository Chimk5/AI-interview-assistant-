import './App.css'
import { Layout, Tabs, Modal, Switch, ConfigProvider, theme as antdTheme } from 'antd'
import { useSelector } from 'react-redux'
import type { RootState } from './store'
import Interviewee from './components/Interviewee'
import Interviewer from './components/Interviewer.tsx'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setWelcomeBack, setTheme } from './store'
import { useEffect } from 'react'

function App() {
  const dispatch = useDispatch()
  const welcomeBackNeeded = useSelector((s: RootState) => s.session.welcomeBackNeeded)
  const [activeKey, setActiveKey] = useState('interviewee')
  const theme = useSelector((s: RootState) => s.session.theme)
  useEffect(() => {
    // If there is any ongoing session, show welcome back
    const persisted = localStorage.getItem('persist:root')
    if (persisted) {
      dispatch(setWelcomeBack(true))
    }
  }, [dispatch])

  return (
    <ConfigProvider theme={{ algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ color: 'white', fontWeight: 600 }}>AI Interview Assistant</Layout.Header>
      <Layout.Content style={{ padding: 16 }}>
        <div className="container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <span style={{ color: theme === 'dark' ? '#ddd' : '#333', marginRight: 8 }}>Theme</span>
          <Switch
            checked={theme === 'dark'}
            checkedChildren="Dark"
            unCheckedChildren="Light"
            onChange={(checked) => dispatch(setTheme(checked ? 'dark' : 'light'))}
          />
        </div>
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            { key: 'interviewee', label: 'Interviewee', children: <Interviewee /> },
            { key: 'interviewer', label: 'Interviewer', children: <Interviewer /> },
          ]}
        />
        </div>
      </Layout.Content>
      <Modal
        title="Welcome Back"
        open={welcomeBackNeeded}
        onOk={() => dispatch(setWelcomeBack(false))}
        onCancel={() => dispatch(setWelcomeBack(false))}
      >
        Your previous session is restored. Continue your interview where you left off.
      </Modal>
    </Layout>
    </ConfigProvider>
  )
}

export default App
