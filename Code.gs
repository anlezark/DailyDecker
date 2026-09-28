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

    // 1.5 Route Contact Form requests if action === "contact"
    if (requestData.action === "contact") {
      return handleContactSubmission(requestData);
    }

    var templateId = requestData.templateId;
    var deckName = requestData.deckName || "Automated Daily Review";
    var slidesToBuild = requestData.slides || [];
    var folderId = requestData.folderId || null;
    
    // 2. Make a copy of the master template library
    var templateFile;
    try {
      templateFile = DriveApp.getFileById(templateId);
    } catch (tplErr) {
      throw new Error("Could not access Slide Template (ID: " + templateId + "). Please open this template in Google Slides, click 'Share', and ensure General Access is set to 'Anyone with the link can view' (or shared with " + Session.getEffectiveUser().getEmail() + "). Error details: " + tplErr.message);
    }

    var newFile;
    if (folderId) {
      var targetFolder;
      try {
        targetFolder = DriveApp.getFolderById(folderId);
      } catch (folderErr) {
        throw new Error("Could not access Target Google Drive Folder (ID: " + folderId + "). Please check your folder ID in Global Settings or verify sharing access. Error details: " + folderErr.message);
      }
      newFile = templateFile.makeCopy(deckName, targetFolder);
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

        // If there are actions/mutations to apply to this slide (table fills, shape colors, hiding elements, etc.)
        if (instruction.actions && instruction.actions.length > 0) {
          applySlideActions(newSlide, instruction.actions);
        }

        // Backward compatibility: If we need to highlight numbers in a table (Hundreds Chart)
        if (instruction.highlightNumbers && instruction.highlightNumbers.length > 0) {
          var targetNums = {};
          for (var h = 0; h < instruction.highlightNumbers.length; h++) {
            targetNums[instruction.highlightNumbers[h]] = true;
          }
          var color = instruction.highlightColor || '#eeff41';
          var tables = newSlide.getTables();
          for (var t = 0; t < tables.length; t++) {
            var table = tables[t];
            var numRows = table.getNumRows();
            var numCols = table.getNumColumns();
            for (var r = 0; r < numRows; r++) {
              for (var c = 0; c < numCols; c++) {
                var cell = table.getCell(r, c);
                var num = parseInt(cell.getText().asString().trim(), 10);
                if (!isNaN(num) && targetNums[num]) {
                  cell.getFill().setSolidFill(color);
                }
              }
            }
          }
        }
      }
    }
    
    // 6. Clean up: Delete all the original master library slides from the top of the deck
    for (var k = 0; k < originalSlides.length; k++) {
      originalSlides[k].remove();
    }
    
    // 7. Save changes
    presentation.saveAndClose();

    // 7.2 Set permissions so any user with the link can view and make a copy (or edit if permitted)
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    } catch (sharingErr) {
      try {
        newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (viewSharingErr) {
        // Domain policy restrictions
      }
    }

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
          pptxUrl = "https://drive.google.com/uc?export=download&id=" + pptxFile.getId();
          pptxId = pptxFile.getId();
        }
      } catch (pptxErr) {
        Logger.log("PowerPoint export failed: " + pptxErr.toString());
      }
    }
    
    // 8. Return success response
    var presentationUrl = newFile.getUrl();
    var copyUrl = "https://docs.google.com/presentation/d/" + newFile.getId() + "/copy";

    var responsePayload = {
      status: "success",
      message: "Presentation assembled successfully.",
      url: presentationUrl,
      copyUrl: copyUrl,
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

// Simple GET response for browser testing (and forces MailApp permission check when clicked with 'Run' in the editor)
function doGet(e) {
  var remainingQuota = MailApp.getRemainingDailyQuota();
  return ContentService.createTextOutput("The Slide Assembly API is active and listening for POST requests. Remaining email quota: " + remainingQuota);
}

/**
 * Handles "Get in touch" contact form submissions with anti-spam protections:
 * 1. Honeypot check (silent drop if hidden field is populated)
 * 2. Minimum elapsed time check (silent drop if submitted in < 2 seconds)
 * 3. Server-side rate limiting via CacheService (cooldown & hourly cap)
 * 4. Input sanitization and MailApp delivery to owner's email
 */
function handleContactSubmission(requestData) {
  requestData = requestData || {};
  // 1. Honeypot check: If a bot filled out the hidden field, pretend it succeeded
  if (requestData.honeypot && String(requestData.honeypot).trim() !== "") {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Thank you! Your message has been sent."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Submission speed check: Reject automated instant submissions (< 2 seconds)
  if (requestData.elapsedMs !== undefined && Number(requestData.elapsedMs) < 2000) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Thank you! Your message has been sent."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Validate & sanitize inputs
  var name = String(requestData.name || "Anonymous").trim().substring(0, 100);
  var email = String(requestData.email || "").trim().substring(0, 150);
  var category = String(requestData.category || "Feedback").trim().substring(0, 60);
  var message = String(requestData.message || "").trim().substring(0, 3000);

  if (!message) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Please enter a message before sending."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 4. Server-side rate limiting via CacheService to protect email quota
  try {
    var cache = CacheService.getScriptCache();
    if (cache) {
      var recentBurst = cache.get("contact_cooldown");
      if (recentBurst) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Please wait a moment before sending another message."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var hourlyCount = Number(cache.get("contact_hourly_count") || "0");
      if (hourlyCount >= 15) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Message limit reached for now. Please try again later."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Set 20-second cooldown between messages & increment 1-hour counter
      cache.put("contact_cooldown", "1", 20);
      cache.put("contact_hourly_count", String(hourlyCount + 1), 3600);
    }
  } catch (cacheErr) {
    // Continue if CacheService is unavailable
  }

  // 5. Check remaining daily email quota
  var remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Daily email limit reached. Please try again tomorrow."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 6. Send email to the script owner (email address is never exposed in code)
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var subject = "[Daily Deck - " + category + "] Message from " + name;
  var body = [
    "New message from Daily Deck Contact Form",
    "----------------------------------------",
    "Name: " + name,
    "Email: " + (email ? email : "Not provided"),
    "Category: " + category,
    "Sent: " + new Date().toString(),
    "----------------------------------------",
    "",
    message
  ].join("\n");

  var mailOptions = {};
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mailOptions.replyTo = email;
  }

  MailApp.sendEmail(ownerEmail, subject, body, mailOptions);

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Thank you! Your message has been sent."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Universal Slide Action / Mutation Engine
 * 
 * Executes declarative visual operations on slide elements:
 * - Table cells: Fill background, font color, bold text by matching cell content or coordinates.
 * - Shapes/Images/Groups: Fill background, border stroke, text color, replace text, or remove elements by Alt Text Title/Description.
 * - Shapes by token/text: Fill or remove shapes containing specific marker text.
 */
function applySlideActions(newSlide, actions) {
  if (!actions || !actions.length) return;

  for (var a = 0; a < actions.length; a++) {
    var act = actions[a];
    if (!act) continue;

    var targetType = act.target || act.type;

    // 1. Target: Table Cells by matching text or number
    // Example: { target: 'tableCell', matchText: ['6', '12', '18'], fill: '#eeff41' }
    if (targetType === 'tableCell' || targetType === 'tableCellByText' || targetType === 'fillTableCellByText') {
      var matchMap = {};
      if (Array.isArray(act.matchText)) {
        for (var m = 0; m < act.matchText.length; m++) {
          matchMap[String(act.matchText[m]).trim()] = true;
        }
      } else if (act.matchText !== undefined) {
        matchMap[String(act.matchText).trim()] = true;
      }

      var tables = newSlide.getTables();
      for (var t = 0; t < tables.length; t++) {
        var table = tables[t];
        var numRows = table.getNumRows();
        var numCols = table.getNumColumns();
        for (var r = 0; r < numRows; r++) {
          for (var c = 0; c < numCols; c++) {
            var cell = table.getCell(r, c);
            var cellStr = cell.getText().asString().trim();
            if (matchMap[cellStr]) {
              if (act.fill) {
                cell.getFill().setSolidFill(act.fill);
              }
              if (act.textColor) {
                cell.getText().getTextStyle().setForegroundColor(act.textColor);
              }
              if (act.bold !== undefined) {
                cell.getText().getTextStyle().setBold(act.bold);
              }
            }
          }
        }
      }
    }

    // 2. Target: Table Cell by Row / Column Coordinate
    // Example: { target: 'tableCellByCoordinate', row: 1, col: 2, fill: '#3b82f6', textColor: '#ffffff' }
    else if (targetType === 'tableCellByCoordinate') {
      var tables = newSlide.getTables();
      var tIdx = act.tableIndex || 0;
      if (tables.length > tIdx) {
        var table = tables[tIdx];
        if (act.row >= 0 && act.row < table.getNumRows() && act.col >= 0 && act.col < table.getNumColumns()) {
          var cell = table.getCell(act.row, act.col);
          if (act.fill) {
            cell.getFill().setSolidFill(act.fill);
          }
          if (act.textColor) {
            cell.getText().getTextStyle().setForegroundColor(act.textColor);
          }
          if (act.bold !== undefined) {
            cell.getText().getTextStyle().setBold(act.bold);
          }
          if (act.text !== undefined) {
            cell.getText().setText(act.text);
          }
        }
      }
    }

    // 3. Target: Shape / Element by Alt Text Title or Description
    // Example: { target: 'shapeByName', name: 'counter_3', fill: '#ef4444' }
    // Example: { target: 'shapeByName', name: 'solution_box', remove: true }
    else if (targetType === 'shapeByName' || targetType === 'shapeByTitle') {
      var targetNames = {};
      if (Array.isArray(act.name)) {
        for (var n = 0; n < act.name.length; n++) {
          targetNames[String(act.name[n]).trim().toLowerCase()] = true;
        }
      } else if (act.name !== undefined) {
        targetNames[String(act.name).trim().toLowerCase()] = true;
      }

      var allElements = getAllSlideElements(newSlide);
      for (var e = 0; e < allElements.length; e++) {
        var el = allElements[e];
        var title = (el.getTitle() || '').trim().toLowerCase();
        var desc = (el.getDescription() || '').trim().toLowerCase();

        if (targetNames[title] || targetNames[desc]) {
          if (act.remove === true || act.visible === false) {
            try { el.remove(); } catch(err) {}
            continue;
          }
          if (el.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
            var sh = el.asShape();
            if (act.fill) {
              sh.getFill().setSolidFill(act.fill);
            }
            if (act.stroke) {
              sh.getBorder().getLineFill().setSolidFill(act.stroke);
            }
            if (act.strokeWeight !== undefined) {
              sh.getBorder().setWeight(act.strokeWeight);
            }
            if (act.text !== undefined) {
              sh.getText().setText(act.text);
            }
            if (act.textColor) {
              sh.getText().getTextStyle().setForegroundColor(act.textColor);
            }
          }
        }
      }
    }

    // 4. Target: Shape by Text / Token Match
    // Example: { target: 'shapeByText', matchText: '{{counter_1}}', fill: '#10b981', clearText: true }
    else if (targetType === 'shapeByText') {
      var allElements = getAllSlideElements(newSlide);
      var matchText = String(act.matchText || act.token || '').trim();
      if (matchText) {
        for (var e = 0; e < allElements.length; e++) {
          var el = allElements[e];
          if (el.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
            var sh = el.asShape();
            var txt = sh.getText().asString();
            if (txt.indexOf(matchText) !== -1) {
              if (act.remove === true || act.visible === false) {
                try { el.remove(); } catch(err) {}
                continue;
              }
              if (act.fill) {
                sh.getFill().setSolidFill(act.fill);
              }
              if (act.stroke) {
                sh.getBorder().getLineFill().setSolidFill(act.stroke);
              }
              if (act.clearText) {
                sh.getText().setText('');
              } else if (act.text !== undefined) {
                sh.getText().setText(act.text);
              }
              if (act.textColor) {
                sh.getText().getTextStyle().setForegroundColor(act.textColor);
              }
            }
          }
        }
      }
    }

    // 5. Target: MAB Blocks Dynamic Layout (Number - MAB blocks activity)
    // Example: { target: 'mabLayout', counts: { MAB_1000: 1, MAB_100: 2, MAB_10: 3, MAB_1: 4 } }
    else if (targetType === 'mabLayout') {
      var counts = act.counts || {};
      var orderKeys = ['MAB_1000', 'MAB_100', 'MAB_10', 'MAB_1'];
      var allElements = getAllSlideElements(newSlide);
      var seeds = {};

      for (var e = 0; e < allElements.length; e++) {
        var el = allElements[e];
        var title = (el.getTitle() || '').trim().toUpperCase();
        var desc = (el.getDescription() || '').trim().toUpperCase();
        for (var k = 0; k < orderKeys.length; k++) {
          var key = orderKeys[k];
          if (!seeds[key] && (title === key || desc === key)) {
            seeds[key] = {
              el: el,
              w: el.getWidth(),
              h: el.getHeight(),
              left: el.getLeft(),
              top: el.getTop()
            };
          }
        }
      }

      var zoneTop = 9999;
      var zoneBottom = 0;
      for (var k = 0; k < orderKeys.length; k++) {
        var s = seeds[orderKeys[k]];
        if (s) {
          if (s.top < zoneTop) zoneTop = s.top;
          if (s.top + s.h > zoneBottom) zoneBottom = s.top + s.h;
        }
      }
      if (zoneTop === 9999) zoneTop = 35;
      if (zoneBottom <= zoneTop) zoneBottom = 325;
      var zoneHeight = Math.max(120, zoneBottom - zoneTop);

      var pageWidth = 720;
      try {
        pageWidth = newSlide.getParentPresentation().getPageWidth() || 720;
      } catch (pwErr) {}
      var maxAllowedWidth = pageWidth * 0.86;

      var activeGroups = [];
      for (var k = 0; k < orderKeys.length; k++) {
        var key = orderKeys[k];
        var seed = seeds[key];
        var count = Math.max(0, parseInt(counts[key], 10) || 0);

        if (!seed) continue;

        if (count <= 0) {
          try { seed.el.remove(); } catch (remErr) {}
          continue;
        }

        var rawW = 0;
        var rawH = 0;
        var hGap = 0;
        var vGap = 0;
        var extra5 = 0;

        if (key === 'MAB_1') {
          var cols = Math.ceil(count / 5);
          var rows = Math.min(count, 5);
          hGap = seed.w * 0.28;
          vGap = seed.h * 0.18;
          rawW = cols * seed.w + (cols - 1) * hGap;
          rawH = rows * seed.h + (rows - 1) * vGap;
        } else if (key === 'MAB_10') {
          hGap = seed.w * 0.25;
          extra5 = count > 5 ? seed.w * 0.30 : 0;
          rawW = count * seed.w + (count - 1) * hGap + extra5;
          rawH = seed.h;
        } else {
          hGap = seed.w * 0.08;
          rawW = count * seed.w + (count - 1) * hGap;
          rawH = seed.h;
        }

        activeGroups.push({
          key: key,
          seed: seed,
          count: count,
          rawW: rawW,
          rawH: rawH,
          hGap: hGap,
          vGap: vGap,
          extra5: extra5
        });
      }

      if (activeGroups.length > 0) {
        var baseGroupGap = 28;
        var totalRawWidth = 0;
        var maxRawHeight = 0;

        for (var g = 0; g < activeGroups.length; g++) {
          totalRawWidth += activeGroups[g].rawW;
          if (activeGroups[g].rawH > maxRawHeight) {
            maxRawHeight = activeGroups[g].rawH;
          }
        }
        totalRawWidth += (activeGroups.length - 1) * baseGroupGap;

        var scale = Math.min(
          1.0,
          totalRawWidth > 0 ? (maxAllowedWidth / totalRawWidth) : 1.0,
          maxRawHeight > 0 ? (zoneHeight / maxRawHeight) : 1.0
        );

        var totalScaledWidth = totalRawWidth * scale;
        var maxScaledHeight = maxRawHeight * scale;
        var scaledGroupGap = baseGroupGap * scale;

        var curX = (pageWidth - totalScaledWidth) / 2;
        var baselineY = Math.min(zoneBottom, zoneTop + (zoneHeight + maxScaledHeight) / 2);

        for (var g = 0; g < activeGroups.length; g++) {
          var grp = activeGroups[g];
          var instances = [];
          for (var d = 0; d < grp.count - 1; d++) {
            try {
              instances.push(grp.seed.el.duplicate());
            } catch (dupErr) {}
          }
          instances.push(grp.seed.el);

          var scaledW = grp.seed.w * scale;
          var scaledH = grp.seed.h * scale;
          var scaledHGap = grp.hGap * scale;
          var scaledVGap = grp.vGap * scale;
          var scaledExtra5 = grp.extra5 * scale;

          for (var idx = 0; idx < instances.length; idx++) {
            var inst = instances[idx];
            var itemLeft = curX;
            var itemTop = baselineY - scaledH;

            if (grp.key === 'MAB_1') {
              var col = Math.floor(idx / 5);
              var rowFromBottom = idx % 5;
              itemLeft = curX + col * (scaledW + scaledHGap);
              itemTop = baselineY - scaledH - rowFromBottom * (scaledH + scaledVGap);
            } else {
              itemLeft = curX + idx * (scaledW + scaledHGap) + (grp.key === 'MAB_10' && idx >= 5 ? scaledExtra5 : 0);
              itemTop = baselineY - scaledH;
            }

            try {
              inst.setWidth(scaledW);
              inst.setHeight(scaledH);
              inst.setLeft(itemLeft);
              inst.setTop(itemTop);
            } catch (posErr) {}
          }

          curX += (grp.rawW * scale) + scaledGroupGap;
        }
      }
    }
  }
}

/**
 * Recursively collects all elements from a slide (including children inside Groups)
 */
function getAllSlideElements(slide) {
  var results = [];
  var topLevel = slide.getPageElements();
  for (var i = 0; i < topLevel.length; i++) {
    collectElementsRecursive(topLevel[i], results);
  }
  return results;
}

function collectElementsRecursive(element, results) {
  results.push(element);
  if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
    try {
      var children = element.asGroup().getChildren();
      for (var c = 0; c < children.length; c++) {
        collectElementsRecursive(children[c], results);
      }
    } catch(gErr) {}
  }
}
