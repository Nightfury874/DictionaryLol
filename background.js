// background.js

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyeWNbxX-_0wwY3eOplEgZe4g9Jem7nI7PrMwoTKrptb1M_s3DKi7BlaFSKe9I_p59xnw/exec';

// Set to keep track of tabs where scripts have been injected
const injectedTabs = new Set();

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
        if (selectedText.length > 0 && tab.id !== undefined) {
            // Check if scripts have already been injected into this tab
            if (!injectedTabs.has(tab.id)) {
                // Inject styles.css first
                chrome.scripting.insertCSS(
                    {
                        target: { tabId: tab.id },
                        files: ["styles.css"]
                    },
                    function() {
                        if (chrome.runtime.lastError) {
                            console.error('Error injecting CSS:', chrome.runtime.lastError);
                        } else {
                            console.log('CSS injected successfully.');
                        }

                        // Inject contentScript.js after CSS
                        chrome.scripting.executeScript(
                            {
                                target: { tabId: tab.id },
                                files: ["contentScript.js"]
                            },
                            function() {
                                if (chrome.runtime.lastError) {
                                    console.error('Error injecting content script:', chrome.runtime.lastError);
                                } else {
                                    console.log('Content script injected successfully.');
                                    injectedTabs.add(tab.id);
                                    chrome.tabs.sendMessage(tab.id, { action: "define", word: selectedText });
                                }
                            }
                        );
                    }
                );
            } else {
                // If already injected, just send the message
                chrome.tabs.sendMessage(tab.id, { action: "define", word: selectedText });
            }

            // Increment the lookup count
            incrementLookupCount();
        }
    }
});

// Listener for tab removal to clean up the injectedTabs set
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (injectedTabs.has(tabId)) {
        injectedTabs.delete(tabId);
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
