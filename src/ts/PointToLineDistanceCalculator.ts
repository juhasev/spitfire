export default class PointToLineDistanceCalculator {

    protected distance: number;

    /**
     * Calculates given x,y point distance (plane) to a given line (bullet firing path)
     * This is used to determine damage to the plane
     *
     * @param x
     * @param y
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    constructor(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {

        let A = x - x1;
        let B = y - y1;
        let C = x2 - x1;
        let D = y2 - y1;

        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) //in case of 0 length line
            param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        let dx = x - xx;
        let dy = y - yy;

        this.distance = Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get new X coordinate
     */
    public getDistance() {

        return this.distance;
    }
}