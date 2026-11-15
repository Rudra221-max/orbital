import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
// Offline chalana ho toh upar wali line hata ke yeh use karo (public/draco folder chahiye):
// draco.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

// Fail ya timeout par null deta hai (game crash/atkta nahi), error Console mein dikhta hai
export function loadModel(url, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error('LOAD TIMEOUT:', url);
      resolve(null);
    }, timeoutMs);

    loader.load(
      url,
      (gltf) => { clearTimeout(timer); resolve(gltf); },
      undefined,
      (err) => { clearTimeout(timer); console.error('LOAD FAIL:', url, err); resolve(null); }
    );
  });
}