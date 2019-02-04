// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
  });
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
});
