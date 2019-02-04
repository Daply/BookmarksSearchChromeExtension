
'use strict';

chrome.runtime.onInstalled.addListener(function() {

  // Replace all rules
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	  // With a new rule
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {urlContains: 'www.google'},
      })],
	  // And shows the extension's page action (activate extension).
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
  
  var bookmarksNodes;
  chrome.bookmarks.getTree(
	function(bookmarkTreeNodes) {
		bookmarksNodes = bookmarkTreeNodes;
		chrome.storage.local.set({'bookmarks': bookmarksNodes}, function() {
			console.log(bookmarksNodes);
		});	
  });
  
 });
  
