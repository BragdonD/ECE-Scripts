// ==UserScript==
// @name         Display average [ECE Paris]
// @namespace    ECE Paris Script
// @version      0.1
// @description  Allows you to display the result of the calcul-average script inside the grades table.
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
 * @typedef {Object} CourseGradePart
 * @property {string} name
 * @property {number} weight
 * @property {Array.<Grade>} grades
 * @property {number} average
 */

/**
 * @typedef {CourseGradeParts} Resit
 */

/**
 * @typedef {Object} Course
 * @property {string} name
 * @property {Array.<CourseGradePart>} courseParts // the name of the part are not always the same
 * @property {number} coefficient // ECTS
 * @property {Resit} resit
 * @property {number} average
 */

/**
 * @typedef {Object} Module
 * @property {string} name
 * @property {Array.<Course>} courses
 * @property {number} average
 */

/**
 * @typedef {Object} Semester
 * @property {string} name
 * @property {Array.<Module>} modules
 * @note All semester count the same in the year average
 */

/**
 * @typedef {Object} Year
 * @property {string} name
 * @property {Array.<Semester>} semesters
 */

(function () {
    "use strict";
    const resultatsContainerId = "resultat-note";
    const resultatsTableId = "table_note";
    const averageLocalStorage = "compute-average"
    const semesterAndModuleRowClass = "item-ens";
    const studentNameHeaderCssClass = "etudiant"
    const courseRowClass = "item-fpc";
    const coursePartClass = "item-ev1";
    const averageColHeaderText = "Moyenne<br/>Average"
    const averageColHeaderCssClass = "entete-average"
    const averageColCssClass = "average";
    const tdCssStyleStr = "font-weight: 400!important; text-align: center; border-right: 1px solid #d3d3d3; max-width: 100px;";

    const resultsContainer = document.querySelector(
        "#".concat(resultatsContainerId)
    );

    if (!resultsContainer) {
        return;
    }

    /**
     * 
     * @param {HTMLTableElement} table 
     */
    const modifyTable = (table) => {
        const rows = table.rows
        for (const row of rows) {
            // Check what kind of row it is
            const pn = row.parentNode;
            const cn = row.querySelectorAll("td, th");
            if (!cn || cn.length <= 0) {
                continue
            }
            const fc = cn[0];
            console.log(pn.tagName)
            // if it is the table's header
            if (pn.tagName === "THEAD" && !fc.classList.contains(studentNameHeaderCssClass)) {
                const newHeader = document.createElement('th');
                newHeader.classList.add(averageColHeaderCssClass);
                newHeader.innerHTML = averageColHeaderText;
                row.appendChild(newHeader);
                continue;
            }

            const newTd = document.createElement('td');
            newTd.classList.add(averageColCssClass);
            if (fc.classList.contains(coursePartClass)) {
                newTd.classList.add(courseRowClass);
            } else if (fc.classList.contains(courseRowClass)) {
                newTd.classList.add(coursePartClass);
            } else {
                newTd.classList.add(semesterAndModuleRowClass)
            }
            newTd.setAttribute("style", tdCssStyleStr);
            row.appendChild(newTd);
        }
    }

    /**
     * 
     * @param {HTMLTableElement} table 
     * @param {string} name
     * @returns 
     */
    const findCourseAndModuleRowByName = (table, name) => {
        const rows = Array.from(table.rows);
        return rows.find((row) => {
            const cn = row.children;
            if (!cn || cn.length <= 0) {
                return false
            }
            const fc = cn[0]
            if (fc.textContent === name) {
                return true;
            }
            return false;
        })
    }

    /**
     * 
     * @param {HTMLTableElement} table 
     * @param {string} cname 
     * @param {string} cpname 
     */
    const findCoursePartRowByCourseName = (table, cname, cpname) => {
        const rows = Array.from(table.rows);
        let courseFound = false;
        for (const row of rows) {
            const cn = row.children;
            if (!cn || cn.length <= 0) {
                continue
            }
            const fc = cn[0]
            if (fc.textContent === cname) {
                courseFound = true;
            } else if (courseFound && fc.textContent === cpname) {
                return row;
            }
        }
        return null;
    }

    /**
     * 
     * @param {HTMLTableRowElement} row 
     * @param {number} grade
     */
    const insertGradeInRow = (row, grade) => {
        const rows = Array.from(row.children)
        const averageChild = rows.find((cell) => {
            return cell.classList.contains(averageColCssClass);
        })
        averageChild.textContent = grade;
    }

    /**
     * 
     * @param {HTMLTableElement} table 
     * @param {Year[]} grades 
     */
    const insertGradesInTable = (table, grades) => {
        // kinda forced due to composition
        grades.forEach(
            /**
             * 
             * @param {Year} year 
             */
            (year) => {
                year.semesters.forEach(
                    /**
                     * 
                     * @param {Semester} semester 
                     */
                    (semester) => {
                        semester.modules.forEach(
                            /**
                             * 
                             * @param {Module} module 
                             */
                            (module) => {
                                module.courses.forEach(
                                    /**
                                     * 
                                     * @param {Course} course 
                                     */
                                    (course) => {
                                        course.courseParts.forEach(
                                            /**
                                             * 
                                             * @param {CourseGradePart} coursePart 
                                             */
                                            (cp) => {
                                                const row = findCoursePartRowByCourseName(table, course.name, cp.name);
                                                if (row == null) {
                                                    return;
                                                }
                                                insertGradeInRow(row, cp.average);
                                            }
                                        );
                                        const row = findCourseAndModuleRowByName(table, course.name);
                                        if (row == undefined) {
                                            return;
                                        }
                                        insertGradeInRow(row, course.average)
                                    }
                                )
                                const row = findCourseAndModuleRowByName(table, module.name);
                                if (row == undefined) {
                                    return;
                                }
                                insertGradeInRow(row, module.average)
                            }
                        );

                    }
                );

            }
        );
    }

    /**
       * retrieves the grades from the local storage
       * @returns {Year[] | null} The grades retrieves from local storage
       */
    const retrievesGradesFromLocalStorage = () => {
        let retry = 0;
        /**
         * @type {Year[]}
         */
        let grades = [];
        let computed = null;
        // wait for max 15s (the extract script should have had enough time to end)
        do {
            computed = window.localStorage.getItem("compute-average");
            retry += 1;
            setTimeout(() => { }, 5000);
            if (retry > 4) {
                console.error("timeout while trying to retrieves the compute average proof from the local storage");
                return null;
            }
            grades = window.localStorage.getItem("grades");
        } while (computed == null);
        return grades;
    }

    resultsContainer.arrive("#".concat(resultatsTableId), (table) => {
        modifyTable(table);
        let grades = retrievesGradesFromLocalStorage();
        if (grades == null) {
            return;
        }

        grades = JSON.parse(grades)
        insertGradesInTable(table, grades);
        window.localStorage.removeItem(averageLocalStorage)

    });
})();
