
let searchBkm = document.getElementById('searchBkm');
if (searchBkm != null) {
	searchBkm.onclick = function(element) {
		
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

		// data from input
		var queryFind = document.getElementById("search").value;
			// search bookmark that are somehow similar to query
			// and sort them by percentage similarity
			chrome.bookmarks.getTree(
				function(bookmarkTreeNodes) {
				var foundBookmarksList = getResult(bookmarkTreeNodes, queryFind);
				$('#bookmarks').html(foundBookmarksList);
			});
			
		});
	};
}

function getResult(bookmarks, query) {
	var queryWords = query.split("+");
	var resultListOfBookmarks = searchInBookmarks(bookmarks, queryWords);
	//var resultText = createListOfBookmarks(resultListOfBookmarks);
	var resultText = createTableBookmarks(resultListOfBookmarks);
	return resultText;
}

function createListOfBookmarks(bookmarks) {
	var resultText;
	if (bookmarks.length > 0) {
		resultText = "<ul>";
		for (var i = 0; i < bookmarks.length; i++) {
			resultText += "<li>" + bookmarks[i].title + "</li>";
		}
		resultText += "</ul>";
	}
	else {
		resultText = "<p>No bookmarks found</p>";
	}
	return resultText;
}

function createTableBookmarks(bookmarks) {
	var resultText;
	if (bookmarks.length > 0) {
		resultText = "<table><tbody>";
		for (var i = 0; i < bookmarks.length; i++) {
			resultText += "<tr><td><div class='bookmarkstyle'>" +
            "<img height='16' width='16' src='" +
			"https://www.google.com/s2/favicons?domain=" +
            bookmarks[i].url +
            "'>" +			
			"<a href='" +
			bookmarks[i].url +
			"'>" +
			bookmarks[i].title + 
			"</a>" +
			"</div></td></tr>";
		}
		resultText += "</tbody></table>";
	}
	else {
		resultText = "<p>No bookmarks found</p>";
	}
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
		listOfBookmarksWithPercents.sort(function(a, b){return b.percentage - a.percentage});
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
         var queryWord = queryWords[i].toLowerCase();	
         if (bookmarkTitle.search(queryWord) != -1) {
             matchingFullWords.push(queryWord);
         }
         findIndexOfQuerySequence = bookmarkTitle.indexOf(queryWord, bookmarkTitleIndex);
         if (findIndexOfQuerySequence != -1) {
             bookmarkTitleIndex = findIndexOfQuerySequence + queryWord.length;
             matchingWordsInSequence.push(queryWord);
         }
         else {
             // check matching parts of word
             var middleIndex = queryWord.length/2;
             var firstPartOfWord = queryWord.substring(0, middleIndex);
             var secondPartOfWord = queryWord.substring(middleIndex, queryWord.length);
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