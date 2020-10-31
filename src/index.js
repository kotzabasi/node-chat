const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
//bad words
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app)
//implement socket to our server:
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
//configure the server
app.use(express.static(publicDirectoryPath))
const { generateMessage, generateLocationMessage } = require('../src/utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('../src/utils/users')


//socket is an object and contains information about the connection - we can use methods on socket to communicate with client
io.on('connection', (socket) => {     // 2 arguments: event (connection) and function to run
    console.log('New WebSocket connection')

    // socket.emit('message', generateMessage('Welcome to chatroom'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined the room'))

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin',`Welcome to ${room}`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined the room`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            // return callback('Profanity is not allowed')
            socket.emit('message', generateMessage('Admin', 'Profanity is not allowed'))
            return callback()
        }
        io.to(user.room).emit('message', generateMessage(user.username,message))
        callback()
    })


    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left the room `))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up and running on port ${port}`)

})