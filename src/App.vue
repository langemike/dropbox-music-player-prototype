<template>
  <div>
    <img
      alt="Dropbox logo"
      src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Dropbox_logo_2017.svg"
      width="300"
    />
    <!-- <Player /> -->
    <component :is="currentComponent" />
  </div>
</template>

<script>
import Player from "./components/Player.vue";
import Connect from "./components/Connect.vue";
import { DropboxAuth } from "dropbox";

export default {
  name: "App",
  components: {
    Player,
    Connect,
  },
  data() {
    return {
      currentComponent: "Player",
    };
  },
  mounted() {
    let params = new URLSearchParams(window.location.hash.split("#")[1]);
    this.dbxAuth = new DropboxAuth({ clientId: this.clientId });

    if (params.has("access_token")) {
      this.dbxAuth.setAccessToken(params.get("access_token"));
      localStorage.setItem("accessToken", params.get("access_token"));
      //window.location.hash = "";
    }

    if (!this.isAuthenticated()) {
      this.currentComponent = "Connect";
    }
  },
  methods: {
    isAuthenticated() {
      return !!this.dbxAuth.getAccessToken();
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
