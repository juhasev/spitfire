export default class Greeter {

    public greeting: string;

    constructor(message: string) {
        this.greeting = message;
    }

    greet() {
        console.log(this.greeting);
    }
}