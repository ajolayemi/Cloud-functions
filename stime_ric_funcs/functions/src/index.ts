import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import {SurveyTypes} from "../shared/shared_enums";
import {
  handleSurveyInsertAndUpdate,
  processQualitySurveyDataForGs,
} from "../shared/utils";
import {qualitySurveyResultSheet} from "../shared/configs";
import {
  filterDocumentDataRange,
  readDataFromSpreadsheet,
} from "./google_sheet_utils";
import {SheetInfoImpl} from "../models/sheet_info_model";
// Set the maximum instances to 10 for all functions
setGlobalOptions({maxInstances: 10});

/**
 * Responds to update events on firestore documents from firebase
 * It mostly handles that passes over to google sheet the new data
 */
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

        const dataForGs = processQualitySurveyDataForGs(updatedDocumentData);

        // if either of the firstRow or lastRow in range is <= 0
        // This means that the said survey has never being saved to
        // google sheet, in that case, add it
        if (filterRange.firstRow <= 0 || filterRange.lastRow <= 0) {
          await handleSurveyInsertAndUpdate(
            [dataForGs],
            qualitySurveyResultSheet,
            docId,
            true,
            true
          );
          logger.info(
            `Document with id: ${docId} info was not found in google sheet,
            it's been added successfully`
          );
          return;
        }

        // In other cases, update the data already saved in google sheet
        const rangeForUpdateString = SheetInfoImpl.getUpdateA1NotionRange(
          qualitySurveyResultSheet,
          filterRange
        );
        await handleSurveyInsertAndUpdate(
          [dataForGs],
          qualitySurveyResultSheet,
          docId,
          true,
          false,
          true,
          rangeForUpdateString
        );
        logger.info(
          `Document with id: ${docId} data was updated in google sheet successfully`
        );
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
        await handleSurveyInsertAndUpdate(
          [forGs],
          qualitySurveyResultSheet,
          docId,
          true,
          true
        );

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
