export default class DistanceCalculator {

    protected distance: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {

        const xDistance = Math.abs(x1 - x2);
        const yDistance = Math.abs(y1 - y2);

        this.distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
    }

    /**
     * Get new X coordinate
     */
    public getDistance() {
        return this.distance;
    }
}