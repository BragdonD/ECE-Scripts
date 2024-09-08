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
     * Modifies the table to add the average column and the average row.
     * @param {HTMLTableElement} table - The table to modify.
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
     * Finds a course and module row by name in a table.
     * 
     * @param {HTMLTableElement} table - The table to search in.
     * @param {string} name - The name to search for.
     * @returns {HTMLTableRowElement|null} - The found row or null if not found.
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
     * Finds a row in a table by the given course name and course part name.
     * 
     * @param {HTMLTableElement} table - The table to search in.
     * @param {string} cname - The course name to search for.
     * @param {string} cpname - The course part name to search for.
     * @returns {HTMLTableRowElement|null} - The row containing the course part, or null if not found.
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
     * Inserts a grade into a row.
     * 
     * @param {HTMLElement} row - The row element where the grade will be inserted.
     * @param {string} grade - The grade to be inserted.
     * @returns {void}
     */
    const insertGradeInRow = (row, grade) => {
        const rows = Array.from(row.children)
        const averageChild = rows.find((cell) => {
            return cell.classList.contains(averageColCssClass);
        })
        averageChild.textContent = grade;
    }

    
    /**
     * Inserts grades into a table.
     * 
     * @param {HTMLTableElement} table - The table element to insert grades into.
     * @param {Array<Year>} grades - An array of Year objects containing grades.
     * @returns {void}
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

    window.addEventListener("compute-averages", () => {
        const table = document.querySelector("#".concat(resultatsTableId));
        modifyTable(table);
        let grades = window.localStorage.getItem("grades");
        if (grades == null) {
            return;
        }
        console.log("STARTING TO DISPLAY AVERAGES")

        grades = JSON.parse(grades)
        insertGradesInTable(table, grades);
        window.localStorage.removeItem(averageLocalStorage)
        window.localStorage.removeItem("grades")
    });
})();
