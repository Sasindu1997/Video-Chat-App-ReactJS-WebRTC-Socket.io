import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from"@mui/material/TextField"
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import React, { useState, useRef, useEffect} from "react"
import copyToClipboard from 'react-copy-to-clipboard'
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

  }, [])

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }

  return (
    <div className="App">
      
    </div>
  );
}

export default App;
