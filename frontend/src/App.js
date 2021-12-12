import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from"@material-ui/core/TextField"
import AssignmentIcon from '@material-ui/icons/Assignment';
import LocalPhoneIcon from '@material-ui/icons/LocalPhone';
import React, { useState, useRef, useEffect} from "react"
import CopyToClipboard from 'react-copy-to-clipboard'
import Peer from "simple-peer"
import io from "socket.io-client"
import './App.css';

const socket = io.connect("http://localhost:5000")

function App() {
  
  const [ me, setMe] = useState("")
  const [ stream, setStream] = useState("")
  const [ receivingCall, setReceivingCall ] = useState("")
  const [ caller, setCaller ] = useState("")
  const [ callerSignal, setCallerSignal ] = useState("")
  const [ callAccepted, setCallAccepted ] = useState("")
  const [ idToCall, setIdToCall ] = useState("")
  const [ callEnded, setCallEnded ] = useState("")
  const [ name, setName ] = useState("")

  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({video : true, audio : true}).then((stream) => {
      setStream(stream)
      myVideo.current.srcObject = stream
    })

    socket.on("me", (id) => {
      setMe(id)
    })

    socket.on("callUser", (data) => {
      setReceivingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })

    
  }, [])

  const callUser = (id) => {

    const peer = new Peer({
      initiator: true, 
      trickle: false, 
      stream: stream
    })

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id, 
        signal: data,
        from: me,
        name: name
      })
    })

    peer.on("stream", (data) => {
      userVideo.current.srcObject = stream
    })

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer

  }

    const answerCall = () => {
      setCallAccepted(true)
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      })

      peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to : caller})
      })

      peer.on("stream", (data) => {
        userVideo.current.srcObject = stream
      })

      peer.signal(callerSignal) 
      connectionRef.current = peer
    
    }


  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }

  return (
    <div>
      <h1 style={{ textAlign: "center", color: "fff" }}>VideoApp</h1>
      <div className="container">
        <div className="video-container">
          <div className="video">
            {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "380px"}} />}
          </div>
          <div container="video">
            {callAccepted && !callEnded ? 
            <video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} /> : null }
          </div>
        </div>
        <div className="myId">
          <TextField
            id="filled-basic"
            label="Name"
            varient="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{marginBottom: "20px"}}
          />
          <CopyToClipboard text={me} style={{ marginBottom: "2rem"}}>
            <Button varient="contained" color="primary" startIcon={<AssignmentIcon fontSize="large"/>}>
              Copy ID
            </Button>
          </CopyToClipboard>
          <TextField 
            id="filled-basic"
            label="ID to Call"
            varient="filled"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />
          <div className="call-button">
              {callAccepted && !callEnded ? (
                <Button varient="contained" color="secondary" onClick={leaveCall}>
                  End Call
                </Button>
              ) : (
                <IconButton color="primary" onClick={() => callUser(idToCall)} area-label="call">
                  <LocalPhoneIcon fontSize="large" />
                </IconButton>
              )}
              {idToCall}
          </div>
        </div>
        {receivingCall && !callAccepted ? (
          <div className="caller">
            <h1>{name} is calling...</h1>
            <Button varient="contained" color="primary" onClick={answerCall}>
              Answer
            </Button>
          </div>
        ): null}
      </div>
    </div>
  );
}

export default App;
