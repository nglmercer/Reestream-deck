import electronLogo from './assets/electron.svg'
import TcpIndicator from './components/TcpIndicator'
import MainScreen from './tabcontent'


function App() {
  const ipcHandle = () => window.api.send('toMain', 'Hello from Renderer')
  
  return (
    <>
      <MainScreen />
    </>
  )
}


export default App
