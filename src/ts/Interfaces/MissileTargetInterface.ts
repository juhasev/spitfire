/**
 * Minimal target contract a Missile needs to home in on something.
 * Kept narrow so Missile does not have to import Plane (avoids
 * circular dependencies).
 */
export default interface MissileTargetInterface {
    getX(): number;
    getY(): number;
    hasCrashed(): boolean;
}
