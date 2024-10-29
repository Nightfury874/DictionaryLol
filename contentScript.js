// contentScript.js

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
    // Create an image element for the speaker icon
    const audioIcon = document.createElement('img');
    audioIcon.src = chrome.runtime.getURL('speaker.svg'); // Get the URL of the SVG
    audioIcon.alt = 'Pronunciation';
    audioIcon.width = 28;
    audioIcon.height = 28;
    audioIcon.style.cursor = 'pointer';
    audioIcon.style.marginLeft = '10px';
    audioIcon.style.verticalAlign = 'middle'; // Align with text

    // Add click event to play audio
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
