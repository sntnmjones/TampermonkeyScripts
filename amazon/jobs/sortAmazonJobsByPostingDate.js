// ==UserScript==
// @name         Sort Amazon Jobs by Posting Date
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Load and sort Amazon job results by posting date
// @author       sntnmjones
// @match        https://amazon.jobs/en/search?*
// @grant        GM_log
// ==/UserScript==

(async function() {
    'use strict';
    const jobMap = new Map();
    let numberOfJobs = 0;

    /**
     * 
     * @param {*} map
     * @param {*} key
     * @param {*} defaultValue
     * @returns
     */
    function getOrDefault(map, key, defaultValue) {
        return map.has(key) ? map.get(key) : defaultValue;
    }

    /**
     *
     */
    function sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Get the job tiles on the current page and add them to the job map
     */
    async function addJobTilesToMap() {
        // Get job tiles on page
        const jobTileList = document.querySelector('.job-tile-lists').innerHTML;
        const jobTiles = document.querySelectorAll('.job-tile');

        numberOfJobs += jobTiles.length;
        if (jobTiles.length > 0) {
            jobTiles.forEach(jobTile => {
                // console.log(`jobtile: ${jobTile.innerHTML}`)
                const postingDateElement = jobTile.querySelector('.posting-date');
                // console.log(`postingDateElement.textContent: ${postingDateElement.textContent}`)

                //  Get job list for this job's date and append job
                const keyDate = new Date(postingDateElement.textContent);
                let curJobs = getOrDefault(jobMap, keyDate, []);

                curJobs.push(jobTile.outerHTML);
                jobMap.set(keyDate, curJobs);
            });
        }
    }

    /**
     *
     */
    function addJobsFoundToPage() {
        console.log('Adding found jobs to page');
        const sortedMap = new Map([...jobMap.entries()].sort((a, b) => b[0] - a[0]));
        // console.log(`sortedMap: ${JSON.stringify(sortedMap)}`);

        // Get the container on the page and append the jobs
        const containerDivs = document.querySelectorAll('.job-tile-lists');
        if (containerDivs.length > 0) {
            containerDivs.forEach(containerDiv => {
                containerDiv.innerHTML = '';

                // reset the job tile list and add jobs
                for (const value of sortedMap.values()) {
                    console.log(JSON.stringify(value.values()));
                    containerDiv.innerHTML += value;
                }
            });
        }
        console.log('Jobs added to page');
    }

    /**
     * Click the next page while able
     */
    async function clickNextPage() {
        const nextButton = document.querySelector('.pagination-control .btn.circle.right');

        if (nextButton) {
            nextButton.click();
            console.log('Clicked next button');
        } else {
            console.log('No more pages to navigate.');
            clearInterval(navigationInterval); // Stop the interval if no more pages
        }
    }

    /**
     * Wait for navigation to be done and return notification
     * @returns
     */
    async function cycleThroughJobs() {
        return new Promise((resolve) => {
            let pageno = 0
            const navigationInterval = setInterval(() => {
                const nextButton = document.querySelector('.pagination-control .btn.circle.right');

                if (!nextButton) {
                    addJobTilesToMap('');
                    clearInterval(navigationInterval); // Stop the interval if no more pages
                    resolve(); // done with job!
                } else {
                    if (document.readyState === 'complete') {
                        pageno += 1
                        console.log(`loaded page: ${pageno}`);
                        addJobTilesToMap('');
                        clickNextPage();
                    } else {
                        // Listen for the load event
                        window.addEventListener('load', console.log('waiting for page to load'));
                    }
                }
            }, 3000); // Wait interval between page clicks
        });
    }

    await cycleThroughJobs().then(() => {
        console.log(`Found [${numberOfJobs}] jobs`)
        addJobsFoundToPage();
    });
})();
