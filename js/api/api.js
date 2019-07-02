/**
 * @file: js/api/api.js
 * @author: Leonid Vinikov <czf.leo123@gmail.com>
 * @description: inseatd of using jquery ajax, i choosed this.
 */

import Logger from '../modules/logger.js';

export default class API {

    /**
     * Function constructor() : Create API
     * 
     * @param {string} apiBaseUrl 
     */
    constructor(apiBaseUrl = 'http://localhost:8080/api/?cmd=') {
        this.logger = new Logger(this, true);
        this.logger.startWith({apiBaseUrl});

        this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Function fetch() : fetch api
     * 
     * @param {string} path 
     * @param {string} method 
     * @param {{}} body 
     * 
     * @return {any}
     */
    async fetch(path, method, body = null) {
        this.logger.startWith({ path, method, body });
        //if (this.debug) console.log(`${this.constructor.name}::fetch('${path}', '${method}', ${Boolean(body)})`);

        const params = { 'credentials': 'include' }; // cookies

        const headers = {}

        if (method === 'post') {
            Object.assign(headers, { 'Content-Type': 'application/json' });
            Object.assign(params, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

        } else {
            Object.assign(params, { headers });
        }

        // since i made it async function
        const response = await fetch(this.apiBaseUrl + path, params);
        const data = await response.json();

        this.logger.recv({ path }, data);
        
        if (data.error)  {
            data.message = this.translateError(data.message);

            if (data.global) {
                throw data.message;
            }
        }
    
        return data;
    }

    /**
     * Function translateError() : Used to translate server error.
     * 
     * @param {({}|string)} message 
     * 
     * @return {string}
     */
    translateError(message) {
        this.logger.startWith({ message });

        if (typeof message == 'object') {
            message = message.map(element => {
                return this.translateError(element);
            });
        }

        switch (message) {
            case 'system_error':
                return 'system error. please contact the system administrator';
        }

        return message;
    }

    /**
     * Function get() : Send get request
     * 
     * @param {string} path 
     * 
     * @return {any}
     */
    get(path) {
        this.logger.startWith({ path });

        return this.fetch(path, 'get');
    }

    /**
     * Funciton post() : Send post request
     * 
     * @param {string} path 
     * @param {{}} params 
     * 
     * @return {any}
     */
    post(path, params) {
        this.logger.startWith({ path, params });

        return this.fetch(path, 'post', params);
    }
}