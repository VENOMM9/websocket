const Order = require('./order');

class Sender {
    constructor(name) {
        this.id = Math.floor(Math.random() * 10000).toString();
        this.name = name;
        this.senderId = this.id;
    }

    sendRequest(location, destination, price, socket) {
        const order = new Order({ location, destination, price, sender: this, orderId: this.senderId });
        console.log(`${this.name} is requesting a ride with order ${order.id}`);
        console.log('Order details:', order);

        global.senderId = this.id;

        socket.emit('sendRequest', { order, driver: { id: this.senderId, name: this.name } });

        return order;
    }
}

module.exports = Sender;
