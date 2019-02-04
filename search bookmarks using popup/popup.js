// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});


changeColor.onclick = function(element) {
	
	  let color = element.target.value;
	  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.executeScript(
			tabs[0].id,
			{code: 'document.body.style.backgroundColor = "' + color + '";'});
		
		// extracting data about googling from url (parameter 'g')
		var activeTab = tabs[0];
		var tabUrl = activeTab.url;		
		
		var queryIndex = tabUrl.indexOf('q=');
		var queryLastIndex = tabUrl.indexOf('&', queryIndex);
		var queryFind = tabUrl.substring(queryIndex, queryLastIndex);
		queryFind = queryFind.replace(/q=/i, "");
		var queryWords = queryFind.split("+");
		
		// search bookmark that are somehow similar to query
	    // and sort them by percentage similarity
		chrome.bookmarks.getTree(
		    function(bookmarkTreeNodes) {
			var foundBookmarksList = getResult(bookmarkTreeNodes, queryFind);
			$('#bookmarks').html(foundBookmarksList);
		});
		
	  });
};

function getResult(bookmarks, query) {
	var queryWords = query.split("+");
	var resultListOfBookmarks = searchInBookmarks(bookmarks, queryWords);
	var resultText;
	if (resultListOfBookmarks.length > 0) {
		var i;
		resultText = "<ul>";
		for (i = 0; i < resultListOfBookmarks.length; i++) {
			//alert(resultListOfBookmarks[i].title);
			resultText += "<li>" + resultListOfBookmarks[i].title + "</li>";
		}
		resultText += "</ul>";
	}
	else {
		resultText = "No bookmarks found";
	}
	//alert(resultText);
	return resultText;
}

// creating a list of bookmarks that are match to query
function searchInBookmarks(bookmarks, queryWords) {
	var listOfBookmarks = [];
	var listOfBookmarksWithPercents = [];
	var i;
	for (i = 0; i < bookmarks.length; i++) {
		if (bookmarks[i].children) {
			listOfBookmarks = listOfBookmarks.concat(searchInBookmarks(bookmarks[i].children, queryWords));
		}
		else {
			var percent = percentOfAppropriateQuery(bookmarks[i], queryWords);
			if (percent > 0) {
				listOfBookmarksWithPercents.push({bookmark: bookmarks[i], percentage: percent});
			}
		}
	}
	
	// sort matched bookmarks by percentage
	if (listOfBookmarksWithPercents.length > 0) {
		listOfBookmarksWithPercents.sort(function(a, b){return a.percentage - b.percentage});
		for (i = 0; i < listOfBookmarksWithPercents.length; i++) {
			listOfBookmarks.push(listOfBookmarksWithPercents[i].bookmark);
			//alert(listOfBookmarksWithPercents[i].percentage);
		}
	}
	
	return listOfBookmarks;
}

// check if bookmark title matches the query
function percentOfAppropriateQuery(bookmark, queryWords) {
	var bookmarkTitle = bookmark.title.toLowerCase();
    var findIndexOfQuerySequence = 0;
    var bookmarkTitleIndex = 0;
    var matchingFullWords = [];
    var matchingWordsInSequence = [];
    var matchingParts = [];
	var i = 0;
    for (i = 0; i < queryWords.length; i++) {     
         if (bookmarkTitle.search(queryWords[i]) != -1) {
             matchingFullWords.push(queryWords[i]);
         }
         findIndexOfQuerySequence = bookmarkTitle.indexOf(queryWords[i], bookmarkTitleIndex);
         if (findIndexOfQuerySequence != -1) {
             bookmarkTitleIndex = findIndexOfQuerySequence + queryWords[i].length;
             matchingWordsInSequence.push(queryWords[i]);
         }
         else {
             // check matching parts of word
             var middleIndex = queryWords[i].length/2;
             var firstPartOfWord = queryWords[i].substring(0, middleIndex);
             var secondPartOfWord = queryWords[i].substring(middleIndex, queryWords[i].length);
             var firstFindIndex = bookmarkTitle.indexOf(firstPartOfWord, bookmarkTitleIndex);
             var secondFindIndex = bookmarkTitle.indexOf(secondPartOfWord, bookmarkTitleIndex);
                
             if (firstFindIndex != -1 && firstPartOfWord.length > 3) {
                 bookmarkTitleIndex = firstFindIndex + firstPartOfWord.length;
                 matchingParts.push(firstPartOfWord);
             }
             if (secondFindIndex != -1 && secondPartOfWord.length > 3) {
                 bookmarkTitleIndex = secondFindIndex + secondPartOfWord.length;
                 matchingParts.push(secondPartOfWord);
             }
                                
            }
        }
        
        var averagePercent = 0;
        
        var percentOfMatchingFullWords = (matchingFullWords.length/queryWords.length)*100;
        var percentOfMatchingWordsInSequence = (matchingWordsInSequence.length/queryWords.length)*100;
        if (percentOfMatchingFullWords != 0 && percentOfMatchingWordsInSequence != 0)
            averagePercent += 10;
        
        averagePercent += (percentOfMatchingFullWords + percentOfMatchingWordsInSequence)/2;
        
        var percentOfMatchingPartsOfWords = (matchingParts.length/(2*queryWords.length))*100;
        averagePercent += percentOfMatchingPartsOfWords;
        
        return averagePercent;
	
}