export type PlayerGender = "male" | "female" | "nonbinary";
export type PlayerCareer =
  | "recruiter"
  | "manager"
  | "developer"
  | "designer"
  | "analyst"
  | "entrepreneur";

export interface IntroStep {
    id: number;
    text: string;
    type?: 'dialog' | 'name-input' | 'gender-select' | 'career-select' | 'idcard-show';
    action?: () => void; // Ação opcional para o passo
}

export interface PlayerData {
    name: string;
    gender: PlayerGender;
    career: PlayerCareer;
    faceTexture: string;
}

export interface GenderOption {
  key: PlayerGender;
  label: string;
  color: number;
  icon: string;
  sprite: string;
  face: string;
  animation: string;
}

export interface IntroConfig {
  colors: {
    background: number;
    textBox: number;
    text: number;
    highlight: number;
    budaGlow: number;
    male: number;
    female: number;
    nonbinary: number;
    error: number;
    success: number;
  };
  fonts: {
    title: {
      fontFamily: string;
      fontSize: string;
    };
    dialog: {
      fontFamily: string;
      fontSize: string;
    };
    input: {
      fontFamily: string;
      fontSize: string;
    };
    small: {
      fontFamily: string;
      fontSize: string;
    };
  };
}
