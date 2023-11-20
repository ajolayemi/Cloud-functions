import {DocumentData} from "firebase-admin/firestore";
// import {QualitySurveyGoogleSheetResult} from "../models/quality_survey_gs";
import {QualitySurveyGoogleSheetData} from "../interfaces/quality_survey_interface_data";
import {logger} from "firebase-functions/v2";
import {QualitySurveyGoogleSheetResult} from "../models/quality_survey_gs";
import {SheetInfo} from "../interfaces/shared_interfaces";
import {
  deleteRowFromSheet,
  filterDocumentDataRange,
  insertDataInSheet,
  readDataFromSpreadsheet,
  updateDataInSheet,
} from "../src/google_sheet_utils";
import {
  FCalFromSurvey,
  QuantitySurveyGoogleSheetData,
  QuantitySurveyResultForGs,
} from "../interfaces/quantity_survey_interfaces";
import {QuantitySurveyGoogleSheetResult} from "../models/quantity_survey_gs";
import {SheetInfoImpl} from "../models/sheet_info_model";

/**
 * An helper function to handle the insertion and update of firebase document data
 * sheet in google sheets
 * @param {Array<Array<string | number>>} data The data to insert into google
 * @param {SheetInfo} sheetInfo Some information pertaining to the google
 * sheet where the data should be written to
 * written to database comes from
 * @param {string} docId The firestore document id where the said data comes
 * from
 * @param {boolean} shouldAddDocIdToData A boolean value to inform the function
 * if it should add document id to the list of data for google sheets
 * @param {boolean} shouldInsert To indicate when the function is being called
 * to insert new data to google sheet
 * @param {boolean} shouldUpdate To indicate when the function is being called
 * to update an already saved data in google sheet
 * @param {string} rangeForUpdate To be provided when an update
 * action should be done to indicate what ranges should be updated
 * @return {void}
 */
export const handleSurveyInsertAndUpdate = async (
  data: Array<Array<string | number>>,
  sheetInfo: SheetInfo,
  docId = "",
  shouldAddDocIdToData = false,
  shouldInsert = false,
  shouldUpdate = false,
  rangeForUpdate?: string
): Promise<void> => {
  if (data.length <= 0) return;

  if (shouldAddDocIdToData && !docId) return;

  if (shouldAddDocIdToData) data[0].unshift(docId);

  if (shouldInsert) {
    // Write data to google sheet
    await insertDataInSheet(sheetInfo.name, data);
    return;
  }

  if (shouldUpdate && rangeForUpdate) {
    await updateDataInSheet(rangeForUpdate, data);
    return;
  }
};

/**
 *
 * @param {SheetInfo} sheetToReference
 * @param {string} docId
 * @return {void}
 */
export const processDeleteEvents = async (
  sheetToReference: SheetInfo,
  docId: string
) => {
  const dataFromGs = await readDataFromSpreadsheet(
    SheetInfoImpl.getReadA1NotationRange(sheetToReference)
  );
  const rangeToDelete = filterDocumentDataRange(dataFromGs, docId);

  if (rangeToDelete.firstRow <= 0 || rangeToDelete.lastRow <= 0) return;

  await deleteRowFromSheet(
    sheetToReference.id,
    rangeToDelete.firstRow - 1,
    rangeToDelete.lastRow
  );
  return;
};

/**
 *
 * @param {SheetInfo} sheetToReference
 * @param  {string} docId
 * @param {Array<Array<string | number>>} dataForGs
 * @param {boolean} shouldAddDocIdToData
 * @return {void}
 */
export const processUpdateEvents = async (
  sheetToReference: SheetInfo,
  docId: string,
  dataForGs: Array<Array<string | number>>,
  shouldAddDocIdToData = true
) => {
  const dataFromGs = await readDataFromSpreadsheet(
    SheetInfoImpl.getReadA1NotationRange(sheetToReference)
  );

  const filterRange = filterDocumentDataRange(dataFromGs, docId);

  // if either of the firstRow or lastRow in range is <= 0
  // This means that the said survey has never being saved to
  // google sheet, in that case, add it
  if (filterRange.firstRow <= 0 || filterRange.lastRow <= 0) {
    await handleSurveyInsertAndUpdate(
      dataForGs,
      sheetToReference,
      docId,
      shouldAddDocIdToData,
      true
    );
    logger.info(
      `Document with id: ${docId} info was not found in google sheet,
      it's been added successfully`
    );
    return;
  }

  // In other cases, update the data already saved in google sheet
  const rangeForUpdate = SheetInfoImpl.getUpdateA1NotionRange(
    sheetToReference,
    filterRange
  );
  await handleSurveyInsertAndUpdate(
    dataForGs,
    sheetToReference,
    docId,
    shouldAddDocIdToData,
    false,
    true,
    rangeForUpdate
  );
  logger.info(
    `Document with id: ${docId} data was updated in google sheet successfully`
  );
  return;
};

/**
 * Processes the data read from firestore, both when an update / write
 * event was captured
 * @param {DocumentData} dataFromFirebase
 * @return {QuantitySurveyResultForGs}
 */
export const processQuantitySurveyDataForGs = (
  dataFromFirebase: DocumentData
): QuantitySurveyResultForGs => {
  try {
    const _data: QuantitySurveyGoogleSheetData = {
      author: dataFromFirebase.surveyAuthor,
      quantitySurvey: dataFromFirebase.quantitySurvey,
      varietyId: dataFromFirebase.varietyId,
      placeCode: dataFromFirebase.placeCode,
      surveyCompleteCode: dataFromFirebase.longSurveyId,
      surveyShortCode: dataFromFirebase.surveyId,
      variety: dataFromFirebase.variety,
      surveyDate: dataFromFirebase.surveyDateString,
    };

    const _dataForGs: QuantitySurveyGoogleSheetResult =
      new QuantitySurveyGoogleSheetResult(_data);

    const cals: Array<FCalFromSurvey> =
      _data.quantitySurvey.calibreValues ?? [];

    const calsForGs: Array<Array<string | number>> = [];

    for (const cal of cals) {
      if (cal.value <= 0) continue;
      const data = [
        _data.surveyCompleteCode,
        `${_data.surveyCompleteCode} [${cal.name}]`,
        cal.name,
        cal.value,
      ];
      calsForGs.push(data);
    }
    return {generalData: _dataForGs.regForSheet, calData: calsForGs};
  } catch (error) {
    logger.error(`Ran into an error: ${error} while trying to build quantity
    survey result`);
    return {generalData: [], calData: []};
  }
};

/**
 * Processes the data read from firestore, both when an update / write
 * event was captured
 * @param {DocumentData} dataFromFirebase
 * @return  {Array<string | number | undefined>} an array
 * containing data to pass over to google sheet as far
 * as quality survey is concerned
 */
export const processQualitySurveyDataForGs = (
  dataFromFirebase: DocumentData
): Array<string | number> => {
  try {
    const _data: QualitySurveyGoogleSheetData = {
      author: dataFromFirebase.surveyAuthor,
      fQualitySurvey: dataFromFirebase.qualitySurvey,
      idVarieta: dataFromFirebase.varietyId,
      placeCode: dataFromFirebase.placeCode,
      surveyCompleteCode: dataFromFirebase.longSurveyId,
      surveyDate: dataFromFirebase.surveyDateString,
      surveyShortCode: dataFromFirebase.surveyId,
      varietyName: dataFromFirebase.variety,
    };

    const _dataForGs: QualitySurveyGoogleSheetResult =
      new QualitySurveyGoogleSheetResult(_data);

    return _dataForGs.qualitySurveyResultForGoogleSheet;
  } catch (error) {
    logger.error(`Ran into an error: ${error} while trying to build quality
    survey result`);
    return [];
  }
};
