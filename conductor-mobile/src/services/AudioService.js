import { createAudioPlayer } from 'expo-audio';

const successChime = require('../assets/success_chime.ogg');

export const playVerificationChime = async () => {
  try {
    const player = createAudioPlayer(successChime);
    player.seekTo(0);
    player.play();
    setTimeout(() => {
      player.release();
    }, 3000);
  } catch (error) {
    console.log('Failed to play verification chime', error);
  }
};
