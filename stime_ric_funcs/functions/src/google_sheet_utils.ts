import {logger} from "firebase-functions/v2";
import {google, sheets_v4 as SheetsV4} from "googleapis";
import {FilterSheetRangeInfo} from "../interfaces/shared_interfaces";

const _spreadSheetId = "1NVTetOLPyt-hV37z1FZNb1CvqitrhuaZB2Xvsw1vOkM";

/**
 * Returns an object representation containing the first row where the
 * provided document id was found as well as the last row
 * @param {Array<Array<string | number>>} dataFromGs An array of data
 * read from google sheet
 * @param {string} docId The firebase document id to search for in the array of
 * data from google sheet
 * @return {FilterSheetRangeInfo}
 */
export const filterDocumentDataRange = (
  dataFromGs: Array<Array<string | number>>,
  docId: string
): FilterSheetRangeInfo => {
  if (dataFromGs.length <= 0) return {firstRow: -1, lastRow: -1};

  const toReturn: FilterSheetRangeInfo = {firstRow: -1, lastRow: -1};
  for (let index = 0; index < dataFromGs.length; index++) {
    const currentData = dataFromGs[index];

    if (currentData.includes(docId)) {
      // If the value of first row is <= 0, meaning this is the first
      // time this condition is true, update firstRow value
      if (toReturn.firstRow <= 0) {
        toReturn.firstRow = index + 1;
        toReturn.lastRow = index + 1;
      } else toReturn.lastRow = index + 1;
    }
  }

  return toReturn;
};

/**
 * A wrapper to handle deletion request in google sheets
 * @param {number} sheetIdToDeleteFrom The unique id of the worksheet to
 * delete from. It's the "gid" value in a google worksheet url
 * @param {number} startIndex The row to start deleting from
 * @param {number} endIndex The row to end the deletion request
 * @return {Promise<SheetsV4.Schema$BatchUpdateSpreadsheetResponse | null>}
 */
export const deleteRowFromSheet = async (
  sheetIdToDeleteFrom: number,
  startIndex: number,
  endIndex: number
): Promise<SheetsV4.Schema$BatchUpdateSpreadsheetResponse | null> => {
  try {
    const sheets = getSpreadsheets();

    const deleteResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: _spreadSheetId,

      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetIdToDeleteFrom,
                dimension: "ROWS",
                startIndex: startIndex,
                endIndex: endIndex,
              },
            },
          },
        ],
      },
    });
    if (deleteResponse.status == 200) {
      const deleteRequestResponseData = deleteResponse.data;
      logger.info(
        `Delete request done successfully: ${deleteRequestResponseData}`
      );
      return deleteRequestResponseData;
    }
    logger.error(`Request to delete the rows with index from 
    ${startIndex} to ${endIndex} in worksheet with id: ${sheetIdToDeleteFrom}
    failed with status ${deleteResponse.statusText}`);
    return null;
  } catch (error) {
    logger.error(`An error: ${error} occurred while trying
    to delete the rows with index from ${startIndex} to ${endIndex} in
    worksheet with id: ${sheetIdToDeleteFrom}`);
    return null;
  }
};

/**
 * A wrapper around google sheet api func to insert new values to google sheet
 * @param {string} worksheetName The name of the worksheet where the insertion
 * should be done
 * @param {Array<Array<string | number>>} dataToInsert The new values
 * @return {Promise<SheetsV4.Schema$UpdateValuesResponse | null>}
 * The result of the insert request if it was successful or a null value
 */
export const insertDataInSheet = async (
  worksheetName: string,
  dataToInsert: Array<Array<string | number>>
): Promise<SheetsV4.Schema$AppendValuesResponse | null> => {
  try {
    const sheets = getSpreadsheets();

    const insertResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: _spreadSheetId,
      range: worksheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: dataToInsert,
      },
    });

    if (insertResponse.status == 200) {
      const responseData = insertResponse.data;
      logger.info(`Insert request done successfully: ${responseData.updates}`);
      return responseData;
    }
    logger.error(`The request to insert data in worksheet: ${worksheetName} 
    with provided values ${dataToInsert} failed with status
    ${insertResponse.statusText}`);
    return null;
  } catch (error) {
    logger.error(`An error: ${error} occurred while 
    trying to insert data in worksheet: ${worksheetName} 
    with provided values ${dataToInsert}`);
    return null;
  }
};

/**
 * A wrapper around google sheet api func to update values
 * @param {string} rangeToUpdate The range to be updated
 * Written in form <sheetName>!A1notation range
 * @param {Array<Array<string | number>>} updateRequestBodyValue The new values
 * @return {Promise<SheetsV4.Schema$UpdateValuesResponse | null>}
 * The result of the update request if it was successful or a null value
 */
export const updateDataInSheet = async (
  rangeToUpdate: string,
  updateRequestBodyValue: Array<Array<string | number>>
): Promise<SheetsV4.Schema$UpdateValuesResponse | null> => {
  try {
    const sheets = getSpreadsheets();

    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: _spreadSheetId,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      requestBody: {
        values: updateRequestBodyValue,
      },
    });

    if (updateResponse.status == 200) {
      const responseData = updateResponse.data;
      logger.info(`Update request done successfully: ${responseData}`);
      return responseData;
    }
    logger.error(`The request to update the values in range: ${rangeToUpdate} 
    with provided values ${updateRequestBodyValue} failed with status
    ${updateResponse.statusText}`);
    return null;
  } catch (error) {
    logger.error(`An error: ${error} occurred while 
    trying to update the values in range: ${rangeToUpdate} 
    with provided values ${updateRequestBodyValue}`);
    return null;
  }
};

/**
 * A wrapper around google sheet api sheet function that
 * makes request to read data from spreadsheet.
 * It's so to avoid code duplication
 * @param {string} range  The range to get from spreadsheet.
 * The said range has to be an A1 notation range type
 * @return {Promise<Array<Array<string | number>>>}
 * Returns either a nested list of the values read from spreadsheet or
 * an empty list if the reading wasn't successful
 */
export const readDataFromSpreadsheet = async (
  range: string
): Promise<Array<Array<string | number>>> => {
  try {
    const sheet = getSpreadsheets();
    const readResponse = await sheet.spreadsheets.values.get({
      spreadsheetId: _spreadSheetId,
      range: range,
    });

    // If request response status is 200
    if (readResponse.status == 200) {
      return readResponse.data.values ?? [];
    }
    logger.error(
      `The request to read data in range: ${range} in sheet with id: 
      ${_spreadSheetId} failed with status ${readResponse.statusText}`
    );
    return [];
  } catch (error) {
    logger.error(
      `An error: ${error} occurred while trying to load range: 
      ${range} in sheet with id: ${_spreadSheetId}`
    );
    return [];
  }
};

/**
 * Handles the logic behind spreadsheet authorization
 * @return {SheetsV4.Sheets} The loaded spreadsheet
 */
export const getSpreadsheets = (): SheetsV4.Sheets => {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const options: SheetsV4.Options = {auth: auth, version: "v4"};
  return google.sheets(options);
};
