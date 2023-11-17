import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import {SurveyTypes} from "../shared/shared_enums";
import {processQualitySurveyDataForGs} from "../shared/utils";
import {qualitySurveyResultSheet} from "../shared/configs";
import {
  filterDocumentDataRange,
  insertDataInSheet,
  readDataFromSpreadsheet,
} from "./google_sheet_utils";
import {SheetInfoImpl} from "../models/sheet_info_model";
// Set the maximum instances to 10 for all functions
setGlobalOptions({maxInstances: 10});

exports.onSurveyUpdated = onDocumentUpdated(
  "survey/{docId}",
  async (updateEvent) => {
    try {
      const updatedDocumentData = updateEvent.data?.after.data();

      if (!updatedDocumentData) {
        logger.info("Was not able to access updated doc data!");
        return;
      }

      // Access updated survey type
      const updatedSurveyType: SurveyTypes = updatedDocumentData.surveyType;

      if (updatedSurveyType == SurveyTypes.Quality) {
        console.log("Was a quality survey");

        const docId = updateEvent.data?.after.id;
        if (!docId) {
          logger.error("Was not able to access document id in update logic");
          return;
        }
        const qualitySurveyDataFromGs = await readDataFromSpreadsheet(
          SheetInfoImpl.getReadA1NotationRange(qualitySurveyResultSheet)
        );
        const filterRange = filterDocumentDataRange(
          qualitySurveyDataFromGs,
          docId
        );
        console.log(filterRange);
        // Filter out the current index (row number) where this survey data is
        // currently saved on google sheet

        // const forGs = processQualitySurveyDataForGs(updatedDocumentData);
        // If a valid data was returned
        // if (forGs.length <= 0 || !docId) return;
        // forGs.unshift(docId);

        // Write data to google sheet
        // await insertDataInSheet(qualitySurveyResultSheet.name, [forGs]);
        return;
      }
      console.log("Was a quantity survey");
    } catch (error) {
      logger.info(
        `An error occurred when trying to handle survey update event: ${error}`
      );
    }
  }
);

/**
 * Responds to events for when a new survey is stored on firestore
 * It mainly handles the logic that passes over survey data to Google Sheet
 */
exports.onNewSurveyCreated = onDocumentCreated(
  "survey/{docId}",
  async (docEvent) => {
    try {
      const newData = docEvent.data?.data();

      if (!newData) {
        logger.info("No data was found!");
        return;
      }
      // Check survey type here
      const surveyType: SurveyTypes = newData.surveyType;

      // Base on the current survey type, call on the helper function to
      // write data to google sheet
      if (surveyType == SurveyTypes.Quality) {
        console.log("Was a quality survey");
        const docId = docEvent.data?.id;
        const forGs = processQualitySurveyDataForGs(newData);
        // If a valid data was returned
        if (forGs.length <= 0 || !docId) return;
        forGs.unshift(docId);

        // Write data to google sheet
        await insertDataInSheet(qualitySurveyResultSheet.name, [forGs]);

        return;
      }

      console.log("Was a quantity survey");
      return;
    } catch (error) {
      logger.info(
        `An error occurred when trying to handle survey creation event: ${error}`
      );
    }
  }
);
