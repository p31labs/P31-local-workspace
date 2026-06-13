export function speak(text: string) {
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    speechSynthesis.speak(utterance)
  } catch {
  }
}

export function phosSpeakWelcome() {
  speak('Welcome to your space. You are safe here.')
}
