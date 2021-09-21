const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var fs = require('fs');

const app = express();

const clientPath = `${__dirname}/../client`
const gameFileName = `${__dirname}/db/game.json`

app.use(express.static(clientPath));

console.log(`Serving static from ${clientPath}`)

const server = http.createServer(app);

const io = socketio(server);

function writeJson(gameJson) {
    fs.writeFileSync(gameFileName, JSON.stringify(gameJson, null, 2));
}

function readJson() {
    let data = fs.readFileSync(gameFileName);
    return JSON.parse(data);
}

io.on('connection', (sock) => {
    
    sock.on('request', () => {
        let gameJson = readJson();
        sock.emit('update', gameJson);
    })

    sock.on('write', gameJson => {
        writeJson(gameJson);
    })

    sock.on('updateAll', () => {
        let gameJson = readJson();
        sock.broadcast.emit('update', gameJson);
    })
})

server.on('error', (err) => {
    console.error('Server error:', err)
})

server.listen(8080, () => {
    console.log('start on 8080');
});