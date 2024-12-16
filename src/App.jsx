import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Pokemon from './pages/Pokemon'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pokemon />} />
      </Routes>
    </Router>
  )
}

export default App
