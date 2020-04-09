export default class PositionCalculator {

    protected x:number;
    protected y:number;

    /**
     * Calculate planes next position given current x,y,speed and rotation
     *
     * @param currentX
     * @param currentY
     * @param speed
     * @param rotation
     */
    constructor(currentX:number, currentY:number, speed:number, rotation:number) {

        let radians = this.toRadians(rotation);
        let xDistance = Math.round(Math.cos(radians) * speed);
        let yDistance = Math.round(Math.sin(radians) * speed);

        this.x = currentX + xDistance;
        this.y = currentY + yDistance;
    }

    /**
     * Get new X coordinate
     */
    public getNewX()
    {
        return this.x;
    }

    /**
     * Get new Y coordinate
     */
    public getNewY()
    {
        return this.y;
    }

    /**
     * Convert to radians
     *
     * @param degrees
     */
    private toRadians(degrees: number)
    {
        return degrees * (Math.PI/180);
    }
}