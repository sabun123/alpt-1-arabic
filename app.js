class ArabicGame {
    constructor(arabicData) {
        this.arabicData = arabicData;
        this.currentWord = null;
        this.correctPronunciations = new Set();
        this.selectedPronunciations = new Set();
        
        this.wordElement = document.getElementById('currentKanji');
        this.readingsElement = document.getElementById('readings');
        this.successIndicator = document.getElementById('success-indicator');
        this.themeToggle = document.getElementById('themeToggle');
        this.translationToggle = document.getElementById('toggleTranslation');

        // Footer copyright
        const currentYear = new Date().getFullYear();
        const copyrightYear = document.getElementById('copyright-year');
        copyrightYear.textContent = currentYear > 2025 ? `2025-${currentYear}` : '2025';
        
        this.initializeEventListeners();
        this.showNextWord();

        // Add ARIA attributes
        this.wordElement.setAttribute('role', 'region');
        this.wordElement.setAttribute('aria-label', 'Current Arabic word');
        this.readingsElement.setAttribute('role', 'group');
        this.readingsElement.setAttribute('aria-label', 'Pronunciation options');
    }

    initializeEventListeners() {
        this.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            this.themeToggle.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
        });

        this.translationToggle.addEventListener('click', () => {
            const translationElement = document.getElementById('translation');
            translationElement.classList.toggle('hidden');
        });
    }

    getRandomWord() {
        return this.arabicData[Math.floor(Math.random() * this.arabicData.length)];
    }

    getAllPossiblePronunciations() {
        return this.arabicData.reduce((acc, word) => {
            word.pronunciations.classical && acc.add(word.pronunciations.classical);
            word.pronunciations.colloquial.forEach(pron => acc.add(pron));
            return acc;
        }, new Set());
    }

    getWrongPronunciations(count) {
        const allPronunciations = Array.from(this.getAllPossiblePronunciations())
            .filter(pron => !this.correctPronunciations.has(pron));
        const shuffled = allPronunciations.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    getAllPossibleTranslations() {
        return this.arabicData.reduce((acc, word) => {
            acc.add(word.en);
            return acc;
        }, new Set());
    }

    getWrongTranslations(count) {
        const allTranslations = Array.from(this.getAllPossibleTranslations())
            .filter(trans => trans !== this.currentWord.en);
        const shuffled = allTranslations.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async showNextWord() {
        const previousWord = this.currentWord;
        this.currentWord = this.getRandomWord();
        this.correctPronunciations = new Set([
            this.currentWord.pronunciations.classical,
            ...this.currentWord.pronunciations.colloquial
        ]);
        this.selectedPronunciations = new Set();
        this.correctTranslation = this.currentWord.en;
        this.selectedTranslations = new Set();
        
        // Animate out current word
        if (previousWord) {
            this.wordElement.classList.add('kanji-exit');
            await new Promise(r => setTimeout(r, 300));
        }

        // Update content
        this.wordElement.textContent = this.currentWord.word;
        const translationElement = document.getElementById('translation');
        translationElement.textContent = `${this.currentWord.pronunciations.classical} / ${this.currentWord.pronunciations.colloquial.join(', ')}`;
        this.wordElement.setAttribute('aria-label', 
            `Current word: ${this.currentWord.word}`);
        
        this.successIndicator.classList.add('hidden');
        
        this.displayPronunciationOptions();
        this.displayTranslationOptions();

        // Animate in new word
        this.wordElement.classList.add('kanji-enter');
        requestAnimationFrame(() => {
            this.wordElement.classList.remove('kanji-exit', 'kanji-enter');
        });
    }

    displayPronunciationOptions() {
        const allPronunciations = [
            ...Array.from(this.correctPronunciations),
            ...this.getWrongPronunciations(2)
        ].sort(() => 0.5 - Math.random());
    
        this.readingsElement.innerHTML = '';
        
        allPronunciations.forEach(pronunciation => {
            const button = document.createElement('button');
            button.className = 'reading-option';
            
            const textSpan = document.createElement('span');
            textSpan.textContent = pronunciation;
            textSpan.style.display = 'inline-block';
            textSpan.style.transition = 'transform 0.3s ease';
            button.appendChild(textSpan);
            
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', `Pronunciation: ${pronunciation}`);
            
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handlePronunciationSelection(button, pronunciation);
                }
            });
            
            button.addEventListener('click', () => 
                this.handlePronunciationSelection(button, pronunciation));
            
            this.readingsElement.appendChild(button);
        });
    }

    displayTranslationOptions() {
        const allTranslations = [
            this.currentWord.en,
            ...this.getWrongTranslations(3)
        ].sort(() => 0.5 - Math.random());
    
        this.readingsElement.innerHTML = '';
        
        allTranslations.forEach(translation => {
            const button = document.createElement('button');
            button.className = 'reading-option';
            
            const textSpan = document.createElement('span');
            textSpan.textContent = translation;
            textSpan.style.display = 'inline-block';
            textSpan.style.transition = 'transform 0.3s ease';
            button.appendChild(textSpan);
            
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', `Translation: ${translation}`);
            
            button.addEventListener('click', () => 
                this.handleTranslationSelection(button, translation));
            
            this.readingsElement.appendChild(button);
        });
    }

    getBestJapaneseVoice() {
        // First, try to find a male Japanese voice
        const maleJapaneseVoice = this.voices.find(voice => 
            (voice.lang.includes('ja-JP') || voice.lang.includes('ja')) &&
            voice.name.toLowerCase().includes('male')
        );
        
        if (maleJapaneseVoice) return maleJapaneseVoice;

        // Next, try to find a Microsoft Japanese voice (generally higher quality)
        const microsoftJapaneseVoice = this.voices.find(voice =>
            (voice.lang.includes('ja-JP') || voice.lang.includes('ja')) &&
            voice.name.includes('Microsoft')
        );

        if (microsoftJapaneseVoice) return microsoftJapaneseVoice;

        // Finally, fall back to any Japanese voice
        const anyJapaneseVoice = this.voices.find(voice =>
            voice.lang.includes('ja-JP') || voice.lang.includes('ja')
        );

        return anyJapaneseVoice;
    }

    async playReading(reading) {
        if (!window.speechSynthesis) {
            console.error('Speech synthesis not supported');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(reading);
        utterance.lang = 'ja-JP';
        
        // Optimize voice settings for better quality
        utterance.rate = 1;    // Slightly slower for clarity
        utterance.pitch = 1.0;   // Slightly deeper voice
        utterance.volume = 1.0;  // Full volume

        // Get the best available Japanese voice
        const bestVoice = this.getBestJapaneseVoice();
        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        // Create a promise to handle the speech completion
        return new Promise((resolve) => {
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    }

    handleReadingSelection(button, reading) {
        if (button.classList.contains('disabled')) return;

        this.playReading(reading);

        const showAnnouncement = (message, isCorrect) => {
            const announcement = document.createElement('div');
            announcement.className = `announcement ${isCorrect ? 'correct' : 'incorrect'}`;
            announcement.setAttribute('role', 'alert');
            announcement.textContent = message;
            document.body.appendChild(announcement);
            
            // Remove the announcement after animation
            announcement.addEventListener('animationend', (e) => {
                if (e.animationName === 'fadeOut') {
                    announcement.remove();
                }
            });
        };

        if (this.correctReadings.has(reading)) {
            button.classList.add('correct', 'disabled');
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('aria-pressed', 'true');
            this.selectedReadings.add(reading);
            
            showAnnouncement('Correct reading!', true);

            if (this.selectedReadings.size === this.correctReadings.size) {
                this.successIndicator.classList.remove('hidden');
                this.successIndicator.classList.add('visible');
                this.successIndicator.setAttribute('role', 'alert');
                this.successIndicator.setAttribute('aria-label', 'Correct! Moving to next kanji');
                setTimeout(() => {
                    this.successIndicator.classList.remove('visible');
                    this.showNextKanji();
                }, 1000);
            }
        } else {
            button.classList.add('incorrect');
            button.addEventListener('animationend', () => {
                button.classList.remove('incorrect');
            }, { once: true });
            
            showAnnouncement('Incorrect reading, try again', false);
        }
    }

    handleTranslationSelection(button, translation) {
        if (button.classList.contains('disabled')) return;

        const showAnnouncement = (message, isCorrect) => {
            const announcement = document.createElement('div');
            announcement.className = `announcement ${isCorrect ? 'correct' : 'incorrect'}`;
            announcement.setAttribute('role', 'alert');
            announcement.textContent = message;
            document.body.appendChild(announcement);
            
            announcement.addEventListener('animationend', (e) => {
                if (e.animationName === 'fadeOut') {
                    announcement.remove();
                }
            });
        };

        if (translation === this.currentWord.en) {
            button.classList.add('correct', 'disabled');
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('aria-pressed', 'true');
            
            showAnnouncement('Correct translation!', true);

            setTimeout(() => {
                this.successIndicator.classList.remove('hidden');
                this.successIndicator.classList.add('visible');
                this.successIndicator.setAttribute('role', 'alert');
                this.successIndicator.setAttribute('aria-label', 'Correct! Moving to next word');
                setTimeout(() => {
                    this.successIndicator.classList.remove('visible');
                    this.showNextWord();
                }, 1000);
            }, 500);
        } else {
            button.classList.add('incorrect');
            button.addEventListener('animationend', () => {
                button.classList.remove('incorrect');
            }, { once: true });
            
            showAnnouncement('Incorrect translation, try again', false);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ArabicGame(arabicData);
});