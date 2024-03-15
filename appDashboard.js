const Driver = require('./driver');
const Sender = require('./sender');
const Order = require('./order');

class AppDashboard {
    constructor() {
        this.orders = [];
        this.senders = [];
        this.drivers = [];
        this.socketUserMap = new Map();
    }

    getDriverSocket(driverId) {
        return this.socketUserMap.get(driverId);
    }

    joinSession(socket) {
        const { name, id, user_type } = socket.handshake.query;
        if (user_type == 'driver') {
            const driver = this.drivers.find(driver => driver.id === id);
            console.log('Received user type:', user_type);

            if (driver) {
                socket.driverId = driver.id;

                this.assignSocket({ socket, user: driver});
                return;
            } else {
                this.createUser({ name, socket, user_type });
            }

        } else if (user_type == 'sender') {
            const sender = this.senders.find(sender => sender.id === id);
            if (sender) {
                this.assignSocket({ socket, user: sender});
                return;
            } else {
                this.createUser({ name, socket, user_type });
            }
        }
    }

    assignSocket({ socket, user }) {
        console.log('Assigning socket to user', user.name);
        if (user instanceof Driver) {
            this.socketUserMap.set(user.id, socket);
            console.log(`Socket assigned successfully for driver ${user.id}`);
        }
    }

    sendEvent({ socket, data, eventName }) {
        socket.emit(eventName, data);
    }

    createUser({ name, socket, user_type }) {
        if (user_type === 'driver') {
            const driver = new Driver(name);
            driver.driverId = socket.driverId; // Set driverId from socket

            this.drivers.push(driver);
            this.assignSocket({ socket, user: driver, user_type });
            this.sendEvent({ socket, data: { driver }, eventName: 'driverCreated' });
    
            console.log('Driver created', this.drivers);
            return;
    
        } else if (user_type === 'sender') {
            // Check if sender with the same ID already exists
            const existingSender = this.senders.find(sender => sender.name === name);
            
            if (existingSender) {
                this.assignSocket({ socket, user: existingSender, user_type });
                console.log('Existing Sender assigned to socket', existingSender);
            } else {
                const sender = new Sender(name);
                this.senders.push(sender);
                this.assignSocket({ socket, user: sender, user_type });
                this.sendEvent({ socket, data: { sender }, eventName: 'senderCreated' });
                console.log('Sender created', this.senders);
            }
            return;
    
        } else {
            throw new Error('Invalid user type');
        }
    }
    

    sendRequest({ location, destination, price, sender, driver, orderId }) {
        console.log('Requesting order', { location, destination, price, sender, driver, orderId });
    
        // Check if sender and driver information are provided
        if (sender && sender.id && driver && driver.id) {
            const senderObj = this.senders.find(s => s.id === sender.id);
            console.log(senderObj)
    
            // Check if senderObj exists
            if (senderObj) {
                const order = new Order({ location, destination, price, sender: senderObj, driver, orderId });
    
                // Emit event to the sender
                const senderSocket = this.socketUserMap.get(senderObj.id);
                if (senderSocket) {
                    this.sendEvent({
                        socket: senderSocket,
                        data: { order, sender: senderObj },
                        eventName: 'orderPlaced',
                    });
                }
    
                // Emit event to all drivers
                for (const driver of this.drivers) {
                    if (driver.in_ride) continue;
    
                    const driverSocket = this.socketUserMap.get(driver.id);
                    if (!driverSocket) {
                        console.error(`Socket not found for driver ${driver.id}`);
                        continue;
                    }

                    const order = new Order({ location, destination, price, sender: senderObj, driver, orderId });

                    this.orders.push(order);
        
                    this.sendEvent({
                        socket: driverSocket,
                        data: { order, sender: senderObj },
                        eventName: 'orderPlaced',
                    });
                }
                console.log('Order has been placed', order);
                return order;
            } else {
                console.error('Sender not found for id:', sender.id);
                // You might want to emit an error event or handle this situation appropriately
            }
        } else {
            console.error('Invalid order format - sender or driver information not provided:', { location, destination, price, sender, driver, orderId });
            // You might want to emit an error event or handle this situation appropriately
        }
    }
    

    acceptOrder(order) {
        const { id, driver_id } = order;
        const driver = this.drivers.find(driver => driver.id === driver_id);
        const order_ = this.orders.find(order => order.id === id);
    
        // Check if sender information is provided
        if (order_.sender && order_.sender.id) {
            const sender = this.senders.find(sender => sender.id === order_.sender.id);
            console.log('Pairing driver', { order_, driver, sender });
    
            order_.pairDriver(driver);
    
            const senderSocket = this.socketUserMap.get(sender.id);
            senderSocket.emit('driver paired successfully', { order: order_ });
    
            const driverSocket = this.socketUserMap.get(driver.id);
            driverSocket.emit('driver paired successfully', { order: order_ });
        } else {
            console.error('Invalid order format - sender information not provided:', order_);
        }
    }

    rejectOrder(order) {
        const { id, driver_id } = order;
        const driver = this.drivers.find(driver => driver.id === driver_id);
        const order_ = this.orders.find(order => order.id === id);
        const sender = this.senders.find(sender => sender.id === order_.sender.id);

        console.log('Pairing unsuccessful', { order_, driver, sender });

        const driverSocket = this.socketUserMap.get(driver.id);
        driverSocket.emit('driver paired successfully', { order: order_ });
    }
}

module.exports = AppDashboard;
