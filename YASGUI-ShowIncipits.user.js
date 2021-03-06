// ==UserScript==
// @name YASGUI-Verovio
// @description  Render incipits and score images in YASGUI
// @author David M. Weigl
// @homepageURL https://github.com/musicog/YASGUI-ShowIncipits
// @version  1
// @run-at document-idle
// @include  http://yasgui.org/*
// @include  https://yasgui.org/*
// @include  http://linkeddata.uni-muenster.de:7200/sparql
// @require  http://www.verovio.org/javascript/latest/verovio-toolkit.js
// ==/UserScript==


// check if we are on lum sparql endpoint
var isLum = (window.location.href === "http://linkeddata.uni-muenster.de:7200/sparql");

// if so, input format is musicxml, otherwise Plaine&Easie
var inputFormat = isLum ? 'xml' : 'pae';

// set verovio options
const vrvOptions = {
  inputFormat: inputFormat,
  pageHeight: 2970,
  pageWidth: 1400,
  spacingStaff: 0,
  pageMarginBottom: 20,
  pageMarginLeft: 20,
  pageMarginRight: 20,
  pageMarginTop: 20,
  adjustPageHeight: 1,
  scale: 45,
  xmlIdSeed: 1
};

// create verovio toolkit instance
var vrvToolkit = new verovio.toolkit();
tick();

function tick() { 
	// if this page contains table headers (e.g. of the YASGUI results table)
  const tableHeaders = document.querySelectorAll("th.sorting");
  if(tableHeaders.length) {
    // try and find a column header called "incipit"
    let incipitColumnIndex;
    tableHeaders.forEach( (header, index) => {
      if(header.firstChild.innerText === "incipit") { 
        // found one! remember its column index
        incipitColumnIndex = index;
      }
    });
    if(incipitColumnIndex) { 
      // if we found an incipit column ...
      // work through all the rows
      const rows = document.querySelectorAll("tr"); 
      rows.forEach( (row, index) => { 
        if(index === 0) { return } // skip header row
        // grab the incipit column's contents
        const incipitCell = row.children.item(incipitColumnIndex+1);
        if(incipitCell.firstChild.nodeName === "svg") { 
          // we've already converted this one, so skip ahead
          return 
        }

        // define input data depending on the input format
        var vrvData = row.children.item(incipitColumnIndex+1).innerText;
        if(!isLum) {
          vrvData = "@clef:G-2\n\@keysig:\n\@timesig:\n\@data:" + vrvData + "\n" ;
        }
        // ask Verovio to make us an SVG
        incipitCell.innerHTML = vrvToolkit.renderData(vrvData, vrvOptions);

        // extract the MEI data from Verovio Toolkit and append it to the row
        const meiData = vrvToolkit.getMEI();
        appendMEIButton(incipitCell, meiData, index);
      })
    }
  } 
  // repeat every second (so that we can catch the results of a new query)
  setTimeout( () => { tick() }, 1000);
}

function appendMEIButton(incipitCell, meiData, index) {
  // create a button to ask for MEI output
  const button = document.createElement("BUTTON");
  const buttonTextNode = document.createTextNode("Show MEI");
  button.appendChild(buttonTextNode);
  button.setAttribute("id", "mei-button-" + index);

  // add event handler to show MEI data
  button.addEventListener("click", () => {
    showMEI(incipitCell, meiData, index)
  });

  // append button to cell
  incipitCell.appendChild(button);
}

function showMEI(incipitCell, meiData, index) {
  // create a textarea to output MEI data
  const textarea = document.createElement("TEXTAREA");
  const meiTextNode = document.createTextNode(meiData);
  textarea.appendChild(meiTextNode);
  textarea.setAttribute("id", "mei-textarea-" + index);
  textarea.setAttribute("rows", "12");
  textarea.setAttribute("cols", "90");

  // append textarea to cell
  incipitCell.appendChild(textarea);
}
