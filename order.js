class Order {
    constructor({ location, destination, price, sender, orderId  }) {
        this.id = Math.floor(Math.random() * 10000).toString();
        this.current_location = location;
        this.destination = destination;
        this.status = 'pending';
        this.price = price;
        this.sender = sender;
        this.driver = null;
        this.orderId = orderId;
    }

    assignDriver(driver) {
        console.log(`Order ${this.id} is assigned to ${driver.name}`);
        this.driver = driver;
    }
}

module.exports = Order;