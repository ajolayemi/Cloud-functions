/**
 * A representation of the needed info of a Google Worksheet
 */
export interface SheetInfo {
  /**
   * The name of a Google Worksheet
   */
  name: string;

  /**
   * The unique id for a google worksheet
   */
  id: number;

  /**
   * A letter specifying the first column to read
   */
  firstColumn: string;

  /**
   * A letter specifying the last column to read
   */
  lastColumn: string;
}

/**
 * A simple representation of what is returned when the range of
 * already saved data is looked upon in google sheets data
 */
export interface FilterSheetRangeInfo {
  firstRow: number;
  lastRow: number;
}

/**
 * A representation of what user roles look like
 */
export interface UserRole {
  isAdmin?: boolean;
  isEditor?: boolean;
  isViewer?: boolean;
  isUser?: boolean;
  isSuperUser?: boolean;
}
