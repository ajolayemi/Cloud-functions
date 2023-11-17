export interface QualitySurveyGoogleSheetData {
  surveyCompleteCode: string;
  varietyName: string;
  idVarieta: string;
  surveyShortCode: string;
  author: string;
  surveyDate: EpochTimeStamp;
  placeCode: string;
  fQualitySurvey: FQualitySurvey;
}

export interface FQualitySurvey {
  /**
   * The survey beneficiary
   */
  beneficiary?: string;

  /** response to the question: 'prelevati campioni?' */
  samples?: string;

  /** response to the question: 'ci sono frutti ammuffiti a terra?' */
  fruitState?: string;

  /** response to the question: 'le piante sono vigorose...' */
  plantState?: string;

  /** response to the question 'livello di pigmentazione' */
  pigmentation?: string;

  /** response to the question: le piante sono troppo ravvicinate tra loro? */
  arePlantsClose?: string;

  /** response to the question: il terreno è pulito, lavorato e/o sfacciato? */
  isFarmLandClean?: string;

  /** stores the firebase storage path where the farmland photo took during survey is stored */
  farmlandPhotoPath?: string;

  /** stores the name of the farmland photo stored in firebase storage */
  farmlandPhotoName?: string;

  /** response to the question: piante adeguatamente potate? */
  arePlantsPruned?: string;

  /** stores the firebase storage path where the plant photo took during survey is stored */
  plantPhotoPath?: string;

  /** stores the name of the plant photo stored in firebase storage */
  plantPhotoName?: string;

  /** response to the question: ci sono trappole a feromoni o altri mezzi di lotta biologica? */
  areThereTraps?: string;

  /** response to the question: 'la chioma si presenta ben diradata all\'interno?' */
  foliageState?: string;

  /** response to the question: brix rilevati in campo */
  brix?: number;

  /** response to the question: La strada, fino al campo, è facilmente percorribile? */
  roadState?: string;

  /** response to the question: i frutti presentano difetti? */
  areFruitsDamaged?: string;

  /** response to the question: % difetti dei frutti */
  fruitDamagePercentage?: number;

  /** response to the question: note */
  notes?: string;
}
