const express = require('express');
const http = require('http');
const app = express();


const { Server } = require('socket.io');
const AppDashboard = require('./appDashboard');

const appDashboard = new AppDashboard();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

   
    appDashboard.joinSession(socket);

const driverSocket = appDashboard.getDriverSocket(socket.id);
    const driver = driverSocket ? driverSocket.user : null;
    
    
if (driver && driver.id) {
} else {
    console.error('Driver information not found for the socket.');
}



   socket.on('sendRequest', (order) => {
    console.log('Currently requesting order', order);

    if (order && order.driver && order.driver.id) {
        appDashboard.sendRequest(order);

        const driverSocket = appDashboard.getDriverSocket(order.driver.id);


        if (driverSocket) {
            driverSocket.emit('sendRequest', {
                order: {
                    location: order.location,
                    destination: order.destination,
                    price: order.price,
                    sender: order.sender,
                    driver: order.driver,
                }
            });

        } else {
            console.error(`Socket not found for driver ${order.driver.id}`);
        }
    } else {
        console.error('Invalid order format - driver information not provided:', order);
    }
});
   
socket.on('orderPlaced', (data) => {
    console.log('Order placed on the server:', data.order);

    // Forward the order details to all drivers (you can customize this logic)
    io.emit('orderPlaced', { order: data.order });
});

socket.on('acceptOrder', (order) => {
    const acceptedOrder = appDashboard.acceptOrder(order);
    if (acceptedOrder) {
        const orderDetails = getOrderDetails(acceptedOrder);
        io.to(order.sender.id).emit('orderAccepted', { order: orderDetails });
    } else {
        console.error('Order acceptance failed');
    }
});
    socket.on('rejectOrder', (order) => {
        const rejectedOrder = appDashboard.rejectOrder(order);
        if (rejectedOrder) {
            const orderDetails = getOrderDetails(rejectedOrder);
            io.to(order.sender.id).emit('orderRejected', { order: orderDetails });
        } else {
            console.error('Order rejection failed');
        }
    });
   
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

   

    
});

const getOrderDetails = (order) => {
    return {
        location: order.location,
        destination: order.destination,
        price: order.price,
        sender: order.sender,
        
    };
};

const getDriverDetails = (driver) => {
    return {
        name: driver.name,
        id: driver.id,
        
    };
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

app.get('/driver', (req, res) => {
    res.sendFile(__dirname + '/driver.html');
});

app.get('/sender', (req, res) => {
    res.sendFile(__dirname + '/sender.html');
});

const port = process.env.port || 3400;

server.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`);
});
