// src/pkjs/index.js

// 1. Tell us when the JS environment is ready
Pebble.addEventListener('ready', function(e) {
  console.log('PebbleKit JS is ready and running on the phone!');
});

// 2. Open the configuration web page when the user clicks "Settings"
Pebble.addEventListener('showConfiguration', function(e) {
  // Your live GitHub Pages link
  var myConfigUrl = 'https://oliverano95.github.io/solid-lamp/';
  
  // Retrieve saved settings and workout history from the phone's local memory
  var googleUrl = localStorage.getItem('googleUrl') || '';
  var googlePwd = localStorage.getItem('googlePwd') || '';
  var history = localStorage.getItem('workoutHistory') || '[]';

  // Safely pass this data to the webpage via URL parameters
  var url = myConfigUrl + '?googleUrl=' + encodeURIComponent(googleUrl) + 
            '&googlePwd=' + encodeURIComponent(googlePwd) + 
            '&history=' + encodeURIComponent(history);
            
  Pebble.openURL(url);
});

// 3. Catch the data when the web page closes
Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response && e.response !== 'CANCELLED' && e.response !== '[]') {
    // Decode the URL gibberish back into a JSON object
    var configData = JSON.parse(decodeURIComponent(e.response));
    
    // Save any updated Google Settings to the phone
    if (configData.googleUrl !== undefined) localStorage.setItem('googleUrl', configData.googleUrl);
    if (configData.googlePwd !== undefined) localStorage.setItem('googlePwd', configData.googlePwd);
    
    // If the user clicked "Clear History" on the webpage, wipe the phone's memory
    if (configData.clearHistory) {
      localStorage.setItem('workoutHistory', '[]');
      console.log('Workout history cleared from phone memory.');
    }

    // Send the new routine data down to the watch (if it exists)
    if (configData.routineData && configData.routineData !== "") {
      Pebble.sendAppMessage({
        "ROUTINE_DATA": configData.routineData
      }, function() {
        console.log("Routine sent to watch successfully!");
      }, function(err) {
        console.log("Failed to send routine to watch: " + JSON.stringify(err));
      });
    }
  } else {
    console.log('User closed the configuration page without saving.');
  }
});

// 4. Catch data coming FROM the watch and handle saving/exporting
Pebble.addEventListener('appmessage', function(e) {
  if (e.payload.WORKOUT_SUMMARY) {
    var rawData = e.payload.WORKOUT_SUMMARY;
    console.log("WORKOUT COMPLETE! Received Data: " + rawData);
    
    // --- DEFAULT BEHAVIOR: SAVE LOCALLY TO PHONE ---
    var historyStr = localStorage.getItem('workoutHistory') || '[]';
    var historyArr = [];
    try { historyArr = JSON.parse(historyStr); } catch(err) {}
    
    // Add the new workout (with a timestamp)
    historyArr.push({
        timestamp: new Date().getTime(),
        data: rawData
    });
    
    // Cap history at the last 30 workouts so the URL doesn't get too long to load
    if (historyArr.length > 30) historyArr.shift();
    localStorage.setItem('workoutHistory', JSON.stringify(historyArr));
    console.log("Workout saved locally to phone!");


    // --- OPTIONAL BEHAVIOR: SEND TO GOOGLE SHEETS ---
    var scriptUrl = localStorage.getItem('googleUrl');
    var scriptPwd = localStorage.getItem('googlePwd');
    
    if (scriptUrl && scriptPwd) {
      console.log("Optional Google Sheets config found. Uploading...");
      var req = new XMLHttpRequest();
      req.open("POST", scriptUrl, true);
      req.setRequestHeader("Content-Type", "application/json");
      
      req.onload = function() {
        console.log("Successfully logged workout to Google Sheets!");
      };
      
      // THE VIP PASS: Packaged exactly how your Google Apps Script expects it!
      var payload = {
        token: scriptPwd, 
        workoutData: rawData
      };
      
      // Send the secured envelope
      req.send(JSON.stringify(payload));
    }
  }
});