class SpeechService {
  private isAvailable: boolean;
  private isMuted: boolean = false;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('georoute_voice_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('georoute_voice_muted', String(muted));
    }
    if (muted && this.isAvailable) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public speakInstruction(text: string, isArabic: boolean = true) {
    if (!this.isAvailable || this.isMuted || !text.trim()) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const targetLang = isArabic ? 'ar' : 'en';
      utterance.lang = isArabic ? 'ar-SA' : 'en-US';

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(targetLang)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error or not supported:', e);
    }
  }

  public cancel() {
    if (this.isAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignored
      }
    }
  }
}

export const speechService = new SpeechService();
