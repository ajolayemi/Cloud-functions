import {DocumentData} from "firebase-admin/firestore";
// import {QualitySurveyGoogleSheetResult} from "../models/quality_survey_gs";
import {QualitySurveyGoogleSheetData} from "../interfaces/quality_survey_interface_data";
import {logger} from "firebase-functions/v2";
import {QualitySurveyGoogleSheetResult} from "../models/quality_survey_gs";
import {SheetInfo} from "../interfaces/shared_interfaces";
import {insertDataInSheet, updateDataInSheet} from "../src/google_sheet_utils";

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

  data[0].unshift(docId);

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
