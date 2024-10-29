// background.js

// Replace this with your actual Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyeWNbxX-_0wwY3eOplEgZe4g9Jem7nI7PrMwoTKrptb1M_s3DKi7BlaFSKe9I_p59xnw/exec';

// Listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "defineWord",
        title: "Define",
        contexts: ["selection"]
    });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "defineWord") {
        var selectedText = info.selectionText.trim();
        if (selectedText.length > 0) {
            // Inject content script and send the selected word
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    files: ["contentScript.js"]
                },
                function() {
                    chrome.tabs.sendMessage(tab.id, { action: "define", word: selectedText });
                }
            );
            
            // Increment the lookup count
            incrementLookupCount();
        }
    }
});

/**
 * Function to increment the total lookup count by sending a POST request
 * to the Google Apps Script Web App.
 */
function incrementLookupCount() {
    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ increment: true }) // Optional payload
    })
    .then(response => response.json())
    .then(data => {
        console.log('Lookup count incremented. Total lookups:', data.totalLookups);
    })
    .catch((error) => {
        console.error('Error incrementing lookup count:', error);
    });
}
