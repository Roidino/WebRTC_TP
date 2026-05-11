const WebSocker = require("ws");
const http = require('http');
const fs = require('fs');
const path = require('path');

// Serveur HTTP pour servir les fichiers statiques
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = ext === '.js' ? 'application/javascript' : 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Fichier introuvable');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

// Serveur WebSocket sur le même serveur HTTP
const wss = new WebSocker.Server({ server });

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

server.listen(8080, () => {
  console.log('Serveur démarré sur http://localhost:8080');
});