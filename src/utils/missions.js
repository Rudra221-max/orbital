import { STATION_MODEL, CENTER_SIZE } from './config.js';

export const ASTRONAUT_MODEL = '/models/astronaut.glb';

// Har mission ki poori settings yahin hain. Naya mission add karna = yahan ek object + ek module.
export const MISSIONS = [
  {
    id: 'crack',
    type: 'crack',                    // modules/Spacewalk.js
    name: 'Crack Repair',
    brief: 'Station ki body par 5 cracks hain. Har crack ke paas ruk kar 9 second repair karo.',
    oxygen: 300,
    quiz: 'crack',
    place: { model: STATION_MODEL, size: CENTER_SIZE, npc: true },
  },
  {
    id: 'debris',
    type: 'debris',                   // modules/Debris.js
    name: 'Debris Cleanup',
    brief: 'OSIRIS-REx ke aas-paas khatarnak kachra tair raha hai. Saare tukde jetpack se pakdo. Fuel ka dhyan rakho!',
    oxygen: 240,
    quiz: 'debris',
    debrisCount: 12,
    pickRange: 3,
    place: { model: '/models/osiris_rex.glb', size: 40 },
  },
  {
    id: 'airlock',
    type: 'airlock',                  // modules/Airlock.js
    name: 'Return to Airlock',
    brief: 'Emergency! Oxygen bahut kam hai. ICESat-2 ke peeche wale airlock tak pahucho aur andar 5 second ruko.',
    oxygen: 75,
    quiz: 'airlock',
    enterTime: 5,
    enterRange: 3.5,
    airlockDistance: 55,              // place.radius se kitni door airlock rakhna hai
    place: { model: '/models/icesat2.glb', size: 36 },
  },
];
