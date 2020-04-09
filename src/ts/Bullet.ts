export default class Bullet {

    private speed: number;
    private maxDamage: number;

    /**
     * Bullet constructor
     *
     * @param type
     */
    constructor(type: string) {

        this.speed = 10;
        this.maxDamage = 20;
    }
}