export type PlayerGender = "male" | "female" | "nonbinary";

export interface IntroStep {
  id: number;
  text: string;
  action?: () => void;
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
