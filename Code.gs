/**
 * Automating Literacy Slide Shows - Assembly Backend API
 * 
 * To deploy:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code.
 * 3. Click "Deploy" -> "New deployment".
 * 4. Select type: "Web app".
 * 5. Execute as: "Me".
 * 6. Who has access: "Anyone".
 * 7. Copy the resulting Web App URL to use in the frontend tester.
 */

function doPost(e) {
  try {
    // 1. Parse the incoming JSON payload
    var requestData = JSON.parse(e.postData.contents);
    var templateId = requestData.templateId;
    var deckName = requestData.deckName || "Automated Daily Review";
    var slidesToBuild = requestData.slides || [];
    var folderId = requestData.folderId || null;
    
    // 2. Make a copy of the master template library
    var templateFile = DriveApp.getFileById(templateId);
    var newFile;
    if (folderId) {
      newFile = templateFile.makeCopy(deckName, DriveApp.getFolderById(folderId));
    } else {
      newFile = templateFile.makeCopy(deckName);
    }
    
    // 3. Open the new presentation
    var presentation = SlidesApp.openById(newFile.getId());
    var originalSlides = presentation.getSlides();
    
    // 4. Map the master slides by their speaker note [tags]
    var slideLibrary = {};
    for (var i = 0; i < originalSlides.length; i++) {
      var slide = originalSlides[i];
      var notesShape = slide.getNotesPage().getSpeakerNotesShape();
      if (notesShape) {
        var notesText = notesShape.getText().asString();
        // Look for tags formatted like [tagName]
        var match = notesText.match(/\[.*?\]/);
        if (match) {
          // Store the slide reference using the tag as the key
          slideLibrary[match[0].trim()] = slide;
        }
      }
    }
    
    // 5. Assemble the new deck based on the JSON array
    for (var j = 0; j < slidesToBuild.length; j++) {
      var instruction = slidesToBuild[j];
      var masterSlide = slideLibrary[instruction.noteId];
      
      if (masterSlide) {
        // Append a duplicate of the requested master slide to the end of the presentation
        var newSlide = presentation.appendSlide(masterSlide);
        
        // If there are {{tags}} to replace on the canvas, replace them ONLY on this slide
        if (instruction.replacements) {
          for (var tag in instruction.replacements) {
            newSlide.replaceAllText(tag, instruction.replacements[tag], true);
          }
        }
        
        // If we need to inject a specific prompt into the speaker notes (Sections A & K)
        if (instruction.injectNotes) {
          newSlide.getNotesPage().getSpeakerNotesShape().getText().setText(instruction.injectNotes);
        }
      }
    }
    
    // 6. Clean up: Delete all the original master library slides from the top of the deck
    for (var k = 0; k < originalSlides.length; k++) {
      originalSlides[k].remove();
    }
    
    // 7. Save changes
    presentation.saveAndClose();

    // 7.5 Optional: Export to PowerPoint (.pptx)
    var pptxUrl = null;
    var pptxId = null;
    if (requestData.exportPptx) {
      try {
        var exportUrl = "https://docs.google.com/feeds/download/presentations/Export?id=" + newFile.getId() + "&exportFormat=pptx";
        var fetchResponse = UrlFetchApp.fetch(exportUrl, {
          headers: {
            Authorization: "Bearer " + ScriptApp.getOAuthToken()
          },
          muteHttpExceptions: true
        });
        
        if (fetchResponse.getResponseCode() === 200) {
          var pptxBlob = fetchResponse.getBlob().setName(deckName + ".pptx");
          var pptxFile;
          if (folderId) {
            pptxFile = DriveApp.getFolderById(folderId).createFile(pptxBlob);
          } else {
            pptxFile = DriveApp.createFile(pptxBlob);
          }
          try {
            pptxFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch(sharingErr) {
            // Ignore if domain sharing limits apply
          }
          pptxUrl = pptxFile.getUrl();
          pptxId = pptxFile.getId();
        }
      } catch (pptxErr) {
        Logger.log("PowerPoint export failed: " + pptxErr.toString());
      }
    }
    
    // 8. Return success response
    var responsePayload = {
      status: "success",
      message: "Presentation assembled successfully.",
      url: newFile.getUrl(),
      id: newFile.getId(),
      pptxUrl: pptxUrl,
      pptxId: pptxId
    };
    
    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    var errorPayload = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorPayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple GET response for browser testing
function doGet(e) {
  return ContentService.createTextOutput("The Slide Assembly API is active and listening for POST requests.");
}
