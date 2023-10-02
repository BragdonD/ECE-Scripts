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
  const semesterMistakeStr = "Semestre Académique";
  const moduleStr = ["Module", "LFH"];
  const moduleMistakeStr = ["Module Mineure"];
  const courseRowClass = "item-fpc";
  const coursePartClass = "item-ev1";
  const nameColumnClass = "libelle";
  const resitColumnClass = "rattrapage";
  const gradeColumnClass = "note";
  const courseCoefficientClass = "ponderation";
  const weightColumnClass = "coefficient"; // they inverse it ...
  const semesterNumber = 2;

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

  const extractModuleNumber = (semesterRows) => {
    const rows = Array.from(semesterRows);
    let modulesRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    modulesRows = modulesRows.filter((row) => {
      for (let i = 0; i < moduleStr.length; i++) {
        if (row.innerText.includes(moduleStr[i])) {
          return true;
        }
      }
      return false;
    });
    return modulesRows.length;
  }

  const extractModule = (semesterRows, i) => {
    const rows = Array.from(semesterRows);
    let modulesRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    modulesRows = modulesRows.filter((row) => {
      for (let i = 0; i < moduleStr.length; i++) {
        if (row.innerText.includes(moduleStr[i])) {
          return true;
        }
      }
      return false;
    });
    const moduleRowIndex = rows.indexOf(modulesRows[i]);
    let nextModuleRowIndex = rows.indexOf(modulesRows[i + 1]);
    if (nextModuleRowIndex === -1) {
      nextModuleRowIndex = rows.length;
    }
    const moduleRows = rows.slice(moduleRowIndex, nextModuleRowIndex);
    console.log(moduleRows);
    if (moduleRows.length === 0) {
      return undefined;
    } else {
      return {}
    }
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
    let semestersRows = semestersAndModuleRows.filter((row) =>
      row.innerText.includes(semesterStr)
    );
    semestersRows = semestersRows.filter((row) =>
      !row.innerText.includes(semesterMistakeStr)
    );
    const semesterRowIndex = rows.indexOf(semestersRows[i]);
    let nextSemesterRowIndex = rows.indexOf(semestersRows[i + 1]);
    if (nextSemesterRowIndex === -1) {
      nextSemesterRowIndex = rows.length;
    }
    const semesterRows = rows.slice(semesterRowIndex, nextSemesterRowIndex);
    const modules = [];
    for (let i = 0; i < extractModuleNumber(semesterRows); i++) {
      const module = extractModule(semesterRows, i);
      modules.push(module);
    }
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
    for (let i = 0; i < semesterNumber; i++) {
      extractSemester(yearRows, i);
    }
  };

  /**
   * This functions remove all the part that are stucks between two 
   * .item-ens that are not a module or doesn't have a name...
   * @param {HTMLAllCollection} tableRows the rows of the table
   */
  const removeUselessParts = (tableRows) => {
    const rows = Array.from(tableRows);
    const semestersAndModuleRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    for(let i = 0; i < semestersAndModuleRows.length; i++) {
      for(let j = 0; j < moduleStr.length; j++) {
        if(semestersAndModuleRows[i].innerText.includes(moduleMistakeStr[j])) {
          const rowIndex = rows.indexOf(semestersAndModuleRows[i]);
          tableRows.item(rowIndex).remove();
        }
      }
      if(semestersAndModuleRows[i].innerText === "") { // no name module that are a mistake
        const rowIndex = rows.indexOf(semestersAndModuleRows[i]);
        const nextRowIndex = rows.indexOf(semestersAndModuleRows[i + 1]);
        for(let j = rowIndex; j < nextRowIndex; j++) {
          tableRows.item(j).remove();
        }
      }
    }
  }

  resultatsContainer.arrive("#".concat(resultatsTableId), (table) => {
    const yearsCount = extractYearsCount(table);
    const years = [];
    let tableRows = table.querySelectorAll("tr");
    removeUselessParts(tableRows); // clean the table
    tableRows = table.querySelectorAll("tr"); // update the tableRows
    for (let i = 0; i < yearsCount; i++) {
      const year = extractYear(tableRows, i);
      years.push(year);
    }
  });
})();
