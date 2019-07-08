const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection!')

    // socket.emit('messageUpdate', generateMessage('Welcome!'))
    // socket.broadcast.emit('message', 'A new user has joined the chat!')

    // socket.on('join', ({ username, room }, cb) => {
    socket.on('join', (options, cb) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        
        if (error) {
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('messageUpdate', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('messageUpdate', generateMessage('Admin', `${user.username} has joined the chat!`))

        io.to(user.room).emit('roomData', {
            room: user.room, 
            users: getUsersInRoom(user.room)
        })

        cb()

        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage', (messageText, cb) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(messageText)) {
            return cb('Profanity is not allowed!')
        }

        io.to(user.room).emit('messageUpdate', generateMessage(user.username, messageText))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('messageUpdate', generateMessage('Admin', `${user.username} has left the chat! :(`))

            io.to(user.room).emit('roomData', {
                room: user.room, 
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (coords, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps/?q=${coords.latitude},${coords.longitude}`))

        cb(`https://www.google.com/maps/?q=${coords.latitude},${coords.longitude}`)
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})