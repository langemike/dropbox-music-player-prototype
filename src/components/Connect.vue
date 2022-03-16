<template>
  <div class="hello">
    <h1>Web Music Player</h1>
    <button @click="connect" :disabled="busy">Connect to Dropbox</button>
  </div>
</template>

<script>
import { DropboxAuth } from "dropbox";

export default {
  name: "Connect",
  data() {
    return {
      busy: false,
    };
  },
  created() {
    this.dbxAuth = new DropboxAuth({ clientId: this.clientId });
  },
  methods: {
    connect() {
      const urlWithoutQueryString = window.location.href.split("?")[0];
      this.busy = true;
      //https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Javascript-SDK-to-authorize-user-and-get-access-token/td-p/376821
      // See: https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/auth/index.html
      // https://www.tabnine.com/code/javascript/functions/dropbox/Dropbox/getAuthenticationUrl

      this.dbxAuth.getAuthenticationUrl(urlWithoutQueryString).then((url) => {
        window.location.href = url;
      });
    },
  },
};
</script>