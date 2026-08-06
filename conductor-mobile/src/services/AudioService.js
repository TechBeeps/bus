// src/services/AudioService.js
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

const successChime = require('../assets/success_chime.mp3');

export const playVerificationChime = () => {
  const chime = new Sound(successChime, (error) => {
    if (error) {
      console.log('Failed to load the sound', error);
      return;
    }
    chime.play((success) => {
      if (!success) {
        console.log('Playback failed due to audio decoding errors');
      }
      chime.release();
    });
  });
};
