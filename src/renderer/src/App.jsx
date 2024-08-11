import electronLogo from './assets/electron.svg'
import TcpIndicator from './components/TcpIndicator'
import datajson from './assets/datajson/keyboard.json'
import MainScreen from './tabcontent'


function App() {
  console.log(datajson) 
  const ipcHandle = () => window.api.send('toMain', 'Hello from Renderer')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <MainScreen />
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action"></div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>

          <TcpIndicator />
        </div>
      </div>
    </>
  )
}


export default App
