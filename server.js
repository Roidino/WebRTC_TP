const WebSocker = require("ws");
const wss = new WebSocker.Server({ port: 8080});

const clients = [];

wss.on("connection", (ws) => {
    clients.push(ws);
    console.log("Client connecté : " + clients.length);

    ws.on('message', (message) => {
        clients.forEach((client) => {
            if(client !== ws && client.readyState === WebSocker.OPEN){
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        const index = clients.indexOf(ws);
        clients.splice(index, 1);
        console.log("Client déconnecté. Total : " + clients.length);
    });
});

console.log("Serveur de signalisation démarré");