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
 * @property {number} value - The value of the grade.
 * @property {number} weight - The weight of the grade.
 */

/**
 * @typedef {Object} CourseGradePart
 * @property {string} name - The name of the course grade part.
 * @property {number} weight - The weight of the course grade part.r}
 * @property {Array.<Grade>} grades - The grades of the course grade part.
 * @property {number} average - The average grade of the course grade part.
 */

/**
 * @typedef {CourseGrade}
 * @property {string} name - The name of the course.
 * @property {Array.<CourseGradePart>} courseParts - The course grade parts.
 * @property {number} coefficient - The coefficient of the course.
 * @property {number} average
 */

/**
 * @typedef {Object} Module
 * @property {string} name - The name of the module.
 * @property {Array.<Course>} courses - The courses of the module.
 * @property {number} average - The average grade of the module.
 */

/**
 * @typedef {Object} Semester
 * @property {string} name - The name of the semester.
 * @property {Array.<Module>} modules - The modules of the semester.
 */

/**
 * @typedef {Object} Year
 * @property {string} name - The name of the year.
 * @property {Array.<Semester>} semesters - The semesters of the year.
 */

(function () {
  "use strict";
  const resultatsContainerId = "resultat-note";
  const resultatsTableId = "table_note";
  const yearRowClass = "master";
  const semesterAndModuleRowClass = "item-ens";
  const semesterStr = ["Semestre"];
  const semesterMistakeStr = "Semestre Académique";
  const courseRowClass = "item-fpc";
  const coursePartClass = "item-ev1";
  const nameColumnClass = "libelle";
  const resitColumnClass = "rattrapage";
  const gradeColumnClass = "note";
  const courseCoefficientClass = "ponderation";
  const weightColumnClass = "coefficient"; // they inverse it ...
  const semesterNumber = 2;

  const resultsContainer = document.querySelector(
    "#".concat(resultatsContainerId)
  );

  if (!resultsContainer) {
    return;
  }

  /**
   * Extract the number of years in the table
   * @param {HTMLTableElement} table
   * @returns {number} the number of years in the table
   */
  const extractYearsCount = (table) => {
    const years = table.querySelectorAll(".".concat(yearRowClass));
    return years.length;
  };

  /**
   * Extract the grades from a string
   * @param {string} str
   * @returns {Array.<Grade>} the extracted grades from str
   */
  const extractGrades = (str) => {
    let grades = str.split(" - ");
    grades = grades.map((grade) => {
      const gradeCoefficient = grade.split(" ");
      let gradeValue = parseFloat(gradeCoefficient[0]?.replace(",", "."));
      let gradeWeight = gradeCoefficient[1];
      if (gradeWeight === undefined || gradeWeight === null || gradeWeight === "") {
        gradeWeight = 100.0;
      } else {
        gradeWeight = gradeWeight.replace("(", "");
        gradeWeight = gradeWeight.replace(")", "");
        gradeWeight = parseFloat(gradeWeight.replace(",", "."));
      }

      if (gradeValue === NaN) {
        gradeValue = undefined;
      }

      return {
        value: gradeValue,
        weight: gradeWeight,
      };
    });
    return grades;
  };


  /**
   * Extracts a course part from a table row.
   *
   * @param {HTMLElement} coursePartRow - The table row containing the course part.
   * @returns {Object} - The extracted course part object.
   */
  const extractCoursePartFromTable = (coursePartRow) => {
    let coursePart = {
      name: coursePartRow.querySelector(".".concat(nameColumnClass)).innerText,
      weight: parseFloat(
        coursePartRow
          .querySelector(".".concat(weightColumnClass))
          .innerText.replace(",", ".")
      ),
      grades: extractGrades(
        coursePartRow.querySelector(".".concat(gradeColumnClass)).innerText
      ),
      average: 0
    };
    return coursePart;
  };

  /**
   * Extracts course information from a course row element.
   * @param {HTMLElement} courseRow - The course row element.
   * @returns {Object} - The extracted course information.
   * @property {string} name - The name of the course.
   * @property {number} coefficient - The coefficient of the course.
   * @property {number} resit - The resit value of the course.
   * @property {Array} courseParts - The array of course parts.
   */
  const extractCourseInformation = (courseRow) => {
    return {
      name: courseRow.querySelector(".".concat(nameColumnClass)).innerText,
      coefficient: parseFloat(
        courseRow
          .querySelector(".".concat(courseCoefficientClass))
          .innerText.replace(",", ".")
      ),
      resit: parseFloat(
        courseRow.querySelector(".".concat(resitColumnClass)).innerText
      ),
      courseParts: []
    };
  };

  /**
   * Extracts the number of courses from the given module rows.
   *
   * @param {NodeList} moduleRows - The module rows to extract the course number from.
   * @returns {number} The number of courses extracted from the module rows.
   */
  const extractCourseNumberFromTable = (moduleRows) => {
    const rows = Array.from(moduleRows);
    let coursesRows = rows.filter((row) =>
      row.querySelector(".".concat(courseRowClass))
    );
    return coursesRows.length;
  };

  /**
   * Extract the course from the module rows
   * @param {Array.<HTMLTableRowElement>} moduleRows rows of the table corresponding to the module
   * @param {number} i module's index
   * @returns {Course} the course extracted from the table
   */
  const extractCourseFromTable = (moduleRows, i) => {
    const rows = Array.from(moduleRows);
    let coursesRows = rows.filter((row) =>
      row.querySelector(".".concat(courseRowClass))
    );
    const courseRowIndex = rows.indexOf(coursesRows[i]);
    let nextCourseRowIndex = rows.indexOf(coursesRows[i + 1]);
    if (nextCourseRowIndex === -1) {
      nextCourseRowIndex = rows.length;
    }
    const courseRows = rows.slice(courseRowIndex, nextCourseRowIndex);
    /**
     * @type {Course}
     */
    let course = {}
    if (courseRows.length >= 1) {
      course = extractCourseInformation(courseRows[0]);
    }
    for (let i = 1; i < courseRows.length; i++) {
      let coursePart = extractCoursePartFromTable(courseRows[i]);
      course.courseParts.push(coursePart);
    }
    course.average = 0;
    return course;
  };

  const extractModuleInformation = (moduleRow) => {
    return {
      name: moduleRow.querySelector(".".concat(nameColumnClass)).innerText,
    };
  };

  const extractModuleNumberFromTable = (semesterRows) => {
    const rows = Array.from(semesterRows);
    let modulesRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    modulesRows = modulesRows.filter((row) => {
      for (let i = 0; i < semesterStr.length; i++) {
        if (!row.innerText.includes(semesterStr[i])) {
          return true;
        }
      }
      return false;
    });
    return modulesRows.length;
  };

  /**
   * Extracts module information from a module row.
   *
   * @param {HTMLElement} moduleRow - The module row element.
   * @returns {Object} - The extracted module information.
   * @property {string} name - The name of the module.   * @property {number} average - The average grade of the module.
   */
  const extractModuleFromTable = (semesterRows, i) => {
    const rows = Array.from(semesterRows);
    let modulesRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    modulesRows = modulesRows.filter((row) => {
      for (let i = 0; i < semesterStr.length; i++) {
        if (!row.innerText.includes(semesterStr[i])) {
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
    const courses = [];
    for (let i = 0; i < extractCourseNumberFromTable(moduleRows); i++) {
      courses.push(extractCourseFromTable(moduleRows, i));
    }
    return {
      ...extractModuleInformation(moduleRows[0]),
      courses: courses,
    };
  };

  /**
   * Extracts semester information from a given semester row.
   *
   * @param {HTMLElement} semesterRow - The HTML element representing the semester row.
   * @returns {Object} - An object containing the extracted semester information.
   * @property {string} name - The name of the semester.
   */
  const extractSemesterInformation = (semesterRow) => {
    return {
      name: semesterRow.querySelector(".".concat(nameColumnClass)).innerText,
    };
  }

  /**
   * Extracts the semester information from a table of year rows.
   *
   * @param {NodeList} yearRows - The list of year rows in the table.
   * @param {number} i - The index of the semester row to extract.
   * @returns {Object} - The extracted semester information, including modules.
   */
  const extractSemesterFromTable = (yearRows, i) => {
    const rows = Array.from(yearRows);
    const semestersAndModuleRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    let semestersRows = semestersAndModuleRows.filter((row) =>
      row.innerText.includes(semesterStr)
    );
    semestersRows = semestersRows.filter(
      (row) => !row.innerText.includes(semesterMistakeStr)
    );
    const semesterRowIndex = rows.indexOf(semestersRows[i]);
    let nextSemesterRowIndex = rows.indexOf(semestersRows[i + 1]);
    if (nextSemesterRowIndex === -1) {
      nextSemesterRowIndex = rows.length;
    }
    const semesterRows = rows.slice(semesterRowIndex, nextSemesterRowIndex);
    const modules = [];
    for (let i = 0; i < extractModuleNumberFromTable(semesterRows); i++) {
      const module = extractModuleFromTable(semesterRows, i);
      modules.push(module);
    }
    return {
      ...extractSemesterInformation(semesterRows[0]),
      modules: modules,
    }
  };

  /**
   * Extracts year information from a given year row.
   * @param {HTMLElement} yearRow - The year row element.
   * @returns {Object} - The extracted year information.
   */
  const extractYearInformation = (yearRow) => {
    return {
      name: yearRow.querySelector(".".concat(nameColumnClass)).innerText,
    };
  }

  /**
   * Extract all the data for a year
   * @param {HTMLAllCollection} tableRows the rows of the table
   * @param {number} i the index of the year
   */
  const extractYearFromTable = (tableRows, i) => {
    const rows = Array.from(tableRows);
    const yearsRows = rows.filter((row) =>
      row.classList.contains(yearRowClass)
    );
    const yearRowIndex = rows.indexOf(yearsRows[i]);
    const nextYearRowIndex = rows.indexOf(yearsRows[i + 1]);
    const yearRows = rows.slice(yearRowIndex, nextYearRowIndex);
    const semesters = [];
    for (let i = 0; i < semesterNumber; i++) {
      semesters.push(extractSemesterFromTable(yearRows, i));
    }
    return {
      ...extractYearInformation(yearRows[0]),
      semesters: semesters,
    };
  };

  /**
   * This functions remove all the part that are stucks between two
   * .item-ens that are not a module or doesn't have a name...
   * @param {HTMLAllCollection} tableRows the rows of the table
   */
  const removeUselessPartsFromTable = (tableRows) => {
    const rows = Array.from(tableRows);
    const semestersAndModuleRows = rows.filter((row) =>
      row.querySelector(".".concat(semesterAndModuleRowClass))
    );
    for (let i = 0; i < semestersAndModuleRows.length; i++) {
      if (semestersAndModuleRows[i].innerText === "") {
        // no name module that are a mistake
        const rowIndex = rows.indexOf(semestersAndModuleRows[i]);
        const nextRowIndex = rows.indexOf(semestersAndModuleRows[i + 1]);
        for (let j = rowIndex; j < nextRowIndex; j++) {
          tableRows.item(j).remove();
        }
      }
    }
  };

  resultsContainer.arrive("#".concat(resultatsTableId), (table) => {
    console.log("STARTING TO EXTRACT GRADES")
    const yearsCount = extractYearsCount(table);
    const years = [];
    let tableRows = table.querySelectorAll("tr");
    removeUselessPartsFromTable(tableRows); // clean the table
    tableRows = table.querySelectorAll("tr"); // update the tableRows
    for (let i = 0; i < yearsCount; i++) {
      const year = extractYearFromTable(tableRows, i);
      years.push(year);
    }

    const json = JSON.stringify(years);
    window.localStorage.setItem("grades", json);
    console.log("DONE WITH EXTRACTION")
    window.dispatchEvent(new Event("extract-grades"));
  });
})();
