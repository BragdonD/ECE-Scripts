// ==UserScript==
// @name         Extract Grades With JSON format [ECE Paris]
// @namespace    ECE Paris Script
// @version      0.1
// @description  Allows you to calculate course averages automatically and add the average box to the grades table.
// @author       BragdonD
// @match        https://campusonline.inseec.net/note/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @grant        none
// ==/UserScript==

/**
 * @typedef {Object} Grade
 * @property {number} value
 * @property {number} weight
 */

/**
 * @typedef {CourseGradePart} Project
 * @property {number} weight
 * @property {Array.<Grades>} grades
 */

/**
 * @typedef {CourseGradePart} Continuous
 */

/**
 * @typedef {CourseGradePart} Exams
 */

/**
 * @typedef {CourseGradeParts} Projects
 */

/**
 * @typedef {CourseGradeParts} Resit
 */

/**
 * @typedef {Object} Course
 * @property {string} name
 * @property {Continuous} continuous
 * @property {Exams} exams
 * @property {Projects} projects
 * @property {number} average
 * @property {number} coefficient // ECTS
 * @property {Resit} resit
 */

/**
 * @typedef {Object} Module
 * @property {string} name
 * @property {Array.<Course>} courses
 * @property {number} average
 * @property {number} coefficient // ECTS
 */

/**
 * @typedef {Object} Semester
 * @property {string} name
 * @property {Array.<Module>} modules
 * @property {number} average
 * @note All semester count the same in the year average
 */

/**
 * @typedef {Object} Year
 * @property {string} name
 * @property {Array.<Semester>} semesters
 * @property {number} average
 */

(function () {
  "use strict";
  const resultatsContainerId = "resultat-note";
  const resultatsTableId = "table_note";
  const yearRowClass = "master";
  const semesterAndModuleRowClass = "item-ens";
  const semesterStr = "Semestre";
  const courseRowClass = "item-fpc";
  const coursePartClass = "item-ev1";
  const nameColumnClass = "libelle";
  const resitColumnClass = "rattrapage";
  const gradeColumnClass = "note";
  const courseCoefficientClass = "ponderation";
  const weightColumnClass = "coefficient"; // they inverse it ...

  const resultatsContainer = document.querySelector(
    "#".concat(resultatsContainerId)
  );

  if (!resultatsContainer) {
    return;
  }

  const extractYearsCount = (table) => {
    const years = table.querySelectorAll(".".concat(yearRowClass));
    return years.length;
  };

  const extractGrades = (str) => {
    const grades = str.split(" - ");
  };

  /**
   * Extract all the data for a
   * @param {Array<Element>} yearRows the rows of the table corresponding to the year
   * @param {number} i the index of the semester
   */
  const extractSemester = (yearRows, i) => {
    const rows = Array.from(yearRows);
    const semestersAndModuleRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    const semestersRows = semestersAndModuleRows.filter((row) =>
      row.innerText.includes(semesterStr)
    );
    const semesterRowIndex = rows.indexOf(semestersRows[i]);
    const nextSemesterRowIndex = rows.indexOf(semestersRows[i + 1]);
    const semesterRows = rows.slice(semesterRowIndex, nextSemesterRowIndex);
    console.log(semesterRows);
  };

  /**
   * Extract all the data for a year
   * @param {HTMLAllCollection} tableRows the rows of the table
   * @param {number} i the index of the year
   */
  const extractYear = (tableRows, i) => {
    const rows = Array.from(tableRows);
    const yearsRows = rows.filter((row) =>
      row.classList.contains(yearRowClass)
    );
    const yearRowIndex = rows.indexOf(yearsRows[i]);
    const nextYearRowIndex = rows.indexOf(yearsRows[i + 1]);
    const yearRows = rows.slice(yearRowIndex, nextYearRowIndex);
    for (let i = 0; i < 2; i++) {
      extractSemester(yearRows, i);
    }
  };

  resultatsContainer.arrive("#".concat(resultatsTableId), (table) => {
    const yearsCount = extractYearsCount(table);
    const years = [];
    const tableRows = table.querySelectorAll("tr");
    for (let i = 0; i < yearsCount; i++) {
      years.push(extractYear(tableRows, i));
    }
  });
})();
