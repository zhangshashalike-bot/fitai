import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MealAnalyzer from './pages/MealAnalyzer'
import WorkoutPlanner from './pages/WorkoutPlanner'
import PoseCoach from './pages/PoseCoach'
import AIChat from './pages/AIChat'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="meals" element={<MealAnalyzer />} />
          <Route path="workout" element={<WorkoutPlanner />} />
          <Route path="pose" element={<PoseCoach />} />
          <Route path="chat" element={<AIChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
