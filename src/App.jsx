import { ThemeProvider } from './context/ThemeContext'
import Layout from './layouts/Layout'

function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  )
}

export default App