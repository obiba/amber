/**
 * Excel utility module using exceljs.
 * Provides xlsx-compatible API for easy migration.
 */
const ExcelJS = require('exceljs');

/**
 * Create a new workbook
 */
function bookNew() {
  return new ExcelJS.Workbook();
}

/**
 * Convert JSON array to worksheet data
 * @param {Array} jsonData - Array of objects
 * @returns {Object} - Object with columns and rows for exceljs
 */
function jsonToSheet(jsonData) {
  if (!jsonData || jsonData.length === 0) {
    return { columns: [], rows: [] };
  }

  // Get all unique keys from all objects
  const allKeys = new Set();
  jsonData.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  const columns = Array.from(allKeys);

  // Create rows
  const rows = jsonData.map(obj => {
    return columns.map(col => obj[col] !== undefined ? obj[col] : '');
  });

  return { columns, rows };
}

/**
 * Add a worksheet to a workbook
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {Object} sheetData - Object with columns and rows from jsonToSheet
 * @param {string} sheetName - Name of the worksheet
 */
function bookAppendSheet(workbook, sheetData, sheetName) {
  // Sanitize sheet name (max 31 chars, no special chars)
  const sanitizedName = sheetName
    .replace(/[\\/*?:[\]]/g, '_')
    .substring(0, 31);

  const worksheet = workbook.addWorksheet(sanitizedName);

  if (sheetData.columns && sheetData.columns.length > 0) {
    // Add header row
    worksheet.addRow(sheetData.columns);

    // Add data rows
    if (sheetData.rows) {
      sheetData.rows.forEach(row => {
        worksheet.addRow(row);
      });
    }

    // Style header row
    worksheet.getRow(1).font = { bold: true };
  }

  return worksheet;
}

/**
 * Write workbook to XLSX file
 * @param {ExcelJS.Workbook} workbook - The workbook
 * @param {string} filePath - Path to write file
 * @returns {Promise} - Promise that resolves when file is written
 */
function writeFileXLSX(workbook, filePath) {
  return workbook.xlsx.writeFile(filePath);
}

// Export xlsx-compatible API
module.exports = {
  utils: {
    book_new: bookNew,
    json_to_sheet: jsonToSheet,
    book_append_sheet: bookAppendSheet
  },
  writeFileXLSX
};
