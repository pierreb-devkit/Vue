/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { sum, flatten, merge } from 'lodash-es';
import GhostContentAPI from '@tryghost/content-api';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import * as tools from '../../../lib/helpers/tools';

/**
 * Store definition.
 */
export const useHomeStore = defineStore('home', {
  state: () => ({
    team: [],
    contents: [],
    news: [],
    contact: {},
    statistics: null,
  }),

  actions: {
    initStatistics() {
      this.statistics = config.home.statistics ? config.home.statistics.content : null;
    },

    async getTeam() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const team = await axios.get(`${api}/${config.api.endPoints.home}/team`);
        this.team = team.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    async getChangelogs() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const changelogs = await axios.get(`${api}/${config.api.endPoints.home}/changelogs`);
        this.contents = changelogs.data.data.map((item) => ({
          title: item.title,
          markdown: item.markdown.replace(/\[([^\\[\]]*)\]\((.*?)\)/gm, '$1').replace(/\(\w{7}\)/g, ''),
          style: 'air',
        }));
      } catch (err) {
        console.log(err);
      }
    },

    async getPages(name) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const pages = await axios.get(`${api}/${config.api.endPoints.home}/pages/${name}`);
        this.contents = pages.data.data.map((item) => {
          const firstLine = item.markdown.split('\n')[0];
          return {
            title: item.title || null,
            banner: firstLine[0] === '!' ? /\(([^)]+)\)/.exec(firstLine)[1] : null,
            markdown: firstLine[0] === '!' ? item.markdown.substring(firstLine.length + 2) : item.markdown,
            style: 'classic',
          };
        });
      } catch (err) {
        console.log(err);
      }
    },

    async getNews() {
      try {
        // Vérifier que la configuration existe avant d'accéder aux propriétés
        if (!config.home.blog || !config.home.blog.url || !config.home.blog.key) {
          console.warn('blog configuration is missing url or key');
          return;
        }

        const ghost = new GhostContentAPI({
          url: config.home.blog.url,
          key: config.home.blog.key,
          version: 'v3.0',
        });
        const res = await ghost.posts.browse({ limit: 6, filter: 'tag:article' });
        this.news = res;
      } catch (err) {
        console.log(err);
      }
    },

    async getStatistics() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const tasks = await axios.get(`${api}/${config.api.endPoints.tasks}/stats`);
        const releases = await axios.get(`${api}/${config.api.endPoints.home}/releases`);
        const users = await axios.get(`${api}/${config.api.endPoints.users}/stats`);

        if (this.statistics) {
          this.statistics[0].value = tasks.data.data;
          this.statistics[1].value = sum(
            flatten(
              releases.data.data.map((release) => {
                if (release.list.length > 0) {
                  return tools.releasesNumber(release.list[0].name);
                }
                return 0;
              }),
            ).map((x) => +x),
          );
          this.statistics[2].value = users.data.data;
        }
      } catch (err) {
        console.log(err);
      }
    },

    setContact(data) {
      this.contact = data;
    },

    updateContact(data) {
      merge(this.contact, data);
    },
  },
});

/**
 * Exports.
 */
export default useHomeStore;
