// ==UserScript==
// @name         Calculation of averages [ECE Paris]
// @namespace    ECE Paris Script
// @version      0.2
// @description  Allows you to calculate course averages automatically and add the average box to the grades table.
// @author       BragdonD
// @match        https://campusonline.inseec.net/note/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// 
// @grant        none
// @updateURL    https://github.com/BragdonD/ECE-Scripts/blob/main/averagecalcul.js
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
    'use strict';
    const resultatsContainerId = "resultat-note";
    const resultatsTableId = "table_note";
    const averageLocalStorage = "compute-average"

    const resultsContainer = document.querySelector(
        "#".concat(resultatsContainerId)
    );

    if (!resultsContainer) {
        return;
    }

    /**
     * 
     * @param {CourseGradePart} coursePart 
     * @returns {CourseGradePart}
     */
    const homogenizeCoursePartGradesWeight = (coursePart) => {
        const maxPossibleWeight = 100; // for 100%
        let cpTotalWeight = 0.0;

        for (const grade of coursePart.grades) {
            cpTotalWeight += grade.weight;
        }

        if (cpTotalWeight >= 100) {
            return coursePart;
        }

        coursePart.grades.forEach((grade) => {
            grade.weight = (grade.weight / cpTotalWeight) * maxPossibleWeight;
        })
        return coursePart;
    }

    /**
     * 
     * @param {Course} course 
     * @returns {Course}
     */
    const homogenizeCoursePartWeight = (course) => {
        const maxPossibleWeight = 100;
        let cpTotalWeight = 0.0;
        for (const cp of course.courseParts) {
            if (cp.grades.length > 0) {
                cpTotalWeight += cp.weight;
            }
        }

        if (cpTotalWeight >= 100) {
            return course;
        }

        course.courseParts.forEach((cp) => {
            if (cp.grades.length > 0) {
                cp.weight = (cp.weight / cpTotalWeight) * maxPossibleWeight;
            } else {
                cp.weight = 0;
            }
        })
        return course;
    }

    /**
     * 
     * @param {Module} module 
     * @returns {Module}
     */
    const homogenizeModuleCoursesCoeff = (module) => {
        module.courses.forEach((course) => {
            let cpWithGrades = 0;
            for (const cp of course.courseParts) {
                if (cp.grades.length > 0) {
                    cpWithGrades += 1;
                }
            }
            if (cpWithGrades == 0) {
                course.coefficient = 0;
            }
        })
        return module;
    }

    /**
     * 
     * @param {CourseGradePart} cp 
     * @returns {CourseGradePart}
     */
    const computeCoursePartAverage = (cp) => {
        if (cp.grades.length == 0) {
            cp.average = 0;
            return cp;
        }
        for (const grade of cp.grades) {
            if(grade.value == null) {
                cp.average = undefined;
                cp.weight = 0;
                return cp;
            }
            cp.average += grade.value * (grade.weight / 100);
        }
        cp.average = Number(cp.average.toFixed(2));
        return cp;
    }

    /**
     * compute the average of a Course object
     * @param {Course} course 
     */
    const computeCourseAverage = (course) => {
        let availableCP = 0;
        for (const coursePart of course.courseParts) {
            course.average += coursePart.average * (coursePart.weight / 100);
            if (coursePart.weight > 0) {
                availableCP += 1;
            }
        }
        if (availableCP == 0) {
            course.average = undefined
            course.coefficient = 0
        } else {
            course.average = Number(course.average.toFixed(2));
        }
        if (course.resit != undefined && course.resit != null) {
            course.average = course.resit
        }
        return course;
    }

    /**
     * 
     * @param {Module} module 
     * @returns {Module}
     */
    const computeModuleAverage = (module) => {
        let totalCoeff = 0;
        for (const course of module.courses) {
            module.average += course.average * course.coefficient;
            totalCoeff += course.coefficient
        }
        if (totalCoeff > 0) {
            module.average = Number((module.average / totalCoeff).toFixed(2));
        } else {
            module.average = undefined
        }
        return module;
    }

    window.addEventListener("extract-grades", () => {
        let grades = window.localStorage.getItem("grades")
        if (grades == null) {
            return;
        }
        grades = JSON.parse(grades)
        console.log("STARTING TO COMPUTE AVERAGES")
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
                                                cp = homogenizeCoursePartGradesWeight(cp);
                                                cp = computeCoursePartAverage(cp);
                                                return cp
                                            }
                                        );
                                        course = homogenizeCoursePartWeight(course);
                                        course = computeCourseAverage(course);
                                    }
                                )
                                module = homogenizeModuleCoursesCoeff(module);
                                module = computeModuleAverage(module)
                            }
                        );

                    }
                );

            }
        );

        window.localStorage.setItem("grades", JSON.stringify(grades));
        console.log("DONE WITH AVERAGE COMPUTING")
        window.dispatchEvent(new Event("compute-averages"));
    });
})();