import { PlayerGender } from '../types/IntroTypes';

export interface PlayerIdCard {
  name: string;
  gender: PlayerGender;
  faceTexture: string;
  role: string;
  accessLevel: string;
  idNumber: string;
}
