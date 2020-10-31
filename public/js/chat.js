const socket = io()
//Elements: 
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.getElementById('location')
//render messages
const $messages = document.querySelector("#messages")
const $locationMsg = document.querySelector('#locationMsg')
const $sidebar = document.querySelector('#sidebar')
//templates
const $messageTemplate = document.querySelector("#message-template").innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//options
const { username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})
const autoscroll = ()=>{
    //new message element
    const $newMessage = $messages.lastElementChild

    //height of the newMessage
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffeset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffeset){
        $messages.scrollTop = $messages.scrollHeight
    }
    
}



socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format("HH:mm")
        //look at moment.js (display) webpage
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('locationMessage',(message)=>{
    // console.log(url)
    const html = Mustache.render($locationTemplate,{
        username: message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format("HH:mm")
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
   const html = Mustache.render($sidebarTemplate, {
       room,
       users
   })
  $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()  //for not refreshing the browser - e(event argument)
    // const message = document.querySelector('input').value
    
    $messageFormButton.setAttribute('disabled', 'disabled')

    //target means the form (event), message is the element's name (look html)
    const message = e.target.elements.message.value
    //the function if for acknowledgement
    socket.emit('sendMessage', message, (error) => {
        
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=""
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)
        socket.emit('sendLocation',
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, () => {
               console.log('Location shared')

               $locationButton.removeAttribute('disabled')
            })
    })
})

socket.emit('join', {username, room},(error)=>{
    if (error){
        alert(error)
        location.href = '/'
    }

})
