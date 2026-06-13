import { useQuizStore } from './store/quizStore.js'
import StartScreen from './components/StartScreen.jsx'
import QuizView from './components/QuizView.jsx'
import Results from './components/Results.jsx'
import './App.css'

export default function App() {
  const status = useQuizStore((s) => s.status)

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">{'{ }'}</span>
          <span className="brand-name">
            CUDA<span className="brand-accent">Quiz</span>
          </span>
        </div>
        <span className="brand-tag mono">basics → kernels → distributed training</span>
      </header>

      <main className="app-main">
        {status === 'idle' && <StartScreen />}
        {status === 'active' && <QuizView />}
        {status === 'finished' && <Results />}
      </main>

      <footer className="app-footer mono">
        Honor system · no lookups · adaptive difficulty
      </footer>
    </div>
  )
}
