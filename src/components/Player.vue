<template>
  <div class="hello">
    <input
      type="search"
      placeholder="Search for music"
      v-model="query"
      @input="searchDebounce"
    />
    <!-- <button @click="search">Search</button> -->
    <ul v-if="searchResults.length > 0" class="searchresults">
      <li v-for="(item, index) in searchResultsExtended" :key="index">
        <span v-if="item.type === 'file'">File: </span>
        <span v-if="item.type === 'folder'">Folder: </span>
        <span v-if="item.type === 'playlist'">Playlist: </span>
        <a
          href="#"
          @click.prevent="tryPlay(item)"
          :title="item.metadata.metadata.path_display"
          >{{ item.name }}</a
        >
      </li>
    </ul>
    <div v-if="nothingFound">No results found.</div>
    <div>
      <audio
        controls
        :src="currentFile"
        ref="audioPlayer"
        @canplay="playWhenReady"
      />
    </div>
    <div>
      <h2>Playlist</h2>
      <!-- <ol>
        <li></li>
      </ol> -->
    </div>

    <div v-if="error">
      {{ errorMessage }}
      <a href="#" @click.prevent="error = null">Ignore</a>
    </div>
  </div>
</template>

<script>
import { Dropbox } from "dropbox";
import { relativeToFile } from "aurelia-path";
import parser from "playlist-parser";
import debounce from "lodash/debounce";
import CustomError from "../utils/CustomError";

export default {
  name: "Player",
  data() {
    return {
      error: null,
      currentFile: "",
      query: "",
      searchResults: [],
      playlist: [],
    };
  },
  computed: {
    nothingFound() {
      return this.searchResults.length === 0 && this.query.trim() !== "";
    },
    searchResultsExtended() {
      return this.searchResults.map((item) => {
        const clone = { ...item };
        clone.type = this.getType(item);
        clone.name = item.metadata.metadata.name;
        return clone;
      });
    },
    errorMessage() {
      switch (this.error) {
        case "ERR_NO_AUDIOFILE_FOUND":
          return "Couldn't find audio file in specified folder";
        case "ERR_LOAD_FILE":
          return "Couldn't load file.";
        case "ERR_UNKNOWN_TYPE":
          return "Format unsupported";
      }
      return "";
    },
  },
  created() {
    this.dbx = new Dropbox({
      accessToken: localStorage.getItem("accessToken"),
    });
  },
  methods: {
    getType(item) {
      if (item.metadata.metadata[".tag"] === "folder") {
        return "folder";
      }
      if (item.metadata.metadata.name.endsWith(".m3u")) {
        return "playlist";
      }
      return "file";
    },
    playWhenReady(event) {
      event.target.play();
    },
    findFirstAudioFile(path) {
      //https://www.dropboxforum.com/t5/Dropbox-API-Support-Feedback/Wildcard-search/td-p/432784
      return new Promise((resolve, reject) => {
        this.dbx
          .filesListFolder({
            path: path,
            recursive: false,
            include_non_downloadable_files: false,
          })
          .then((response) => {
            // Find first audio file
            let audioFile = response.result.entries.find((entry) => {
              let extension = entry.path_lower.split(".").pop();
              return this.audio.audioFileExtensions.indexOf(extension) !== -1;
            });

            if (audioFile) {
              resolve(audioFile.path_lower);
            }

            reject(new CustomError("ERR_NO_AUDIOFILE_FOUND"));
          });
      });
    },
    tryPlay(item) {
      let path = item.metadata.metadata.path_lower;

      new Promise((resolve, reject) => {
        if (item.type === "file") {
          // directly play file
          resolve(path);
        } else if (item.type === "folder") {
          // get first file from folder (recursivly?)
          this.findFirstAudioFile(path).then(resolve).catch(reject);
        } else if (item.type === "playlist") {
          // parse playlist file and play first file in playlist
          this.dbx
            .filesDownload({ path })
            .then((response) => {
              return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", resolve);
                reader.addEventListener("error", () => {
                  reject(new CustomError("ERR_LOAD_FILE"));
                });
                reader.readAsText(response.result.fileBlob);
              });
            })
            .then((event) => event.target.result)
            .then((content) => {
              let entries = parser.M3U.parse(content);
              return relativeToFile(
                entries[0].file.replaceAll("\\", "/"),
                path
              );
            })
            .then(resolve);
        } else {
          reject(new CustomError("ERR_UNKNOWN_TYPE"));
        }
      })
        .then((path) => {
          this.play(path);
        })
        .catch((error) => {
          this.error = error.code;
        });
    },
    play(path) {
      this.error = null;
      this.dbx
        .filesGetTemporaryLink({
          path: path,
        })
        .then((response) => {
          this.currentFile = response.result.link;
        });
    },
    searchDebounce: debounce(function () {
      // https://stackoverflow.com/questions/41238872/are-vue-js-and-debounce-lodash-underscore-compatible/41239824#41239824
      // https://codepen.io/rabelais88/pen/yqQpMy
      this.searchFromQuery();
    }, 400),
    searchFromQuery() {
      let query = this.query.trim();

      if (query.length === 0) {
        this.searchResults = [];
        return;
      }

      this.dbx
        .filesSearchV2({
          query: this.query,
          options: {
            file_categories: ["audio", "folder"],
            order_by: "relevance",
            filename_only: false,
          },
        })
        .then((response) => {
          this.searchResults = response.result.matches;
          console.log(response);
        });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
/* li {
  display: inline-block;
  margin: 0 10px;
} */
a {
  color: #42b983;
}
.searchresults {
  max-height: 400px;
  overflow: auto;
}
</style>
