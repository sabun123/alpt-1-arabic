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
        this.infoButton = document.getElementById('infoButton');
        this.popup = document.getElementById('wordListPopup');
        this.closePopupButton = document.getElementById('closePopup');

        // Footer copyright
        const currentYear = new Date().getFullYear();
        const copyrightYear = document.getElementById('copyright-year');
        copyrightYear.textContent = currentYear > 2025 ? `2025-${currentYear}` : '2025';
        
        this.initializeEventListeners();
        this.initializeWordList();
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
            const isCurrentlyHidden = translationElement.classList.contains('hidden');
            translationElement.classList.toggle('hidden');
            
            // Play the word when showing pronunciations
            if (isCurrentlyHidden) {
                this.playWord();
            }
        });

        // Add popup event listeners
        this.infoButton.addEventListener('click', () => {
            this.popup.classList.remove('hidden');
        });

        this.closePopupButton.addEventListener('click', () => {
            this.popup.classList.add('hidden');
        });

        // Close popup when clicking outside
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.popup.classList.add('hidden');
            }
        });

        // Close popup with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.popup.classList.contains('hidden')) {
                this.popup.classList.add('hidden');
            }
        });
    }

    initializeWordList() {
        const wordListContainer = document.getElementById('wordList');
        const totalWords = this.arabicData.length;
        
        // Add word stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'word-stats';
        statsDiv.textContent = `Total Words: ${totalWords}`;
        wordListContainer.appendChild(statsDiv);
        
        // Add words with numbers
        this.arabicData.forEach((word, index) => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            
            const numberDiv = document.createElement('div');
            numberDiv.className = 'word-number';
            numberDiv.textContent = `${index + 1}.`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'word-content';
            
            const arabic = document.createElement('div');
            arabic.className = 'arabic';
            arabic.textContent = word.word;
            
            const english = document.createElement('div');
            english.className = 'english';
            english.textContent = word.en;
            
            contentDiv.appendChild(arabic);
            contentDiv.appendChild(english);
            
            wordItem.appendChild(numberDiv);
            wordItem.appendChild(contentDiv);
            wordListContainer.appendChild(wordItem);
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
        // Reset all reading option scales
        const readingOptions = document.querySelectorAll('.reading-option span');
        readingOptions.forEach(span => {
            span.style.transform = 'scale(1)';
        });

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

    getBestArabicVoice() {
        // First, try to find a male Arabic voice
        const maleArabicVoice = window.speechSynthesis.getVoices().find(voice => 
            (voice.lang.includes('ar') || voice.lang.includes('AR')) &&
            voice.name.toLowerCase().includes('male')
        );
        
        if (maleArabicVoice) return maleArabicVoice;

        // Next, try to find a Microsoft Arabic voice
        const microsoftArabicVoice = window.speechSynthesis.getVoices().find(voice =>
            (voice.lang.includes('ar') || voice.lang.includes('AR')) &&
            voice.name.includes('Microsoft')
        );

        if (microsoftArabicVoice) return microsoftArabicVoice;

        // Finally, fall back to any Arabic voice
        const anyArabicVoice = window.speechSynthesis.getVoices().find(voice =>
            voice.lang.includes('ar') || voice.lang.includes('AR')
        );

        return anyArabicVoice;
    }

    async playWord() {
        if (!window.speechSynthesis) {
            console.error('Speech synthesis not supported');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(this.currentWord.word);
        utterance.lang = 'ar';
        
        // Optimize voice settings for better quality
        utterance.rate = 0.8;     // Slower for clarity
        utterance.pitch = 1.0;    // Natural pitch
        utterance.volume = 1.0;   // Full volume

        // Get the best available Arabic voice
        const bestVoice = this.getBestArabicVoice();
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

        // Play the Arabic word when showing pronunciations
        if (translation === this.currentWord.en) {
            this.playWord();
        }

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