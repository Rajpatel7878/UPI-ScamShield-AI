import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppProvider.jsx'
import { AppRoutes } from './routes/AppRoutes.jsx'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
