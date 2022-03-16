import { createApp } from 'vue'
import App from './App.vue'

let app = createApp(App);

// https://stackoverflow.com/questions/63100658/add-global-variable-in-vue-js-3
app.config.globalProperties.clientId = '8ysdni36925ov5y';
app.config.globalProperties.audio = {
    playlistFileExtensions: ['m3u'],
    audioFileExtensions: ['mp3']
};

app.mount('#app');
