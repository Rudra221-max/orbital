export const STATION_MODEL = '/models/space_center.glb';
export const GLOVE_MODEL = '/models/Astronaut_Glove.glb';

export const CENTER_SIZE = 60;      // space center ka size
export const NPC_SIZE = 1.8;        // astronaut NPC ki height
export const PANEL_COUNT = 5;       // kitni panels repair karni hain
export const PANEL_DISTANCE = 8;    // station se panels kitni door
export const START_OXYGEN = 300;    // seconds
export const MOVE_SPEED = 14;
export const MOUSE_SENS = 0.0022;
export const REPAIR_TIME = 9;    // seconds rukna padega
export const REPAIR_RANGE = 4;   // crack se kitni door tak repair chalega (metres)
export const CRACK_SIZE = 3.5;   // crack ka size

// Jetpack fuel (percent per second)
export const FUEL_BURN = 8;
export const FUEL_REGEN = 4;

// Hath ki settings. Tune mode (T key) se sahi values mil jayengi
export const HAND = {
  size: 0.4,                // glove ki lambai
  pos: [0.3, -0.3, -0.6],  // x = right, y = neeche, z = aage
  rot: [0.35, 0.25, 0],         // radians
};