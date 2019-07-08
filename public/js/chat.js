const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log(`The count has been updated! The count is ${count}!`)
// })

// document.querySelector('#btn-increment').addEventListener('click', () => {
//     console.log(`Clicked`)
//     socket.emit('increment')
// })

socket.on('messageUpdate', (message) => {
    // console.log(message)
})


const $chatForm = document.querySelector('#form-chat')
const $chatInput = $chatForm.querySelector('#input-chatMessage')
const $chatButton = $chatForm.querySelector('#btn-chatSubmit')

$chatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $chatButton.setAttribute('disabled', 'disabled')

    const messageText = $chatInput.value

    if (messageText.length !== 0) {
        socket.emit('sendMessage', messageText, (error) => {
            $chatButton.removeAttribute('disabled')
            $chatInput.value = ''
            $chatInput.focus()
    
            if (error) {
                return console.log(error)
            }
    
            // console.log('Message delivered!')
        })
    } else {
        $chatButton.removeAttribute('disabled')
        $chatInput.focus()
    }
})


const $chatMessages = document.querySelector('#listing-chatMessages')
const $layerChatMessages = document.querySelector('.layer-chatMessages')
const templateChatMessages = document.querySelector('#template-chatMessages').innerHTML

const autoScroll = () => {
    // New message element
    const $newMessage = $layerChatMessages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $layerChatMessages.offsetHeight

    // Height of messages container
    const containerHeight = $layerChatMessages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $layerChatMessages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $layerChatMessages.scrollTop = $layerChatMessages.scrollHeight
    }
}

socket.on('messageUpdate', (objMessage) => {
    console.log(objMessage)
    const html = Mustache.render(templateChatMessages, {
        username: objMessage.username,
        message: objMessage.text, 
        createdAt: moment(objMessage.createdAt).format('YYYY-MM-DD h:mm:ss a')
    })
    $chatMessages.insertAdjacentHTML('beforeend', html)

    autoScroll()
    
    // chatMessages.innerHTML += "<li>" + messageText + "</li>"
})


const $btnLocation = document.querySelector('#btn-location')
const templateLocationMessages = document.querySelector('#template-locationMessage').innerHTML

$btnLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    $btnLocation.setAttribute('disabled', 'disabled')
    
    navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        socket.emit('sendLocation', { 
            latitude, 
            longitude 
        }, (locationLink) => {
            $btnLocation.removeAttribute('disabled')
            // console.log('Location shared!')
        })
    })
})


socket.on('locationMessage', (objMessage) => {
    const html = Mustache.render(templateLocationMessages, {
        username: objMessage.username, 
        locationLink: objMessage.text, 
        createdAt: moment(objMessage.createdAt).format('YYYY-MM-DD h:mm:ss a')
    })
    $chatMessages.insertAdjacentHTML('beforeend', html)

    autoScroll()
})


const templateSidebar = document.querySelector('#template-sidebar').innerHTML
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(templateSidebar, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})