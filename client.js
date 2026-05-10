const videolocal = document.getElementById("videolocal");
const videodistant = document.getElementById("videodistant");
const btncamera = document.getElementById("btncamera");
const btnappel = document.getElementById("btnappel");
const btnraccroche = document.getElementById("btnraccroche");

const ws = new WebSocket("ws://localhost:8080");

let localStream;
let peerConnection

const config = {
    iceServers: [{urls: "stun:stun.l.google.com:19320"}]
};


ws.onmessage = async (event) => {
    const text = event.data instanceof Blob ? await event.data.text() : event.data;

    const message = JSON.parse(text);

    if(message.type === "offer") {
        console.log("Offre recue");
        await handleOffer(message);
    } else if(message.type === "answer") {
        console.log("Reponse recu");
        await peerConnection.setRemoteDescription(message);
    } else if(message.type === "ice") {
        console.log("Candidat ICE recu");
        await peerConnection.addIceCandidate(message.candidate);
    }
};


btncamera.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    videolocal.srcObject = localStream;

    btncamera.disabled = true;
    btnappel.disabled = false;
    console.log("Camera allumer");
};

btnappel.onclick = async () => {
    createPeerConnection();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify(offer));

    btnappel.disabled = true;
    btnraccroche.disabled = false;
    console.log("Offre envoyer");
};

btnraccroche.onclick = () => {
  peerConnection.close();
  videodistant.srcObject = null;

  btnappel.disabled   = false;
  btnraccroche.disabled = true;
  console.log('Appel terminé');
};

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  // Quand un candidat ICE est trouvé, on l'envoie à l'autre pair
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: 'ice', candidate: event.candidate }));
    }
  };

  // Quand on reçoit le flux distant, on l'affiche
  peerConnection.ontrack = (event) => {
    videodistant.srcObject = event.streams[0];
    console.log('Flux distant reçu !');
  };
}


async function handleOffer(offer) {
  createPeerConnection();

  // Ajoute les pistes locales
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  await peerConnection.setRemoteDescription(offer);

  // Crée et envoie la réponse SDP
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  ws.send(JSON.stringify(answer));

  btnappel.disabled   = true;
  btnraccroche.disabled = false;
  console.log('Réponse envoyée');
}


