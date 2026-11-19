/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { merge } from 'lodash-es';
import GhostContentAPI from '@tryghost/content-api';
import axios from '../../../lib/services/axios';
import config, { apiBase } from '../../../lib/services/config';
import { createLogger } from '../../../lib/helpers/logger';
import { isModuleActive } from '../../../lib/helpers/modules';

const log = createLogger('home');

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
    /**
     * Copy the configured statistics, dropping any item whose `module` is
     * switched off (`config.modules.<name>.activated: false`).
     * @returns {void}
     */
    initStatistics() {
      const content = config.home.statistics?.content;
      this.statistics = Array.isArray(content)
        ? content.filter((item) => !item?.module || isModuleActive(item.module)).map((item) => ({ ...item }))
        : null;
    },

    async getTeam() {
      const api = apiBase();

      try {
        const team = await axios.get(`${api}/${config.api.endPoints.home}/team`);
        this.team = team.data.data;
      } catch (err) {
        log.error(err);
      }
    },

    async getPages(name) {
      const api = apiBase();

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
        log.error(err);
      }
    },

    async getNews() {
      try {
        // Check the articles config exists before reading its properties
        if (!config.home?.articles?.url || !config.home?.articles?.key) {
          log.warn('articles configuration is missing url or key');
          return;
        }

        const ghost = new GhostContentAPI({
          url: config.home.articles.url,
          key: config.home.articles.key,
          version: 'v3.0',
        });
        const res = await ghost.posts.browse({ limit: 6, filter: 'tag:article' });
        this.news = res;
      } catch (err) {
        log.error(err);
      }
    },

    /**
     * Fetch the live value of every statistic that names a `source` (a key of
     * `config.api.endPoints`, e.g. 'tasks' → GET /api/tasks/stats). Items
     * without a source keep their configured value; one failed fetch leaves
     * the others untouched. A source that is not a key of `api.endPoints` is
     * skipped with a warning.
     * @returns {Promise<void>}
     */
    async getStatistics() {
      if (!Array.isArray(this.statistics)) return;
      const api = apiBase();

      await Promise.all(this.statistics.filter((item) => item?.source).map(async (item) => {
        const endPoint = config.api.endPoints?.[item.source];
        if (!endPoint) {
          log.warn(`statistic source "${item.source}" is not a key of api.endPoints, skipped`);
          return;
        }
        try {
          const res = await axios.get(`${api}/${endPoint}/stats`);
          item.value = res.data.data;
        } catch (err) {
          log.error(err);
        }
      }));
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
