import './App.css'
import { Layout, Tabs, Modal, Switch, ConfigProvider, theme as antdTheme } from 'antd'
import { useSelector } from 'react-redux'
import type { RootState } from './store'
import Interviewee from './components/Interviewee'
import Interviewer from './components/Interviewer.tsx'
import { useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { normalizeScores, setWelcomeBack, setTheme } from './store'
import { useEffect } from 'react'

function App() {
  const dispatch = useDispatch()
  const welcomeBackNeeded = useSelector((s: RootState) => s.session.welcomeBackNeeded)
  const [activeKey, setActiveKey] = useState('interviewee')
  const theme = useSelector((s: RootState) => s.session.theme)
  const interviewStatus = useSelector((s: RootState) => s.session.status)
  const confettiRef = useRef<HTMLDivElement | null>(null)
  const themeToken = useMemo(() => ({
    token: {
      colorPrimary: theme === 'dark' ? '#7F7CFF' : '#7F7CFF',
      borderRadius: 10,
    },
  }), [theme])
  useEffect(() => {
    // If there is any ongoing session, show welcome back
    const persisted = localStorage.getItem('persist:root')
    if (persisted) {
      dispatch(setWelcomeBack(true))
    }
    // Normalize any legacy finalScore==4 to null
    dispatch(normalizeScores())
  }, [dispatch])

  useEffect(() => {
    if (interviewStatus === 'completed') {
      launchConfetti()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStatus])

  const launchConfetti = () => {
    const root = confettiRef.current
    if (!root) return
    root.innerHTML = ''
    const count = 40
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = Math.random() * 100 + 'vw'
      el.style.top = -Math.random() * 20 + 'vh'
      el.style.background = `linear-gradient(135deg, hsl(${Math.random()*360},85%,65%), #00D4FF)`
      el.style.animationDelay = (Math.random() * 300) + 'ms'
      root.appendChild(el)
    }
    setTimeout(() => { if (root) root.innerHTML = '' }, 1800)
  }

  return (
    <ConfigProvider theme={{ algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm, ...themeToken }}>
    <Layout style={{ minHeight: '100vh' }}>
      <div ref={confettiRef} className="confetti-container" />
      <Layout.Header className="app-header-gradient">AI Interview Assistant</Layout.Header>
      <Layout.Content style={{ padding: 16 }}>
        <div className="container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <span className="theme-toggle-label" style={{ color: theme === 'dark' ? '#ddd' : '#333', marginRight: 8 }}>
            <span className={`theme-icon ${theme === 'dark' ? 'moon' : 'sun'}`} style={{ transform: `rotate(${theme === 'dark' ? 20 : 0}deg)` }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
            Theme
          </span>
          <Switch
            checked={theme === 'dark'}
            checkedChildren="Dark"
            unCheckedChildren="Light"
            onChange={(checked) => dispatch(setTheme(checked ? 'dark' : 'light'))}
          />
        </div>
        <Tabs
          className="tabs-vibrant"
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
