import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { axiosInstance } from './contrib/aidbox-react/services/instance';


axiosInstance.defaults.auth = {
    username: 'root',
    password: 'secret',
}

if (window.location.origin === 'http://rgv.beda.software/') {
    axiosInstance.defaults.baseURL = 'http://api.rgv.beda.software/';
} else {
    axiosInstance.defaults.baseURL = 'http://localhost:8080';
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
