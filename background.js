// background.js

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
      id: "defineWord",
      title: "Define",
      contexts: ["selection"]
    });
  });
  
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
      }
    }
  });
  