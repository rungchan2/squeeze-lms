ECMAScript Modules

The ECMAScript Module build is saved to xlsx.mjs and can be directly added to a page with a script tag using type=module:

<script type="module">
import { read, writeFileXLSX } from "./xlsx.mjs";

/* load the codepage support library for extended support with older formats  */
import { set_cptable } from "./xlsx.mjs";
import * as cptable from './dist/cpexcel.full.mjs';
set_cptable(cptable);
</script>
The npm package also exposes the module with the module parameter, supported in Angular and other projects:

import { read, writeFileXLSX } from "xlsx";

/* load the codepage support library for extended support with older formats  */
import { set_cptable } from "xlsx";
import * as cptable from 'xlsx/dist/cpexcel.full.mjs';
set_cptable(cptable);
Deno

xlsx.mjs can be imported in Deno. It is available from unpkg:

// @deno-types="https://unpkg.com/xlsx/types/index.d.ts"
import * as XLSX from 'https://unpkg.com/xlsx/xlsx.mjs';

/* load the codepage support library for extended support with older formats  */
import * as cptable from 'https://unpkg.com/xlsx/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);
NodeJS

With npm:

$ npm install xlsx
By default, the module supports require:

var XLSX = require("xlsx");
The module also ships with xlsx.mjs for use with import:

import * as XLSX from 'xlsx/xlsx.mjs';

/* load 'fs' for readFile and writeFile support */
import * as fs from 'fs';
XLSX.set_fs(fs);

/* load 'stream' for stream support */
import { Readable } from 'stream';
XLSX.stream.set_readable(Readable);

/* load the codepage support library for extended support with older formats  */
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';
XLSX.set_cptable(cpexcel);
Photoshop and InDesign

dist/xlsx.extendscript.js is an ExtendScript build for Photoshop and InDesign that is included in the npm package. It can be directly referenced with a #include directive:

#include "xlsx.extendscript.js"
Internet Explorer and ECMAScript 3 Compatibility (click to show)
Usage
Most scenarios involving spreadsheets and data can be broken into 5 parts:

Acquire Data: Data may be stored anywhere: local or remote files, databases, HTML TABLE, or even generated programmatically in the web browser.

Extract Data: For spreadsheet files, this involves parsing raw bytes to read the cell data. For general JS data, this involves reshaping the data.

Process Data: From generating summary statistics to cleaning data records, this step is the heart of the problem.

Package Data: This can involve making a new spreadsheet or serializing with JSON.stringify or writing XML or simply flattening data for UI tools.

Release Data: Spreadsheet files can be uploaded to a server or written locally. Data can be presented to users in an HTML TABLE or data grid.

A common problem involves generating a valid spreadsheet export from data stored in an HTML table. In this example, an HTML TABLE on the page will be scraped, a row will be added to the bottom with the date of the report, and a new file will be generated and downloaded locally. XLSX.writeFile takes care of packaging the data and attempting a local download:

// Acquire Data (reference to the HTML table)
var table_elt = document.getElementById("my-table-id");

// Extract Data (create a workbook object from the table)
var workbook = XLSX.utils.table_to_book(table_elt);

// Process Data (add a new row)
var ws = workbook.Sheets["Sheet1"];
XLSX.utils.sheet_add_aoa(ws, [["Created "+new Date().toISOString()]], {origin:-1});

// Package and Release Data (`writeFile` tries to write and save an XLSB file)
XLSX.writeFile(workbook, "Report.xlsb");
This library tries to simplify steps 2 and 4 with functions to extract useful data from spreadsheet files (read / readFile) and generate new spreadsheet files from data (write / writeFile). Additional utility functions like table_to_book work with other common data sources like HTML tables.

This documentation and various demo projects cover a number of common scenarios and approaches for steps 1 and 5.

Utility functions help with step 3.

"Acquiring and Extracting Data" describes solutions for common data import scenarios.

"Packaging and Releasing Data" describes solutions for common data export scenarios.

"Processing Data" describes solutions for common workbook processing and manipulation scenarios.

"Utility Functions" details utility functions for translating JSON Arrays and other common JS structures into worksheet objects.

The Zen of SheetJS
Data processing should fit in any workflow

The library does not impose a separate lifecycle. It fits nicely in websites and apps built using any framework. The plain JS data objects play nice with Web Workers and future APIs.

JavaScript is a powerful language for data processing

The "Common Spreadsheet Format" is a simple object representation of the core concepts of a workbook. The various functions in the library provide low-level tools for working with the object.

For friendly JS processing, there are utility functions for converting parts of a worksheet to/from an Array of Arrays. The following example combines powerful JS Array methods with a network request library to download data, select the information we want and create a workbook file:

Get Data from a JSON Endpoint and Generate a Workbook (click to show)
File formats are implementation details

The parser covers a wide gamut of common spreadsheet file formats to ensure that "HTML-saved-as-XLS" files work as well as actual XLS or XLSX files.

The writer supports a number of common output formats for broad compatibility with the data ecosystem.

To the greatest extent possible, data processing code should not have to worry about the specific file formats involved.

JS Ecosystem Demos
The demos directory includes sample projects for:

Frameworks and APIs

angularjs
angular and ionic
knockout
meteor
react and react-native
vue 2.x and weex
XMLHttpRequest and fetch
nodejs server
databases and key/value stores
typed arrays and math
Bundlers and Tooling

browserify
fusebox
parcel
requirejs
rollup
systemjs
typescript
webpack 2.x
Platforms and Integrations

deno
electron application
nw.js application
Chrome / Chromium extensions
Download a Google Sheet locally
Adobe ExtendScript
Headless Browsers
canvas-datagrid
x-spreadsheet
react-data-grid
vue3-table-light
Swift JSC and other engines
"serverless" functions
internet explorer
Other examples are included in the showcase.

https://sheetjs.com/demos/modify.html shows a complete example of reading, modifying, and writing files.

https://github.com/SheetJS/sheetjs/blob/HEAD/bin/xlsx.njs is the command-line tool included with node installations, reading spreadsheet files and exporting the contents in various formats.

Acquiring and Extracting Data
Parsing Workbooks
API

Extract data from spreadsheet bytes

var workbook = XLSX.read(data, opts);
The read method can extract data from spreadsheet bytes stored in a JS string, "binary string", NodeJS buffer or typed array (Uint8Array or ArrayBuffer).

Read spreadsheet bytes from a local file and extract data

var workbook = XLSX.readFile(filename, opts);
The readFile method attempts to read a spreadsheet file at the supplied path. Browsers generally do not allow reading files in this way (it is deemed a security risk), and attempts to read files in this way will throw an error.

The second opts argument is optional. "Parsing Options" covers the supported properties and behaviors.

Examples

Here are a few common scenarios (click on each subtitle to see the code):

Local file in a NodeJS server (click to show)
Local file in a Deno application (click to show)
User-submitted file in a web page ("Drag-and-Drop") (click to show)
User-submitted file with an HTML INPUT element (click to show)
Fetching a file in the web browser ("Ajax") (click to show)
Local file in a PhotoShop or InDesign plugin (click to show)
Local file in an Electron app (click to show)
Local file in a mobile app with React Native (click to show)
NodeJS Server File Uploads (click to show)
Download files in a NodeJS process (click to show)
Download files in an Electron app (click to show)
Readable Streams in NodeJS (click to show)
ReadableStream in the browser (click to show)
More detailed examples are covered in the included demos

Processing JSON and JS Data
JSON and JS data tend to represent single worksheets. This section will use a few utility functions to generate workbooks.

Create a new Workbook

var workbook = XLSX.utils.book_new();
The book_new utility function creates an empty workbook with no worksheets.

Spreadsheet software generally require at least one worksheet and enforce the requirement in the user interface. This library enforces the requirement at write time, throwing errors if an empty workbook is passed to write functions.

API

Create a worksheet from an array of arrays of JS values

var worksheet = XLSX.utils.aoa_to_sheet(aoa, opts);
The aoa_to_sheet utility function walks an "array of arrays" in row-major order, generating a worksheet object. The following snippet generates a sheet with cell A1 set to the string A1, cell B1 set to B1, etc:

var worksheet = XLSX.utils.aoa_to_sheet([
  ["A1", "B1", "C1"],
  ["A2", "B2", "C2"],
  ["A3", "B3", "C3"]
]);
"Array of Arrays Input" describes the function and the optional opts argument in more detail.

Create a worksheet from an array of JS objects

var worksheet = XLSX.utils.json_to_sheet(jsa, opts);
The json_to_sheet utility function walks an array of JS objects in order, generating a worksheet object. By default, it will generate a header row and one row per object in the array. The optional opts argument has settings to control the column order and header output.

"Array of Objects Input" describes the function and the optional opts argument in more detail.

Examples

"Zen of SheetJS" contains a detailed example "Get Data from a JSON Endpoint and Generate a Workbook"

x-spreadsheet is an interactive data grid for previewing and modifying structured data in the web browser. The xspreadsheet demo includes a sample script with the xtos function for converting from x-spreadsheet data object to a workbook. https://oss.sheetjs.com/sheetjs/x-spreadsheet is a live demo.

Records from a database query (SQL or no-SQL) (click to show)
Numerical Computations with TensorFlow.js (click to show)
Processing HTML Tables
API

Create a worksheet by scraping an HTML TABLE in the page

var worksheet = XLSX.utils.table_to_sheet(dom_element, opts);
The table_to_sheet utility function takes a DOM TABLE element and iterates through the rows to generate a worksheet. The opts argument is optional. "HTML Table Input" describes the function in more detail.

Create a workbook by scraping an HTML TABLE in the page

var workbook = XLSX.utils.table_to_book(dom_element, opts);
The table_to_book utility function follows the same logic as table_to_sheet. After generating a worksheet, it creates a blank workbook and appends the spreadsheet.

The options argument supports the same options as table_to_sheet, with the addition of a sheet property to control the worksheet name. If the property is missing or no options are specified, the default name Sheet1 is used.

Examples

Here are a few common scenarios (click on each subtitle to see the code):

HTML TABLE element in a webpage (click to show)
Chrome/Chromium Extension (click to show)
Server-Side HTML Tables with Headless Chrome (click to show)
Server-Side HTML Tables with Headless WebKit (click to show)
NodeJS HTML Tables without a browser (click to show)
Processing Data
The "Common Spreadsheet Format" is a simple object representation of the core concepts of a workbook. The utility functions work with the object representation and are intended to handle common use cases.

Modifying Workbook Structure
API

Append a Worksheet to a Workbook

XLSX.utils.book_append_sheet(workbook, worksheet, sheet_name);
The book_append_sheet utility function appends a worksheet to the workbook. The third argument specifies the desired worksheet name. Multiple worksheets can be added to a workbook by calling the function multiple times. If the worksheet name is already used in the workbook, it will throw an error.

Append a Worksheet to a Workbook and find a unique name

var new_name = XLSX.utils.book_append_sheet(workbook, worksheet, name, true);
If the fourth argument is true, the function will start with the specified worksheet name. If the sheet name exists in the workbook, a new worksheet name will be chosen by finding the name stem and incrementing the counter:

XLSX.utils.book_append_sheet(workbook, sheetA, "Sheet2", true); // Sheet2
XLSX.utils.book_append_sheet(workbook, sheetB, "Sheet2", true); // Sheet3
XLSX.utils.book_append_sheet(workbook, sheetC, "Sheet2", true); // Sheet4
XLSX.utils.book_append_sheet(workbook, sheetD, "Sheet2", true); // Sheet5
List the Worksheet names in tab order

var wsnames = workbook.SheetNames;
The SheetNames property of the workbook object is a list of the worksheet names in "tab order". API functions will look at this array.

Replace a Worksheet in place

workbook.Sheets[sheet_name] = new_worksheet;
The Sheets property of the workbook object is an object whose keys are names and whose values are worksheet objects. By reassigning to a property of the Sheets object, the worksheet object can be changed without disrupting the rest of the worksheet structure.

Examples

Add a new worksheet to a workbook (click to show)
Modifying Cell Values
API

Modify a single cell value in a worksheet

XLSX.utils.sheet_add_aoa(worksheet, [[new_value]], { origin: address });
Modify multiple cell values in a worksheet

XLSX.utils.sheet_add_aoa(worksheet, aoa, opts);
The sheet_add_aoa utility function modifies cell values in a worksheet. The first argument is the worksheet object. The second argument is an array of arrays of values. The origin key of the third argument controls where cells will be written. The following snippet sets B3=1 and E5="abc":

XLSX.utils.sheet_add_aoa(worksheet, [
  [1],                             // <-- Write 1 to cell B3
  ,                                // <-- Do nothing in row 4
  [/*B5*/, /*C5*/, /*D5*/, "abc"]  // <-- Write "abc" to cell E5
], { origin: "B3" });
"Array of Arrays Input" describes the function and the optional opts argument in more detail.

Examples

Appending rows to a worksheet (click to show)
Modifying Other Worksheet / Workbook / Cell Properties
The "Common Spreadsheet Format" section describes the object structures in greater detail.

Packaging and Releasing Data
Writing Workbooks
API

Generate spreadsheet bytes (file) from data

var data = XLSX.write(workbook, opts);
The write method attempts to package data from the workbook into a file in memory. By default, XLSX files are generated, but that can be controlled with the bookType property of the opts argument. Based on the type option, the data can be stored as a "binary string", JS string, Uint8Array or Buffer.

The second opts argument is required. "Writing Options" covers the supported properties and behaviors.

Generate and attempt to save file

XLSX.writeFile(workbook, filename, opts);
The writeFile method packages the data and attempts to save the new file. The export file format is determined by the extension of filename (SheetJS.xlsx signals XLSX export, SheetJS.xlsb signals XLSB export, etc).

The writeFile method uses platform-specific APIs to initiate the file save. In NodeJS, fs.readFileSync can create a file. In the web browser, a download is attempted using the HTML5 download attribute, with fallbacks for IE.

Generate and attempt to save an XLSX file

XLSX.writeFileXLSX(workbook, filename, opts);
The writeFile method embeds a number of different export functions. This is great for developer experience but not amenable to tree shaking using the current developer tools. When only XLSX exports are needed, this method avoids referencing the other export functions.

The second opts argument is optional. "Writing Options" covers the supported properties and behaviors.

Examples

Local file in a NodeJS server (click to show)
Local file in a Deno application (click to show)
Local file in a PhotoShop or InDesign plugin (click to show)
Download a file in the browser to the user machine (click to show)
Download a file in legacy browsers (click to show)
Browser upload file (ajax) (click to show)
PhantomJS (Headless Webkit) File Generation (click to show)
The included demos cover mobile apps and other special deployments.

Writing Examples
http://sheetjs.com/demos/table.html exporting an HTML table
http://sheetjs.com/demos/writexlsx.html generates a simple file
Streaming Write
The streaming write functions are available in the XLSX.stream object. They take the same arguments as the normal write functions but return a NodeJS Readable Stream.

XLSX.stream.to_csv is the streaming version of XLSX.utils.sheet_to_csv.
XLSX.stream.to_html is the streaming version of XLSX.utils.sheet_to_html.
XLSX.stream.to_json is the streaming version of XLSX.utils.sheet_to_json.
nodejs convert to CSV and write file (click to show)
nodejs write JSON stream to screen (click to show)
Exporting NUMBERS files (click to show)
https://github.com/sheetjs/sheetaki pipes write streams to nodejs response.

Generating JSON and JS Data
JSON and JS data tend to represent single worksheets. The utility functions in this section work with single worksheets.

The "Common Spreadsheet Format" section describes the object structure in more detail. workbook.SheetNames is an ordered list of the worksheet names. workbook.Sheets is an object whose keys are sheet names and whose values are worksheet objects.

The "first worksheet" is stored at workbook.Sheets[workbook.SheetNames[0]].

API

Create an array of JS objects from a worksheet

var jsa = XLSX.utils.sheet_to_json(worksheet, opts);
Create an array of arrays of JS values from a worksheet

var aoa = XLSX.utils.sheet_to_json(worksheet, {...opts, header: 1});
The sheet_to_json utility function walks a workbook in row-major order, generating an array of objects. The second opts argument controls a number of export decisions including the type of values (JS values or formatted text). The "JSON" section describes the argument in more detail.

By default, sheet_to_json scans the first row and uses the values as headers. With the header: 1 option, the function exports an array of arrays of values.

Examples

x-spreadsheet is an interactive data grid for previewing and modifying structured data in the web browser. The xspreadsheet demo includes a sample script with the stox function for converting from a workbook to x-spreadsheet data object. https://oss.sheetjs.com/sheetjs/x-spreadsheet is a live demo.

Previewing data in a React data grid (click to show)
Previewing data in a VueJS data grid (click to show)
Populating a database (SQL or no-SQL) (click to show)
Numerical Computations with TensorFlow.js (click to show)
Generating HTML Tables
API

Generate HTML Table from Worksheet

var html = XLSX.utils.sheet_to_html(worksheet);
The sheet_to_html utility function generates HTML code based on the worksheet data. Each cell in the worksheet is mapped to a <TD> element. Merged cells in the worksheet are serialized by setting colspan and rowspan attributes.

Examples

The sheet_to_html utility function generates HTML code that can be added to any DOM element by setting the innerHTML:

var container = document.getElementById("tavolo");
container.innerHTML = XLSX.utils.sheet_to_html(worksheet);
Combining with fetch, constructing a site from a workbook is straightforward:

Vanilla JS + HTML fetch workbook and generate table previews (click to show)
React fetch workbook and generate HTML table previews (click to show)
VueJS fetch workbook and generate HTML table previews (click to show)
Generating Single-Worksheet Snapshots
The sheet_to_* functions accept a worksheet object.

API

Generate a CSV from a single worksheet

var csv = XLSX.utils.sheet_to_csv(worksheet, opts);
This snapshot is designed to replicate the "CSV UTF8 (.csv)" output type. "Delimiter-Separated Output" describes the function and the optional opts argument in more detail.

Generate "Text" from a single worksheet

var txt = XLSX.utils.sheet_to_txt(worksheet, opts);
This snapshot is designed to replicate the "UTF16 Text (.txt)" output type. "Delimiter-Separated Output" describes the function and the optional opts argument in more detail.

Generate a list of formulae from a single worksheet

var fmla = XLSX.utils.sheet_to_formulae(worksheet);
This snapshot generates an array of entries representing the embedded formulae. Array formulae are rendered in the form range=formula while plain cells are rendered in the form cell=formula or value. String literals are prefixed with an apostrophe ', consistent with Excel's formula bar display.

"Formulae Output" describes the function in more detail.

Interface
XLSX is the exposed variable in the browser and the exported node variable

XLSX.version is the version of the library (added by the build script).

XLSX.SSF is an embedded version of the format library.

Parsing functions
XLSX.read(data, read_opts) attempts to parse data.

XLSX.readFile(filename, read_opts) attempts to read filename and parse.

Parse options are described in the Parsing Options section.

Writing functions
XLSX.write(wb, write_opts) attempts to write the workbook wb

XLSX.writeFile(wb, filename, write_opts) attempts to write wb to filename. In browser-based environments, it will attempt to force a client-side download.

XLSX.writeFileAsync(wb, filename, o, cb) attempts to write wb to filename. If o is omitted, the writer will use the third argument as the callback.

XLSX.stream contains a set of streaming write functions.

Write options are described in the Writing Options section.

Utilities
Utilities are available in the XLSX.utils object and are described in the Utility Functions section:

Constructing:

book_new creates an empty workbook
book_append_sheet adds a worksheet to a workbook
Importing:

aoa_to_sheet converts an array of arrays of JS data to a worksheet.
json_to_sheet converts an array of JS objects to a worksheet.
table_to_sheet converts a DOM TABLE element to a worksheet.
sheet_add_aoa adds an array of arrays of JS data to an existing worksheet.
sheet_add_json adds an array of JS objects to an existing worksheet.
Exporting:

sheet_to_json converts a worksheet object to an array of JSON objects.
sheet_to_csv generates delimiter-separated-values output.
sheet_to_txt generates UTF16 formatted text.
sheet_to_html generates HTML output.
sheet_to_formulae generates a list of the formulae (with value fallbacks).
Cell and cell address manipulation:

format_cell generates the text value for a cell (using number formats).
encode_row / decode_row converts between 0-indexed rows and 1-indexed rows.
encode_col / decode_col converts between 0-indexed columns and column names.
encode_cell / decode_cell converts cell addresses.
encode_range / decode_range converts cell ranges.
Common Spreadsheet Format
SheetJS conforms to the Common Spreadsheet Format (CSF):

General Structures
Cell address objects are stored as {c:C, r:R} where C and R are 0-indexed column and row numbers, respectively. For example, the cell address B5 is represented by the object {c:1, r:4}.

Cell range objects are stored as {s:S, e:E} where S is the first cell and E is the last cell in the range. The ranges are inclusive. For example, the range A3:B7 is represented by the object {s:{c:0, r:2}, e:{c:1, r:6}}. Utility functions perform a row-major order walk traversal of a sheet range:

for(var R = range.s.r; R <= range.e.r; ++R) {
  for(var C = range.s.c; C <= range.e.c; ++C) {
    var cell_address = {c:C, r:R};
    /* if an A1-style address is needed, encode the address */
    var cell_ref = XLSX.utils.encode_cell(cell_address);
  }
}
Cell Object
Cell objects are plain JS objects with keys and values following the convention:

Key	Description
v	raw value (see Data Types section for more info)
w	formatted text (if applicable)
t	type: b Boolean, e Error, n Number, d Date, s Text, z Stub
f	cell formula encoded as an A1-style string (if applicable)
F	range of enclosing array if formula is array formula (if applicable)
D	if true, array formula is dynamic (if applicable)
r	rich text encoding (if applicable)
h	HTML rendering of the rich text (if applicable)
c	comments associated with the cell
z	number format string associated with the cell (if requested)
l	cell hyperlink object (.Target holds link, .Tooltip is tooltip)
s	the style/theme of the cell (if applicable)
Built-in export utilities (such as the CSV exporter) will use the w text if it is available. To change a value, be sure to delete cell.w (or set it to undefined) before attempting to export. The utilities will regenerate the w text from the number format (cell.z) and the raw value if possible.

The actual array formula is stored in the f field of the first cell in the array range. Other cells in the range will omit the f field.

Data Types
The raw value is stored in the v value property, interpreted based on the t type property. This separation allows for representation of numbers as well as numeric text. There are 6 valid cell types:

Type	Description
b	Boolean: value interpreted as JS boolean
e	Error: value is a numeric code and w property stores common name **
n	Number: value is a JS number **
d	Date: value is a JS Date object or string to be parsed as Date **
s	Text: value interpreted as JS string and written as text **
z	Stub: blank stub cell that is ignored by data processing utilities **
Error values and interpretation (click to show)
Type n is the Number type. This includes all forms of data that Excel stores as numbers, such as dates/times and Boolean fields. Excel exclusively uses data that can be fit in an IEEE754 floating point number, just like JS Number, so the v field holds the raw number. The w field holds formatted text. Dates are stored as numbers by default and converted with XLSX.SSF.parse_date_code.

Type d is the Date type, generated only when the option cellDates is passed. Since JSON does not have a natural Date type, parsers are generally expected to store ISO 8601 Date strings like you would get from date.toISOString(). On the other hand, writers and exporters should be able to handle date strings and JS Date objects. Note that Excel disregards timezone modifiers and treats all dates in the local timezone. The library does not correct for this error.

Type s is the String type. Values are explicitly stored as text. Excel will interpret these cells as "number stored as text". Generated Excel files automatically suppress that class of error, but other formats may elicit errors.

Type z represents blank stub cells. They are generated in cases where cells have no assigned value but hold comments or other metadata. They are ignored by the core library data processing utility functions. By default these cells are not generated; the parser sheetStubs option must be set to true.

Dates
Excel Date Code details (click to show)
Time Zones and Dates (click to show)
Epochs: 1900 and 1904 (click to show)
Sheet Objects
Each key that does not start with ! maps to a cell (using A-1 notation)

sheet[address] returns the cell object for the specified address.

Special sheet keys (accessible as sheet[key], each starting with !):

sheet['!ref']: A-1 based range representing the sheet range. Functions that work with sheets should use this parameter to determine the range. Cells that are assigned outside of the range are not processed. In particular, when writing a sheet by hand, cells outside of the range are not included

Functions that handle sheets should test for the presence of !ref field. If the !ref is omitted or is not a valid range, functions are free to treat the sheet as empty or attempt to guess the range. The standard utilities that ship with this library treat sheets as empty (for example, the CSV output is empty string).

When reading a worksheet with the sheetRows property set, the ref parameter will use the restricted range. The original range is set at ws['!fullref']

sheet['!margins']: Object representing the page margins. The default values follow Excel's "normal" preset. Excel also has a "wide" and a "narrow" preset but they are stored as raw measurements. The main properties are listed below:

Page margin details (click to show)
Worksheet Object
In addition to the base sheet keys, worksheets also add:

ws['!cols']: array of column properties objects. Column widths are actually stored in files in a normalized manner, measured in terms of the "Maximum Digit Width" (the largest width of the rendered digits 0-9, in pixels). When parsed, the column objects store the pixel width in the wpx field, character width in the wch field, and the maximum digit width in the MDW field.

ws['!rows']: array of row properties objects as explained later in the docs. Each row object encodes properties including row height and visibility.

ws['!merges']: array of range objects corresponding to the merged cells in the worksheet. Plain text formats do not support merge cells. CSV export will write all cells in the merge range if they exist, so be sure that only the first cell (upper-left) in the range is set.

ws['!outline']: configure how outlines should behave. Options default to the default settings in Excel 2019:

key	Excel feature	default
above	Uncheck "Summary rows below detail"	false
left	Uncheck "Summary rows to the right of detail"	false
ws['!protect']: object of write sheet protection properties. The password key specifies the password for formats that support password-protected sheets (XLSX/XLSB/XLS). The writer uses the XOR obfuscation method. The following keys control the sheet protection -- set to false to enable a feature when sheet is locked or set to true to disable a feature:
Worksheet Protection Details (click to show)
ws['!autofilter']: AutoFilter object following the schema:
type AutoFilter = {
  ref:string; // A-1 based range representing the AutoFilter table range
}
Chartsheet Object
Chartsheets are represented as standard sheets. They are distinguished with the !type property set to "chart".

The underlying data and !ref refer to the cached data in the chartsheet. The first row of the chartsheet is the underlying header.

Macrosheet Object
Macrosheets are represented as standard sheets. They are distinguished with the !type property set to "macro".

Dialogsheet Object
Dialogsheets are represented as standard sheets. They are distinguished with the !type property set to "dialog".

Workbook Object
workbook.SheetNames is an ordered list of the sheets in the workbook

wb.Sheets[sheetname] returns an object representing the worksheet.

wb.Props is an object storing the standard properties. wb.Custprops stores custom properties. Since the XLS standard properties deviate from the XLSX standard, XLS parsing stores core properties in both places.

wb.Workbook stores workbook-level attributes.

Workbook File Properties
The various file formats use different internal names for file properties. The workbook Props object normalizes the names:

File Properties (click to show)
For example, to set the workbook title property:

if(!wb.Props) wb.Props = {};
wb.Props.Title = "Insert Title Here";
Custom properties are added in the workbook Custprops object:

if(!wb.Custprops) wb.Custprops = {};
wb.Custprops["Custom Property"] = "Custom Value";
Writers will process the Props key of the options object:

/* force the Author to be "SheetJS" */
XLSX.write(wb, {Props:{Author:"SheetJS"}});
Workbook-Level Attributes
wb.Workbook stores workbook-level attributes.

Defined Names
wb.Workbook.Names is an array of defined name objects which have the keys:

Defined Name Properties (click to show)
Excel allows two sheet-scoped defined names to share the same name. However, a sheet-scoped name cannot collide with a workbook-scope name. Workbook writers may not enforce this constraint.

Workbook Views
wb.Workbook.Views is an array of workbook view objects which have the keys:

Key	Description
RTL	If true, display right-to-left
Miscellaneous Workbook Properties
wb.Workbook.WBProps holds other workbook properties:

Key	Description
CodeName	VBA Project Workbook Code Name
date1904	epoch: 0/false for 1900 system, 1/true for 1904
filterPrivacy	Warn or strip personally identifying info on save
Document Features
Even for basic features like date storage, the official Excel formats store the same content in different ways. The parsers are expected to convert from the underlying file format representation to the Common Spreadsheet Format. Writers are expected to convert from CSF back to the underlying file format.

Formulae
The A1-style formula string is stored in the f field. Even though different file formats store the formulae in different ways, the formats are translated. Even though some formats store formulae with a leading equal sign, CSF formulae do not start with =.

Formulae File Format Support (click to show)
Single-Cell Formulae

For simple formulae, the f key of the desired cell can be set to the actual formula text. This worksheet represents A1=1, A2=2, and A3=A1+A2:

var worksheet = {
  "!ref": "A1:A3",
  A1: { t:'n', v:1 },
  A2: { t:'n', v:2 },
  A3: { t:'n', v:3, f:'A1+A2' }
};
Utilities like aoa_to_sheet will accept cell objects in lieu of values:

var worksheet = XLSX.utils.aoa_to_sheet([
  [ 1 ], // A1
  [ 2 ], // A2
  [ {t: "n", v: 3, f: "A1+A2"} ] // A3
]);
Cells with formula entries but no value will be serialized in a way that Excel and other spreadsheet tools will recognize. This library will not automatically compute formula results! For example, the following worksheet will include the BESSELJ function but the result will not be available in JavaScript:

var worksheet = XLSX.utils.aoa_to_sheet([
  [ 3.14159, 2 ], // Row "1"
  [ { t:'n', f:'BESSELJ(A1,B1)' } ] // Row "2" will be calculated on file open
}
If the actual results are needed in JS, SheetJS Pro offers a formula calculator component for evaluating expressions, updating values and dependent cells, and refreshing entire workbooks.

Array Formulae

Assign an array formula

XLSX.utils.sheet_set_array_formula(worksheet, range, formula);
Array formulae are stored in the top-left cell of the array block. All cells of an array formula have a F field corresponding to the range. A single-cell formula can be distinguished from a plain formula by the presence of F field.

For example, setting the cell C1 to the array formula {=SUM(A1:A3*B1:B3)}:

// API function
XLSX.utils.sheet_set_array_formula(worksheet, "C1", "SUM(A1:A3*B1:B3)");

// ... OR raw operations
worksheet['C1'] = { t:'n', f: "SUM(A1:A3*B1:B3)", F:"C1:C1" };
For a multi-cell array formula, every cell has the same array range but only the first cell specifies the formula. Consider D1:D3=A1:A3*B1:B3:

// API function
XLSX.utils.sheet_set_array_formula(worksheet, "D1:D3", "A1:A3*B1:B3");

// ... OR raw operations
worksheet['D1'] = { t:'n', F:"D1:D3", f:"A1:A3*B1:B3" };
worksheet['D2'] = { t:'n', F:"D1:D3" };
worksheet['D3'] = { t:'n', F:"D1:D3" };
Utilities and writers are expected to check for the presence of a F field and ignore any possible formula element f in cells other than the starting cell. They are not expected to perform validation of the formulae!

Dynamic Array Formulae

Assign a dynamic array formula

XLSX.utils.sheet_set_array_formula(worksheet, range, formula, true);
Released in 2020, Dynamic Array Formulae are supported in the XLSX/XLSM and XLSB file formats. They are represented like normal array formulae but have special cell metadata indicating that the formula should be allowed to adjust the range.

An array formula can be marked as dynamic by setting the cell's D property to true. The F range is expected but can be the set to the current cell:

// API function
XLSX.utils.sheet_set_array_formula(worksheet, "C1", "_xlfn.UNIQUE(A1:A3)", 1);

// ... OR raw operations
worksheet['C1'] = { t: "s", f: "_xlfn.UNIQUE(A1:A3)", F:"C1", D: 1 }; // dynamic
Localization with Function Names

SheetJS operates at the file level. Excel stores formula expressions using the English (United States) function names. For non-English users, Excel uses a localized set of function names.

For example, when the computer language and region is set to French (France), Excel interprets =SOMME(A1:C3) as if SOMME is the SUM function. However, in the actual file, Excel stores SUM(A1:C3).

Prefixed "Future Functions"

Functions introduced in newer versions of Excel are prefixed with _xlfn. when stored in files. When writing formula expressions using these functions, the prefix is required for maximal compatibility:

// Broadest compatibility
XLSX.utils.sheet_set_array_formula(worksheet, "C1", "_xlfn.UNIQUE(A1:A3)", 1);

// Can cause errors in spreadsheet software
XLSX.utils.sheet_set_array_formula(worksheet, "C1", "UNIQUE(A1:A3)", 1);
When reading a file, the xlfn option preserves the prefixes.

Functions requiring `_xlfn.` prefix (click to show)
Row and Column Properties
Format Support (click to show)
Row and Column properties are not extracted by default when reading from a file and are not persisted by default when writing to a file. The option cellStyles: true must be passed to the relevant read or write function.

Column Properties

The !cols array in each worksheet, if present, is a collection of ColInfo objects which have the following properties:

type ColInfo = {
  /* visibility */
  hidden?: boolean; // if true, the column is hidden

  /* column width is specified in one of the following ways: */
  wpx?:    number;  // width in screen pixels
  width?:  number;  // width in Excel's "Max Digit Width", width*256 is integral
  wch?:    number;  // width in characters

  /* other fields for preserving features from files */
  level?:  number;  // 0-indexed outline / group level
  MDW?:    number;  // Excel's "Max Digit Width" unit, always integral
};
Row Properties

The !rows array in each worksheet, if present, is a collection of RowInfo objects which have the following properties:

type RowInfo = {
  /* visibility */
  hidden?: boolean; // if true, the row is hidden

  /* row height is specified in one of the following ways: */
  hpx?:    number;  // height in screen pixels
  hpt?:    number;  // height in points

  level?:  number;  // 0-indexed outline / group level
};
Outline / Group Levels Convention

The Excel UI displays the base outline level as 1 and the max level as 8. Following JS conventions, SheetJS uses 0-indexed outline levels wherein the base outline level is 0 and the max level is 7.

Why are there three width types? (click to show)
Implementation details (click to show)
Number Formats
The cell.w formatted text for each cell is produced from cell.v and cell.z format. If the format is not specified, the Excel General format is used. The format can either be specified as a string or as an index into the format table. Parsers are expected to populate workbook.SSF with the number format table. Writers are expected to serialize the table.

Custom tools should ensure that the local table has each used format string somewhere in the table. Excel convention mandates that the custom formats start at index 164. The following example creates a custom format from scratch:

New worksheet with custom format (click to show)
The rules are slightly different from how Excel displays custom number formats. In particular, literal characters must be wrapped in double quotes or preceded by a backslash. For more info, see the Excel documentation article Create or delete a custom number format or ECMA-376 18.8.31 (Number Formats)

Default Number Formats (click to show)
Format 14 (m/d/yy) is localized by Excel: even though the file specifies that number format, it will be drawn differently based on system settings. It makes sense when the producer and consumer of files are in the same locale, but that is not always the case over the Internet. To get around this ambiguity, parse functions accept the dateNF option to override the interpretation of that specific format string.

Hyperlinks
Format Support (click to show)
Hyperlinks are stored in the l key of cell objects. The Target field of the hyperlink object is the target of the link, including the URI fragment. Tooltips are stored in the Tooltip field and are displayed when you move your mouse over the text.

For example, the following snippet creates a link from cell A3 to https://sheetjs.com with the tip "Find us @ SheetJS.com!":

ws['A1'].l = { Target:"https://sheetjs.com", Tooltip:"Find us @ SheetJS.com!" };
Note that Excel does not automatically style hyperlinks -- they will generally be displayed as normal text.

Remote Links

HTTP / HTTPS links can be used directly:

ws['A2'].l = { Target:"https://docs.sheetjs.com/#hyperlinks" };
ws['A3'].l = { Target:"http://localhost:7262/yes_localhost_works" };
Excel also supports mailto email links with subject line:

ws['A4'].l = { Target:"mailto:ignored@dev.null" };
ws['A5'].l = { Target:"mailto:ignored@dev.null?subject=Test Subject" };
Local Links

Links to absolute paths should use the file:// URI scheme:

ws['B1'].l = { Target:"file:///SheetJS/t.xlsx" }; /* Link to /SheetJS/t.xlsx */
ws['B2'].l = { Target:"file:///c:/SheetJS.xlsx" }; /* Link to c:\SheetJS.xlsx */
Links to relative paths can be specified without a scheme:

ws['B3'].l = { Target:"SheetJS.xlsb" }; /* Link to SheetJS.xlsb */
ws['B4'].l = { Target:"../SheetJS.xlsm" }; /* Link to ../SheetJS.xlsm */
Relative Paths have undefined behavior in the SpreadsheetML 2003 format. Excel 2019 will treat a ..\ parent mark as two levels up.

Internal Links

Links where the target is a cell or range or defined name in the same workbook ("Internal Links") are marked with a leading hash character:

ws['C1'].l = { Target:"#E2" }; /* Link to cell E2 */
ws['C2'].l = { Target:"#Sheet2!E2" }; /* Link to cell E2 in sheet Sheet2 */
ws['C3'].l = { Target:"#SomeDefinedName" }; /* Link to Defined Name */
Cell Comments
Cell comments are objects stored in the c array of cell objects. The actual contents of the comment are split into blocks based on the comment author. The a field of each comment object is the author of the comment and the t field is the plain text representation.

For example, the following snippet appends a cell comment into cell A1:

if(!ws.A1.c) ws.A1.c = [];
ws.A1.c.push({a:"SheetJS", t:"I'm a little comment, short and stout!"});
Note: XLSB enforces a 54 character limit on the Author name. Names longer than 54 characters may cause issues with other formats.

To mark a comment as normally hidden, set the hidden property:

if(!ws.A1.c) ws.A1.c = [];
ws.A1.c.push({a:"SheetJS", t:"This comment is visible"});

if(!ws.A2.c) ws.A2.c = [];
ws.A2.c.hidden = true;
ws.A2.c.push({a:"SheetJS", t:"This comment will be hidden"});
Threaded Comments

Introduced in Excel 365, threaded comments are plain text comment snippets with author metadata and parent references. They are supported in XLSX and XLSB.

To mark a comment as threaded, each comment part must have a true T property:

if(!ws.A1.c) ws.A1.c = [];
ws.A1.c.push({a:"SheetJS", t:"This is not threaded"});

if(!ws.A2.c) ws.A2.c = [];
ws.A2.c.hidden = true;
ws.A2.c.push({a:"SheetJS", t:"This is threaded", T: true});
ws.A2.c.push({a:"JSSheet", t:"This is also threaded", T: true});
There is no Active Directory or Office 365 metadata associated with authors in a thread.

Sheet Visibility
Excel enables hiding sheets in the lower tab bar. The sheet data is stored in the file but the UI does not readily make it available. Standard hidden sheets are revealed in the "Unhide" menu. Excel also has "very hidden" sheets which cannot be revealed in the menu. It is only accessible in the VB Editor!

The visibility setting is stored in the Hidden property of sheet props array.

More details (click to show)
VBA and Macros
VBA Macros are stored in a special data blob that is exposed in the vbaraw property of the workbook object when the bookVBA option is true. They are supported in XLSM, XLSB, and BIFF8 XLS formats. The supported format writers automatically insert the data blobs if it is present in the workbook and associate with the worksheet names.

Custom Code Names (click to show)
Macrosheets (click to show)
Detecting macros in workbooks (click to show)
Parsing Options
The exported read and readFile functions accept an options argument:

Option Name	Default	Description
type		Input data encoding (see Input Type below)
raw	false	If true, plain text parsing will not parse values **
codepage		If specified, use code page when appropriate **
cellFormula	true	Save formulae to the .f field
cellHTML	true	Parse rich text and save HTML to the .h field
cellNF	false	Save number format string to the .z field
cellStyles	false	Save style/theme info to the .s field
cellText	true	Generated formatted text to the .w field
cellDates	false	Store dates as type d (default is n)
dateNF		If specified, use the string for date code 14 **
sheetStubs	false	Create cell objects of type z for stub cells
sheetRows	0	If >0, read the first sheetRows rows **
bookDeps	false	If true, parse calculation chains
bookFiles	false	If true, add raw files to book object **
bookProps	false	If true, only parse enough to get book metadata **
bookSheets	false	If true, only parse enough to get the sheet names
bookVBA	false	If true, copy VBA blob to vbaraw field **
password	""	If defined and file is encrypted, use password **
WTF	false	If true, throw errors on unexpected file features **
sheets		If specified, only parse specified sheets **
PRN	false	If true, allow parsing of PRN files **
xlfn	false	If true, preserve _xlfn. prefixes in formulae **
FS		DSV Field Separator override
Even if cellNF is false, formatted text will be generated and saved to .w
In some cases, sheets may be parsed even if bookSheets is false.
Excel aggressively tries to interpret values from CSV and other plain text. This leads to surprising behavior! The raw option suppresses value parsing.
bookSheets and bookProps combine to give both sets of information
Deps will be an empty object if bookDeps is false
bookFiles behavior depends on file type:
keys array (paths in the ZIP) for ZIP-based formats
files hash (mapping paths to objects representing the files) for ZIP
cfb object for formats using CFB containers
sheetRows-1 rows will be generated when looking at the JSON object output (since the header row is counted as a row when parsing the data)
By default all worksheets are parsed. sheets restricts based on input type:
number: zero-based index of worksheet to parse (0 is first worksheet)
string: name of worksheet to parse (case insensitive)
array of numbers and strings to select multiple worksheets.
bookVBA merely exposes the raw VBA CFB object. It does not parse the data. XLSM and XLSB store the VBA CFB object in xl/vbaProject.bin. BIFF8 XLS mixes the VBA entries alongside the core Workbook entry, so the library generates a new XLSB-compatible blob from the XLS CFB container.
codepage is applied to BIFF2 - BIFF5 files without CodePage records and to CSV files without BOM in type:"binary". BIFF8 XLS always defaults to 1200.
PRN affects parsing of text files without a common delimiter character.
Currently only XOR encryption is supported. Unsupported error will be thrown for files employing other encryption methods.
Newer Excel functions are serialized with the _xlfn. prefix, hidden from the user. SheetJS will strip _xlfn. normally. The xlfn option preserves them.
WTF is mainly for development. By default, the parser will suppress read errors on single worksheets, allowing you to read from the worksheets that do parse properly. Setting WTF:true forces those errors to be thrown.
Input Type
Strings can be interpreted in multiple ways. The type parameter for read tells the library how to parse the data argument:

type	expected input
"base64"	string: Base64 encoding of the file
"binary"	string: binary string (byte n is data.charCodeAt(n))
"string"	string: JS string (characters interpreted as UTF8)
"buffer"	nodejs Buffer
"array"	array: array of 8-bit unsigned int (byte n is data[n])
"file"	string: path of file that will be read (nodejs only)
Guessing File Type
Implementation Details (click to show)
Why are random text files valid? (click to show)
Writing Options
The exported write and writeFile functions accept an options argument:

Option Name	Default	Description
type		Output data encoding (see Output Type below)
cellDates	false	Store dates as type d (default is n)
bookSST	false	Generate Shared String Table **
bookType	"xlsx"	Type of Workbook (see below for supported formats)
sheet	""	Name of Worksheet for single-sheet formats **
compression	false	Use ZIP compression for ZIP-based formats **
Props		Override workbook properties when writing **
themeXLSX		Override theme XML when writing XLSX/XLSB/XLSM **
ignoreEC	true	Suppress "number as text" errors **
numbers		Payload for NUMBERS export **
bookSST is slower and more memory intensive, but has better compatibility with older versions of iOS Numbers
The raw data is the only thing guaranteed to be saved. Features not described in this README may not be serialized.
cellDates only applies to XLSX output and is not guaranteed to work with third-party readers. Excel itself does not usually write cells with type d so non-Excel tools may ignore the data or error in the presence of dates.
Props is an object mirroring the workbook Props field. See the table from the Workbook File Properties section.
if specified, the string from themeXLSX will be saved as the primary theme for XLSX/XLSB/XLSM files (to xl/theme/theme1.xml in the ZIP)
Due to a bug in the program, some features like "Text to Columns" will crash Excel on worksheets where error conditions are ignored. The writer will mark files to ignore the error by default. Set ignoreEC to false to suppress.
Due to the size of the data, the NUMBERS data is not included by default. The included xlsx.zahl.js and xlsx.zahl.mjs scripts include the data.
Supported Output Formats
For broad compatibility with third-party tools, this library supports many output formats. The specific file type is controlled with bookType option:

bookType	file ext	container	sheets	Description
xlsx	.xlsx	ZIP	multi	Excel 2007+ XML Format
xlsm	.xlsm	ZIP	multi	Excel 2007+ Macro XML Format
xlsb	.xlsb	ZIP	multi	Excel 2007+ Binary Format
biff8	.xls	CFB	multi	Excel 97-2004 Workbook Format
biff5	.xls	CFB	multi	Excel 5.0/95 Workbook Format
biff4	.xls	none	single	Excel 4.0 Worksheet Format
biff3	.xls	none	single	Excel 3.0 Worksheet Format
biff2	.xls	none	single	Excel 2.0 Worksheet Format
xlml	.xls	none	multi	Excel 2003-2004 (SpreadsheetML)
numbers	.numbers	ZIP	single	Numbers 3.0+ Spreadsheet
ods	.ods	ZIP	multi	OpenDocument Spreadsheet
fods	.fods	none	multi	Flat OpenDocument Spreadsheet
wk3	.wk3	none	multi	Lotus Workbook (WK3)
csv	.csv	none	single	Comma Separated Values
txt	.txt	none	single	UTF-16 Unicode Text (TXT)
sylk	.sylk	none	single	Symbolic Link (SYLK)
html	.html	none	single	HTML Document
dif	.dif	none	single	Data Interchange Format (DIF)
dbf	.dbf	none	single	dBASE II + VFP Extensions (DBF)
wk1	.wk1	none	single	Lotus Worksheet (WK1)
rtf	.rtf	none	single	Rich Text Format (RTF)
prn	.prn	none	single	Lotus Formatted Text
eth	.eth	none	single	Ethercalc Record Format (ETH)
compression only applies to formats with ZIP containers.
Formats that only support a single sheet require a sheet option specifying the worksheet. If the string is empty, the first worksheet is used.
writeFile will automatically guess the output file format based on the file extension if bookType is not specified. It will choose the first format in the aforementioned table that matches the extension.
Output Type
The type argument for write mirrors the type argument for read:

type	output
"base64"	string: Base64 encoding of the file
"binary"	string: binary string (byte n is data.charCodeAt(n))
"string"	string: JS string (characters interpreted as UTF8)
"buffer"	nodejs Buffer
"array"	ArrayBuffer, fallback array of 8-bit unsigned int
"file"	string: path of file that will be created (nodejs only)
For compatibility with Excel, csv output will always include the UTF-8 byte order mark.
Utility Functions
The sheet_to_* functions accept a worksheet and an optional options object.

The *_to_sheet functions accept a data object and an optional options object.

The examples are based on the following worksheet:

XXX| A | B | C | D | E | F | G |
---+---+---+---+---+---+---+---+
 1 | S | h | e | e | t | J | S |
 2 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
 3 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
Array of Arrays Input
XLSX.utils.aoa_to_sheet takes an array of arrays of JS values and returns a worksheet resembling the input data. Numbers, Booleans and Strings are stored as the corresponding styles. Dates are stored as date or numbers. Array holes and explicit undefined values are skipped. null values may be stubbed. All other values are stored as strings. The function takes an options argument:

Option Name	Default	Description
dateNF	FMT 14	Use specified date format in string output
cellDates	false	Store dates as type d (default is n)
sheetStubs	false	Create cell objects of type z for null values
nullError	false	If true, emit #NULL! error cells for null values
Examples (click to show)
XLSX.utils.sheet_add_aoa takes an array of arrays of JS values and updates an existing worksheet object. It follows the same process as aoa_to_sheet and accepts an options argument:

Option Name	Default	Description
dateNF	FMT 14	Use specified date format in string output
cellDates	false	Store dates as type d (default is n)
sheetStubs	false	Create cell objects of type z for null values
nullError	false	If true, emit #NULL! error cells for null values
origin		Use specified cell as starting point (see below)
origin is expected to be one of:

origin	Description
(cell object)	Use specified cell (cell object)
(string)	Use specified cell (A1-style cell)
(number >= 0)	Start from the first column at specified row (0-indexed)
-1	Append to bottom of worksheet starting on first column
(default)	Start from cell A1
Examples (click to show)
Array of Objects Input
XLSX.utils.json_to_sheet takes an array of objects and returns a worksheet with automatically-generated "headers" based on the keys of the objects. The default column order is determined by the first appearance of the field using Object.keys. The function accepts an options argument:

Option Name	Default	Description
header		Use specified field order (default Object.keys) **
dateNF	FMT 14	Use specified date format in string output
cellDates	false	Store dates as type d (default is n)
skipHeader	false	If true, do not include header row in output
nullError	false	If true, emit #NULL! error cells for null values
All fields from each row will be written. If header is an array and it does not contain a particular field, the key will be appended to the array.
Cell types are deduced from the type of each value. For example, a Date object will generate a Date cell, while a string will generate a Text cell.
Null values will be skipped by default. If nullError is true, an error cell corresponding to #NULL! will be written to the worksheet.
Examples (click to show)
XLSX.utils.sheet_add_json takes an array of objects and updates an existing worksheet object. It follows the same process as json_to_sheet and accepts an options argument:

Option Name	Default	Description
header		Use specified column order (default Object.keys)
dateNF	FMT 14	Use specified date format in string output
cellDates	false	Store dates as type d (default is n)
skipHeader	false	If true, do not include header row in output
nullError	false	If true, emit #NULL! error cells for null values
origin		Use specified cell as starting point (see below)
origin is expected to be one of:

origin	Description
(cell object)	Use specified cell (cell object)
(string)	Use specified cell (A1-style cell)
(number >= 0)	Start from the first column at specified row (0-indexed)
-1	Append to bottom of worksheet starting on first column
(default)	Start from cell A1
Examples (click to show)
HTML Table Input
XLSX.utils.table_to_sheet takes a table DOM element and returns a worksheet resembling the input table. Numbers are parsed. All other data will be stored as strings.

XLSX.utils.table_to_book produces a minimal workbook based on the worksheet.

Both functions accept options arguments:

Option Name	Default	Description
raw		If true, every cell will hold raw strings
dateNF	FMT 14	Use specified date format in string output
cellDates	false	Store dates as type d (default is n)
sheetRows	0	If >0, read the first sheetRows rows of the table
display	false	If true, hidden rows and cells will not be parsed
Examples (click to show)
Note: XLSX.read can handle HTML represented as strings.

XLSX.utils.sheet_add_dom takes a table DOM element and updates an existing worksheet object. It follows the same process as table_to_sheet and accepts an options argument:

Option Name	Default	Description
raw		If true, every cell will hold raw strings
dateNF	FMT 14	Use specified date format in string output
cellDates	false	Store dates as type d (default is n)
sheetRows	0	If >0, read the first sheetRows rows of the table
display	false	If true, hidden rows and cells will not be parsed
origin is expected to be one of:

origin	Description
(cell object)	Use specified cell (cell object)
(string)	Use specified cell (A1-style cell)
(number >= 0)	Start from the first column at specified row (0-indexed)
-1	Append to bottom of worksheet starting on first column
(default)	Start from cell A1
Examples (click to show)
Formulae Output
XLSX.utils.sheet_to_formulae generates an array of commands that represent how a person would enter data into an application. Each entry is of the form A1-cell-address=formula-or-value. String literals are prefixed with a ' in accordance with Excel.

Examples (click to show)
Delimiter-Separated Output
As an alternative to the writeFile CSV type, XLSX.utils.sheet_to_csv also produces CSV output. The function takes an options argument:

Option Name	Default	Description
FS	","	"Field Separator" delimiter between fields
RS	"\n"	"Record Separator" delimiter between rows
dateNF	FMT 14	Use specified date format in string output
strip	false	Remove trailing field separators in each record **
blankrows	true	Include blank lines in the CSV output
skipHidden	false	Skips hidden rows/columns in the CSV output
forceQuotes	false	Force quotes around fields
strip will remove trailing commas from each line under default FS/RS
blankrows must be set to false to skip blank lines.
Fields containing the record or field separator will automatically be wrapped in double quotes; forceQuotes forces all cells to be wrapped in quotes.
XLSX.write with csv type will always prepend the UTF-8 byte-order mark for Excel compatibility. sheet_to_csv returns a JS string and omits the mark. Using XLSX.write with type string will also skip the mark.
Examples (click to show)
UTF-16 Unicode Text
The txt output type uses the tab character as the field separator. If the codepage library is available (included in full distribution but not core), the output will be encoded in CP1200 and the BOM will be prepended.

XLSX.utils.sheet_to_txt takes the same arguments as sheet_to_csv.

HTML Output
As an alternative to the writeFile HTML type, XLSX.utils.sheet_to_html also produces HTML output. The function takes an options argument:

Option Name	Default	Description
id		Specify the id attribute for the TABLE element
editable	false	If true, set contenteditable="true" for every TD
header		Override header (default html body)
footer		Override footer (default /body /html)
Examples (click to show)
JSON
XLSX.utils.sheet_to_json generates different types of JS objects. The function takes an options argument:

Option Name	Default	Description
raw	true	Use raw values (true) or formatted strings (false)
range	from WS	Override Range (see table below)
header		Control output format (see table below)
dateNF	FMT 14	Use specified date format in string output
defval		Use specified value in place of null or undefined
blankrows	**	Include blank lines in the output **
raw only affects cells which have a format code (.z) field or a formatted text (.w) field.
If header is specified, the first row is considered a data row; if header is not specified, the first row is the header row and not considered data.
When header is not specified, the conversion will automatically disambiguate header entries by affixing _ and a count starting at 1. For example, if three columns have header foo the output fields are foo, foo_1, foo_2
null values are returned when raw is true but are skipped when false.
If defval is not specified, null and undefined values are skipped normally. If specified, all null and undefined points will be filled with defval
When header is 1, the default is to generate blank rows. blankrows must be set to false to skip blank rows.
When header is not 1, the default is to skip blank rows. blankrows must be true to generate blank rows
range is expected to be one of:

range	Description
(number)	Use worksheet range but set starting row to the value
(string)	Use specified range (A1-style bounded range string)
(default)	Use worksheet range (ws['!ref'])
header is expected to be one of:

header	Description
1	Generate an array of arrays ("2D Array")
"A"	Row object keys are literal column labels
array of strings	Use specified strings as keys in row objects
(default)	Read and disambiguate first row as keys
If header is not 1, the row object will contain the non-enumerable property __rowNum__ that represents the row of the sheet corresponding to the entry.
If header is an array, the keys will not be disambiguated. This can lead to unexpected results if the array values are not unique!
Examples (click to show)
File Formats
Despite the library name xlsx, it supports numerous spreadsheet file formats:

Format	Read	Write
Excel Worksheet/Workbook Formats	:-----:	:-----:
Excel 2007+ XML Formats (XLSX/XLSM)	✔	✔
Excel 2007+ Binary Format (XLSB BIFF12)	✔	✔
Excel 2003-2004 XML Format (XML "SpreadsheetML")	✔	✔
Excel 97-2004 (XLS BIFF8)	✔	✔
Excel 5.0/95 (XLS BIFF5)	✔	✔
Excel 4.0 (XLS/XLW BIFF4)	✔	✔
Excel 3.0 (XLS BIFF3)	✔	✔
Excel 2.0/2.1 (XLS BIFF2)	✔	✔
Excel Supported Text Formats	:-----:	:-----:
Delimiter-Separated Values (CSV/TXT)	✔	✔
Data Interchange Format (DIF)	✔	✔
Symbolic Link (SYLK/SLK)	✔	✔
Lotus Formatted Text (PRN)	✔	✔
UTF-16 Unicode Text (TXT)	✔	✔
Other Workbook/Worksheet Formats	:-----:	:-----:
Numbers 3.0+ / iWork 2013+ Spreadsheet (NUMBERS)	✔	✔
OpenDocument Spreadsheet (ODS)	✔	✔
Flat XML ODF Spreadsheet (FODS)	✔	✔
Uniform Office Format Spreadsheet (标文通 UOS1/UOS2)	✔	
dBASE II/III/IV / Visual FoxPro (DBF)	✔	✔
Lotus 1-2-3 (WK1/WK3)	✔	✔
Lotus 1-2-3 (WKS/WK2/WK4/123)	✔	
Quattro Pro Spreadsheet (WQ1/WQ2/WB1/WB2/WB3/QPW)	✔	
Works 1.x-3.x DOS / 2.x-5.x Windows Spreadsheet (WKS)	✔	
Works 6.x-9.x Spreadsheet (XLR)	✔	
Other Common Spreadsheet Output Formats	:-----:	:-----:
HTML Tables	✔	✔
Rich Text Format tables (RTF)		✔
Ethercalc Record Format (ETH)	✔	✔
Features not supported by a given file format will not be written. Formats with range limits will be silently truncated:

Format	Last Cell	Max Cols	Max Rows
Excel 2007+ XML Formats (XLSX/XLSM)	XFD1048576	16384	1048576
Excel 2007+ Binary Format (XLSB BIFF12)	XFD1048576	16384	1048576
Excel 97-2004 (XLS BIFF8)	IV65536	256	65536
Excel 5.0/95 (XLS BIFF5)	IV16384	256	16384
Excel 4.0 (XLS BIFF4)	IV16384	256	16384
Excel 3.0 (XLS BIFF3)	IV16384	256	16384
Excel 2.0/2.1 (XLS BIFF2)	IV16384	256	16384
Lotus 1-2-3 R2 - R5 (WK1/WK3/WK4)	IV8192	256	8192
Lotus 1-2-3 R1 (WKS)	IV2048	256	2048
Excel 2003 SpreadsheetML range limits are governed by the version of Excel and are not enforced by the writer.

