class Driver {
    constructor(name, driverId) {
        // Use the provided driverId or generate a random value
        this.id = driverId
        this.name = name;
        this.in_ride = false;
        this.driverId = this.id; // Set this.driverId to the same value as this.id
    }
    acceptOrder(order) {
        console.log(`${this.name} acceepts ride from ${order.id}`)
        order.chooseDriver(this)
    }

    rejectOrder(order) {
        console.log(`${this.name} rejects ride from ${order.id}`)
      
    }
}



module.exports = Driver;