// contentScript.js

// Inject CSS for the overlay
const css = `
#dictionary-overlay {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -20%);
  width: 400px;
  max-width: 90%;
  background-color: #fff;
  border: 1px solid #ccc;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
  box-shadow: 0px 4px 15px rgba(0,0,0,0.2);
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#dictionary-overlay h2 {
  margin-top: 0;
  font-size: 24px;
  display: flex;
  align-items: center;
}

#dictionary-overlay h2 svg {
  width: 24px;
  height: 24px;
  cursor: pointer;
  margin-left: 10px;
  fill: #555; /* Ensure the icon is visible */
}

#dictionary-overlay .phonetic {
  color: #888;
  font-size: 14px;
}

#dictionary-overlay .partOfSpeech {
  font-style: italic;
  color: #555;
  margin-top: 10px;
}

#dictionary-overlay .definition {
  margin-top: 5px;
  margin-bottom: 5px;
}

#dictionary-overlay .example {
  color: #555;
  margin-left: 20px;
  font-style: italic;
}

#dictionary-overlay .synonyms,
#dictionary-overlay .antonyms {
  color: #555;
  margin-top: 5px;
}

#dictionary-overlay .close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  color: #aaa;
  cursor: pointer;
}

#dictionary-overlay .close-button:hover {
  color: #000;
}
`;

// Inject the CSS into the page
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(css));
(document.head || document.documentElement).appendChild(style);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "define") {
    const word = request.word;
    fetchDefinition(word);
  }
});

// Fetch definition from the API
function fetchDefinition(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        showOverlay(word, data[0]);
      } else {
        showOverlay(word, null);
      }
    })
    .catch(error => {
      console.error('Error fetching definition:', error);
      showOverlay(word, null);
    });
}

// Display the overlay with definition and pronunciation
function showOverlay(word, data) {
  // Remove existing overlay if any
  const existingOverlay = document.getElementById('dictionary-overlay');
  if (existingOverlay) {
    existingOverlay.parentNode.removeChild(existingOverlay);
  }

  // Create overlay div
  const overlay = document.createElement('div');
  overlay.id = 'dictionary-overlay';

  // Close button
  const closeButton = document.createElement('span');
  closeButton.innerHTML = '&times;';
  closeButton.className = 'close-button';
  closeButton.onclick = () => {
    document.body.removeChild(overlay);
  };
  overlay.appendChild(closeButton);

  // Word title
  const wordTitle = document.createElement('h2');
  wordTitle.textContent = word;

  // Pronunciation audio and phonetic text
  let audioUrl = null;
  let phoneticText = '';

  if (data && data.phonetics && data.phonetics.length > 0) {
    for (let phonetic of data.phonetics) {
      if (phonetic.audio && !audioUrl) {
        audioUrl = phonetic.audio;
      }
      if (phonetic.text && !phoneticText) {
        phoneticText = phonetic.text;
      }
      if (audioUrl && phoneticText) break;
    }
  }

  if (audioUrl) {
    const audioIcon = document.createElement('svg');
    audioIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    audioIcon.setAttribute('viewBox', '0 0 24 24');
    audioIcon.innerHTML = `
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a3.5 3.5 0 0 0-1.7-3 1 1 0 0 1 1-1.7 5.5 5.5 0 0 1 0 9.4 1 1 0 0 1-1-1.7 3.5 3.5 0 0 0 1.7-3z"/>
    `;
    audioIcon.style.cursor = 'pointer';
    audioIcon.style.marginLeft = '10px';
    audioIcon.onclick = () => {
      const audio = new Audio(audioUrl);
      audio.play();
    };
    wordTitle.appendChild(audioIcon);
  }

  overlay.appendChild(wordTitle);

  // Phonetic text
  if (phoneticText) {
    const phoneticDiv = document.createElement('div');
    phoneticDiv.className = 'phonetic';
    phoneticDiv.textContent = phoneticText;
    overlay.appendChild(phoneticDiv);
  }

  if (data) {
    // Iterate through each meaning
    data.meanings.forEach(meaning => {
      // Part of speech
      const pos = document.createElement('div');
      pos.className = 'partOfSpeech';
      pos.textContent = meaning.partOfSpeech;
      overlay.appendChild(pos);

      // Definitions
      meaning.definitions.forEach(def => {
        const defDiv = document.createElement('div');
        defDiv.className = 'definition';
        defDiv.textContent = def.definition;
        overlay.appendChild(defDiv);

        // Example
        if (def.example) {
          const exDiv = document.createElement('div');
          exDiv.className = 'example';
          exDiv.textContent = `"${def.example}"`;
          overlay.appendChild(exDiv);
        }
      });

      // Synonyms
      if (meaning.synonyms && meaning.synonyms.length > 0) {
        const synonymsDiv = document.createElement('div');
        synonymsDiv.className = 'synonyms';
        synonymsDiv.textContent = `Synonyms: ${meaning.synonyms.join(', ')}`;
        overlay.appendChild(synonymsDiv);
      }

      // Antonyms
      if (meaning.antonyms && meaning.antonyms.length > 0) {
        const antonymsDiv = document.createElement('div');
        antonymsDiv.className = 'antonyms';
        antonymsDiv.textContent = `Antonyms: ${meaning.antonyms.join(', ')}`;
        overlay.appendChild(antonymsDiv);
      }
    });
  } else {
    // Definition not found
    const notFoundDiv = document.createElement('div');
    notFoundDiv.textContent = "Definition not found.";
    overlay.appendChild(notFoundDiv);
  }

  document.body.appendChild(overlay);
}
