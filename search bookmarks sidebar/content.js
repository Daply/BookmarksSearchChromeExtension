

// get query from main google input
let queryTextSearch = '';
if (document.getElementsByName('q') != null) 
    queryTextSearch = document.getElementsByName('q')[0].value;

// get all bookmarks
let bookmarkTreeNodes;
chrome.storage.local.get(['bookmarks'], function(data) {
  bookmarkTreeNodes = data.bookmarks;
  console.log(data);
});
window.onload = function() {
	//look through document.body
	// (for getting all needed items)
	//console.dir(document.body); 
	
	var g = document.getElementById("main");
	//var g = document.getElementById("cnt");

	// create panel
    var panelElem = document.createElement("div");
    panelElem.className="panel"; 
	
	// create caption
	var caption = document.createElement("h3");
	var captionText = document.createTextNode("Searching bookmarks");
	caption.appendChild(captionText);
	
	// create input for searching bookmarks
	var divElem = document.createElement("div");
	var inputSearch = document.createElement("input");
	inputSearch.className="form-control";
    inputSearch.id="searchBkm"; 	
	var buttonSearch = document.createElement("button");
	buttonSearch.className="btn btn-info";
	buttonSearch.id="searchbookmarks"; 
	buttonSearch.onclick="getFoundBookmarksFromInput()";
	var btnText = document.createTextNode("search");
	buttonSearch.appendChild(btnText);
	var br = document.createElement("br");
	divElem.appendChild(inputSearch);
	divElem.appendChild(buttonSearch);
	divElem.appendChild(br);
	
	// create bookmarks area	
	var bookmarksElem = document.createElement("div");
	bookmarksElem.className="table table-condensed";
    bookmarksElem.id="bookmarks";
	
    // add all created nodes to panel
	panelElem.appendChild(caption);
	panelElem.appendChild(divElem);
	panelElem.appendChild(bookmarksElem);
	
	// create trigger
	var trigElem = document.createElement("a");
	trigElem.id="paneltrigger"; 
	trigElem.className="trigger"; 
	trigElem.href="#"; 
	
	g.appendChild(panelElem);
	g.appendChild(trigElem);
	
	$(document).ready(function(){
		$(".trigger").click(function(){
			$(".panel").toggle("fast");
			$(this).toggleClass("active");
			$("#bookmarks").empty();
			$("#bookmarks").append(getFoundBookmarksFromSearchQuery());
			return false;
		});
		$("#searchbookmarks").click(function(){
			$("#bookmarks").empty();
			$("#bookmarks").append(getFoundBookmarksFromInput());
			return false;
		});
	});	
}

function getFoundBookmarksFromSearchQuery() {
	var foundBookmarksList;
	// search bookmark that are somehow similar to query 
	// in google input
	// and sort them by percentage similarity
	var queryFind = queryTextSearch;
	foundBookmarksList = getResult(bookmarkTreeNodes, queryFind);
	return foundBookmarksList;
}

function getFoundBookmarksFromInput() {
	var inputQuery = document.getElementById("searchBkm").value;
	var foundBookmarksList;
	// search bookmark that are somehow similar to query
	// in panel input
	// and sort them by percentage similarity
	foundBookmarksList = getResult(bookmarkTreeNodes, inputQuery);
	return foundBookmarksList;
}

function getResult(bookmarks, query) {
	var queryWords = query.split(" ");
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