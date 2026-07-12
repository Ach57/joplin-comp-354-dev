// This will run inside the CodeMirror Markdown editor in Joplin.
// The description: it finds the synonym option in the menu after right-clicking the word, captures the sentence, and loads the popup.

// References: Box Radius, Box Shadow and Z-index: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius
//            Colors: For the border, I used the same as Joplin by examining theirs inside Developer Tools and Element: --joplin-divider-color: #555555
//           For the orange, I used their warning color: --joplin-color-warn2: #ffcb81
//           For the rest, I tried to be slightly different than their black: --joplin-background-color3: #2E3138, and their white: --joplin-color: #dddddd, by making my own research.
// 		  I got my black from: https://www.color-hex.com/color-palette/5272
// 		  I got my white from: https://www.color-hex.com/color-palette/914

import {
	ContentScriptContext,
	CodeMirrorStatic,
	ReplaceRange,
	CodeMirrorEditor,
	SynonymResponse,
} from './types/types';

export default function(context: ContentScriptContext) {
	return {
		plugin: function(CodeMirror: CodeMirrorStatic) {
			let currentReplaceRange: ReplaceRange | null = null;
			let currentCm: CodeMirrorEditor | null = null;
			let currentHighlightIndex = 0;
			let currentKeyHandler: ((e: KeyboardEvent)=> void) | null = null;

			function splitIntoSentences(text: string) {
				return text.match(/[^.!?]+[.!?]?/g) || [];
			}

			function extractContext(
				fullText: string,
				cursorIndex: number,
				selectedWord: string,
			) {
				const sentences = splitIntoSentences(fullText);
				let charCount = 0;
				let targetSentenceIndex = 0;

				// Finds the sentence that contains the cursor
				for (let i = 0; i < sentences.length; i++) {
					charCount += sentences[i].length;
					if (charCount >= cursorIndex) {
						targetSentenceIndex = i;
						break;
					}
				}

				const targetSentence = (sentences[targetSentenceIndex] || '').trim();
				const wordsInSentence = targetSentence
					.split(/\s+/)
					.filter(
						(w: string) => w.toLowerCase() !== selectedWord.toLowerCase(),
					);

				// *It considers short sentences as ones with 5 words or lower. CAN BE CHANGED
				if (wordsInSentence.length < 5 && targetSentenceIndex > 0) {
					// If the sentence is too short or unfinished, it saves the previous sentence as well
					const prevSentence = (
						sentences[targetSentenceIndex - 1] || ''
					).trim();
					return `${prevSentence} ${targetSentence}`;
				}

				return targetSentence;
			}

			function removeExistingPopup() {
				// This clears out any other potential synonym finder in Joplin
				const existing = document.getElementById('synonym-popup');
				if (existing) existing.remove();

				if (currentKeyHandler) {
					document.removeEventListener('keydown', currentKeyHandler, true);
					currentKeyHandler = null;
				}
			}

			function showLoadingPopup() {
				// Shows the loading popup
				removeExistingPopup();

				if (!document.getElementById('synonym-spin-style')) {
					const style = document.createElement('style');
					style.id = 'synonym-spin-style';
					style.textContent = `
						@keyframes synonymSpin {
							to { transform: rotate(360deg); }
						}
					`;
					document.head.appendChild(style);
				}

				const popup = document.createElement('div');
				popup.id = 'synonym-popup';
				// Centers the popup to the middle of the screen. Comments need to be written above this string btw or else it creates errors!
				// References for the CSS Text string are found at the top
				popup.style.cssText = `
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: #2b2b2b;
					color: #e0e0e0;
					border: 1px solid #555555;
					border-radius: 6px;
					padding: 14px 18px;
					font-size: 14px;
					font-family: sans-serif;
					box-shadow: 0 4px 16px rgba(0,0,0,0.5);
					z-index: 99999;
					min-width: 220px;
					display: flex;
					align-items: center;
					gap: 10px;
				`;

				const spinner = document.createElement('div'); // Adds loading symbol (the spinner)
				spinner.style.cssText = `
					width: 16px;
					height: 16px;
					border: 2px solid #555555;
					border-top: 2px solid #ffcb81;
					border-radius: 50%;
					animation: synonymSpin 0.8s linear infinite;
					flex-shrink: 0;
				`;

				const label = document.createElement('span');
				label.textContent = 'Finding suitable synonyms...';

				popup.appendChild(spinner);
				popup.appendChild(label);
				document.body.appendChild(popup);

				setTimeout(() => {
					// Incase user wants to quickly get out of popup
					document.addEventListener('mousedown', function handler(e) {
						if (!popup.contains(e.target as Node)) {
							removeExistingPopup();
							document.removeEventListener('mousedown', handler);
						}
					});
				}, 100);
			}

			function showStatusPopup(message: string, type: 'error' | 'warning') {
				removeExistingPopup();

				const popup = document.createElement('div');
				popup.id = 'synonym-popup';
				popup.setAttribute('role', 'alert');
				popup.style.cssText = `
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: #2b2b2b;
					color: #e0e0e0;
					border: 1px solid ${type === 'error' ? '#d9534f' : '#ffcb81'};
					border-radius: 6px;
					padding: 14px 18px;
					font-size: 14px;
					font-family: sans-serif;
					box-shadow: 0 4px 16px rgba(0,0,0,0.5);
					z-index: 99999;
					min-width: 260px;
					max-width: 380px;
					display: flex;
					align-items: center;
					gap: 10px;
				`;

				const label = document.createElement('span');
				label.textContent = message;

				popup.appendChild(label);
				document.body.appendChild(popup);

				// closes after 4.5 seconds
				setTimeout(() => {
					if (document.getElementById('synonym-popup') === popup) {
						removeExistingPopup();
					}
				}, 4500);
			}

			function replaceSelectedWord(synonym: string) {
				if (currentCm && currentReplaceRange) {
					currentCm.replaceRange(
						synonym,
						currentReplaceRange.from,
						currentReplaceRange.to,
					);
				}
				removeExistingPopup();
				currentReplaceRange = null;
				currentCm = null;
			}

			function showSynonymOptionsPopup(synonyms: string[]) {
				removeExistingPopup();

				currentHighlightIndex = 0;

				const popup = document.createElement('div');
				popup.id = 'synonym-popup';
				// References for the CSS Text string are found at the top
				popup.style.cssText = `
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: #2b2b2b;
					color: #e0e0e0;
					border: 1px solid #555555;
					border-radius: 6px;
					padding: 14px 18px;
					font-size: 14px;
					font-family: sans-serif;
					box-shadow: 0 4px 16px rgba(0,0,0,0.5);
					z-index: 99999;
					min-width: 220px;
					display: flex;
					flex-direction: column;
					gap: 8px;
				`;

				const buttons: HTMLButtonElement[] = [];

				for (const word of synonyms) {
					const btn = document.createElement('button');
					btn.textContent = word;
					btn.style.cssText = `
						background: #3a3a3a;
						color: #e0e0e0;
						border: 1px solid #555555;
						border-radius: 4px;
						padding: 6px 10px;
						cursor: pointer;
						text-align: left;
					`;
					btn.addEventListener('click', () => replaceSelectedWord(word));
					popup.appendChild(btn);
					buttons.push(btn);
				}

				document.body.appendChild(popup);

				function updateHighlight() {
					for (const [index, btn] of buttons.entries()) {
						if (index === currentHighlightIndex) {
							btn.style.background = '#ffcb81';
							btn.style.color = '#2b2b2b';
						} else {
							btn.style.background = '#3a3a3a';
							btn.style.color = '#e0e0e0';
						}
					}
				}

				updateHighlight();

				currentKeyHandler = function(e: KeyboardEvent) {
					if (e.key === 'ArrowDown') {
						e.preventDefault();
						e.stopPropagation();
						currentHighlightIndex =
							(currentHighlightIndex + 1) % buttons.length;
						updateHighlight();
					} else if (e.key === 'ArrowUp') {
						e.preventDefault();
						e.stopPropagation();
						currentHighlightIndex =
							(currentHighlightIndex - 1 + buttons.length) % buttons.length;
						updateHighlight();
					} else if (e.key === 'Enter') {
						e.preventDefault();
						e.stopPropagation();
						replaceSelectedWord(synonyms[currentHighlightIndex]);
					} else if (e.key === 'Escape') {
						e.preventDefault();
						e.stopPropagation();
						removeExistingPopup();
					}
				};
				document.addEventListener('keydown', currentKeyHandler, true);
			}

			function handleSynonymResponse(response: SynonymResponse) {
				if (!response || response.status === 'error') {
					console.error(
						'Synonym Finder: Error. Something went wrong. Please try again soon',
						JSON.stringify(response),
					);
					showStatusPopup(
						'Something went wrong while finding synonyms. Please try again soon.',
						'error',
					);
					return;
				}
				if (
					response.status === 'empty' ||
          !response.synonyms ||
          response.synonyms.length === 0
				) {
					console.warn(
						'Synonym Finder: No synonyms found. Please try writing some more and retrying',
					);
					showStatusPopup(
						'No synonyms were found. Try another word or add more sentence context.',
						'warning',
					);
					return;
				}
				showSynonymOptionsPopup(response.synonyms);
			}

			CodeMirror.commands.triggerSynonymFinder = async function(
				cm: CodeMirrorEditor,
			) {
				// For the context menu
				const selectedText = cm.getSelection().trim();

				if (!selectedText || selectedText.includes(' ')) {
					console.warn('Synonym Finder: Please select a single word.');
					showStatusPopup('Please select exactly one word.', 'warning');
					return;
				}

				const cursor = cm.getCursor('from');
				currentCm = cm;
				currentReplaceRange = {
					from: cm.getCursor('from'),
					to: cm.getCursor('to'),
				};
				const fullText = cm.getValue();
				const lines = fullText.split('\n');
				let charIndex = 0;
				for (let i = 0; i < cursor.line; i++) {
					charIndex += lines[i].length + 1;
				}
				charIndex += cursor.ch;

				const sentenceContext = extractContext(
					fullText,
					charIndex,
					selectedText,
				);
				showLoadingPopup();

				try {
					const response = (await context.postMessage({
						// This sends the word and the sentence context back to index.ts
						type: 'synonymRequest',
						word: selectedText,
						context: sentenceContext,
					})) as SynonymResponse;
					handleSynonymResponse(response);
				} catch (error) {
					console.error('Synonym Finder: Request failed:', error);
					showStatusPopup(
						'Could not connect to the synonym service. Please try again.',
						'error',
					);
				}
			};
		},
		codeMirrorOptions: {},
	};
}
