import {DocumentData} from "firebase-admin/firestore";
// import {QualitySurveyGoogleSheetResult} from "../models/quality_survey_gs";
import {QualitySurveyGoogleSheetData} from "../interfaces/quality_survey_interface_data";
import {logger} from "firebase-functions/v2";
import {QualitySurveyGoogleSheetResult} from "../models/quality_survey_gs";

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
