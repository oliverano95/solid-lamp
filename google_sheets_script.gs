/**
 * Pebble Gym Tracker - Google Sheets Integration
 * * This script catches the webhook from your Pebble smartwatch,
 * verifies your secret password, and organizes your workout data
 * into clean, individual rows for each set.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var parsedData = JSON.parse(e.postData.contents);
  
  // --- THE BOUNCER ---
  // If the incoming envelope doesn't have the exact matching token, throw it away!
  // NOTE: Change this to your own secure password before deploying!
  var secretPassword = "YOUR_SECRET_PASSWORD_HERE"; 
  
  if (parsedData.token !== secretPassword) {
    return ContentService.createTextOutput("Access Denied: Invalid Token");
  }
  // -------------------

  var rawString = parsedData.workoutData;
  var parts = rawString.split('|');
  
  // Extract the header info
  var routine = parts[0];
  var date = parts[1];
  var duration = parts[2];
  
  var currentExercise = "";
  var setNum = 1;
  
  // Loop through the rest of the string to parse exercises and sets
  for (var i = 3; i < parts.length; i++) {
    // If the part is not a number, it is the exercise name
    if (isNaN(parts[i])) {
      currentExercise = parts[i];
      setNum = 1; // Reset the set counter for the new exercise
    } else {
      // If it is a number, it is the reps, and the next item is the weight
      var reps = parts[i];
      var weight = parts[i+1];
      
      // Append the perfectly formatted row to the spreadsheet!
      sheet.appendRow([date, routine, duration, currentExercise, setNum, reps, weight]);
      
      setNum++;
      i++; // Skip the next index since we already grabbed the weight
    }
  }
  
  return ContentService.createTextOutput("Success");
}
