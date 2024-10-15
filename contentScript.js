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
  color: #000;
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
  color: inherit;
}

#dictionary-overlay h2 svg {
  width: 24px;
  height: 24px;
  cursor: pointer;
  margin-left: 10px;
  fill: currentColor; /* Use current text color */
}

#dictionary-overlay .phonetic {
  color: #555;
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
  color: inherit;
}

#dictionary-overlay .example {
  color: #555;
  margin-left: 20px;
  font-style: italic;
}

#dictionary-overlay .pos-select {
  margin-top: 15px;
  font-size: 14px;
  width: 100%;
  padding: 5px;
  background-color: #f0f0f0;
  color: #000;
  border: 1px solid #ccc;
  border-radius: 4px;
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

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  #dictionary-overlay {
    background-color: #1e1e1e;
    color: #f0f0f0;
    border: 1px solid #444;
    box-shadow: 0px 4px 15px rgba(255,255,255,0.1);
  }

  #dictionary-overlay .phonetic {
    color: #bbb;
  }

  #dictionary-overlay .partOfSpeech {
    color: #bbb;
  }

  #dictionary-overlay .example {
    color: #bbb;
  }

  #dictionary-overlay .pos-select {
    background-color: #2e2e2e;
    color: #f0f0f0;
    border: 1px solid #555;
  }

  #dictionary-overlay .close-button {
    color: #ccc;
  }

  #dictionary-overlay .close-button:hover {
    color: #fff;
  }

  #dictionary-overlay h2 svg {
    fill: currentColor;
  }
}
`;

// Inject the CSS into the page
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(css));
(document.head || document.documentElement).appendChild(style);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "define") {
    const word = request.word;
    fetchDefinition(word);
  }
});

// Fetch definition from the API
function fetchDefinition(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (Array.isArray(data)) {
        showOverlay(word, data[0]);
      } else {
        showOverlay(word, null);
      }
    })
    .catch((error) => {
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
    // Use a recognizable speaker icon
    const audioIcon = document.createElement('svg');
    audioIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    audioIcon.setAttribute('viewBox', '0 0 24 24');
    audioIcon.setAttribute('width', '24');
    audioIcon.setAttribute('height', '24');
    audioIcon.style.cursor = 'pointer';
    audioIcon.style.marginLeft = '10px';
    audioIcon.innerHTML = `
      <path d="M3 9v6h4l5 5V4L7 9H3z"></path>
      <path d="M14 14.5c0-1.74 1.26-3.2 2.94-3.45l-.92-.92C14.54 10.64 13 12.42 13 14.5c0 2.08 1.54 3.86 3.62 4.37l.92-.92c-1.68-.25-2.94-1.71-2.94-3.45z"></path>
      <path d="M16 3.23v2.06C19.9 6.49 23 10.15 23 14.5s-3.1 8.01-7 9.21v2.06c5.06-1.25 9-5.89 9-11.27s-3.94-10.01-9-11.27z"></path>
    `;
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
    const meanings = data.meanings;
    if (meanings && meanings.length > 0) {
      // Create a container to hold the meaning section
      const meaningContainer = document.createElement('div');
      meaningContainer.id = 'meaning-container';

      // Function to display a meaning based on index
      const displayMeaning = (index) => {
        // Clear previous meaning
        meaningContainer.innerHTML = '';

        const meaning = meanings[index];
        const section = createMeaningSection(meaning);
        meaningContainer.appendChild(section);
      };

      // Initially display the first meaning
      displayMeaning(0);

      overlay.appendChild(meaningContainer);

      if (meanings.length > 1) {
        // Create a dropdown to select different parts of speech
        const posSelect = document.createElement('select');
        posSelect.className = 'pos-select';

        // Populate the dropdown
        meanings.forEach((meaning, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = meaning.partOfSpeech;
          posSelect.appendChild(option);
        });

        // Set the initial selection
        posSelect.selectedIndex = 0;

        // Add an event listener
        posSelect.onchange = () => {
          const selectedIndex = posSelect.selectedIndex;
          displayMeaning(selectedIndex);
        };

        overlay.appendChild(posSelect);
      }
    }
  } else {
    // Definition not found
    const notFoundDiv = document.createElement('div');
    notFoundDiv.textContent = "Definition not found.";
    overlay.appendChild(notFoundDiv);
  }

  document.body.appendChild(overlay);
}

// Helper function to create a meaning section
function createMeaningSection(meaning) {
  const section = document.createElement('div');
  section.className = 'section';

  // Part of speech
  const pos = document.createElement('div');
  pos.className = 'partOfSpeech';
  pos.textContent = meaning.partOfSpeech;
  section.appendChild(pos);

  // Only the first definition to limit information
  const firstDefinition = meaning.definitions[0];
  if (firstDefinition) {
    const defDiv = document.createElement('div');
    defDiv.className = 'definition';
    defDiv.textContent = firstDefinition.definition;
    section.appendChild(defDiv);

    // Example (optional)
    if (firstDefinition.example) {
      const exDiv = document.createElement('div');
      exDiv.className = 'example';
      exDiv.textContent = `"${firstDefinition.example}"`;
      section.appendChild(exDiv);
    }
  }

  return section;
}
