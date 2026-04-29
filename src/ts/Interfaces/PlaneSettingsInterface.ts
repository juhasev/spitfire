export default interface PlaneSettingsInterface {
    speed: number;
    health: number,
    directionIndex: number,
    directionDegrees: number,
    width: number,
    height: number,
    scale: number,
    x: number,
    y: number,
    keyFire: string,
    keyLeft: string,
    keyRight: string,
    /**
     * Key that launches a missile. Matched against either KeyboardEvent.key
     * or KeyboardEvent.code, so values like "ShiftLeft"/"ShiftRight" can
     * distinguish the two physical Shift keys.
     */
    keyMissile: string
}
