
import axios from 'axios'
//超时
axios.defaults.timeout = 10000;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

const baseURL = 'http://127.0.0.1:8081'
axios.defaults.baseURL = baseURL;

axios.interceptors.request.use((data) => {
    if (sessionStorage.tooken) {
        data.headers.tooken = sessionStorage.tooken
    }
    return data;
})
axios.interceptors.response.use((data) => {
    return data
})

export default {
    get: function (url, params) {
        return new Promise((resolve, reject) => {
            axios.get(url, {
                params: params
            }).then((data) => {
                resolve(data)
            }).catch((data) => {
                reject(data)
            })
        })
    },
    post: function (url, params) {
        return new Promise((resolve, reject) => {
            axios.post(url, params).then((data) => {
                resolve(data)
            }).catch(data => reject(data))
        })
    }
}