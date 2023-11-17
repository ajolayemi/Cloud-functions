import {FQualitySurvey} from "./quality_survey_interface_data";
import {FQuantitySurvey} from "./quantity_survey_interfaces";

export interface FSurvey {
  /** A short id that identifies a survey. Example: SP 1 */
  surveyId?: string;

  /** A long id that identifies a survey */
  longSurveyId?: string;

  /** The 'fondo' that this survey pertains to.
   * Example: F.LLI Scapellato Salvatore e Marcella società semplice agricola - C.da Luogo Monaco
   */
  fondo?: string;

  /** A long code that identifies the place where the survey took place. Example below
   * arancia moro  BIO (comune) -
   * F.LLI Scapellato Salvatore e Marcella
   */
  placeCode?: string;

  /** The name of the company / producer where the survey took place */
  companyName?: string;

  /** The location in the company where the survey took place
   * Example: terrazze giardino vecchio */
  surveyLocation?: string;

  /** A [Timestamp] representing where the survey took place */
  surveyDate?: EpochTimeStamp;

  /** A string representation of survey date */
  surveyDateString?: string;

  /** The name of the person who did the survey */
  surveyAuthor?: string;

  /** The user id that identifies who did the survey */
  userId?: string;

  /** A bool to check whether it's a complete survey, i.e it wasn't archived */
  isSurveyCompleted: boolean;

  /** Takes note of whether it's a quality or quantity survey */
  surveyType?: string;

  /** The variety of the survey. Ex: arancia moro BIO (comune) */
  variety?: string;

  /** The id of the variety */
  varietyId?: string;

  /** A map representation of [FQuantitySurvey] object */
  quantitySurvey: FQuantitySurvey;

  /** A Map representation of [FQualitySurvey] object */
  qualitySurvey: FQualitySurvey;

  /** Takes note of what document id was assigned to the survey in firebase firestore */
  firebaseDocumentId?: string;

  /** Defines whether this is a valid survey object */
  isValid: boolean;
}
