/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */

import './styles.scss';
import 'bootstrap';
import axios from 'axios';
import i18n from 'i18next';
import onChange from 'on-change';
import { string, setLocale } from 'yup';
import uniqueId from 'lodash/uniqueId.js';

import parser from './parser.js';
import render from './view.js';
import ru from './locales/ru.js';

const updateTime = 5000;

const validate = (link, links) => {
  const schema = string()
    .trim()
    .url('invalidUrl') // 'Ссылка должна быть валидным URL'
    .required('mustNotBeEmpty') // 'Поле не должно быть пустым'
    .notOneOf(links, 'alreadyAddedUrl'); // 'RSS уже существует'

  return schema.validate(link);
};

const getAxiosRequest = (url, state) => {
  const allOriginsUrl = 'https://allorigins.hexlet.app/get';
  const preparedUrl = new URL(allOriginsUrl);
  preparedUrl.searchParams.set('disableCache', 'true');
  preparedUrl.searchParams.set('url', url);

  return axios
    .get(preparedUrl)
    .then((respons) => respons.data.contents)
    .catch((e) => {
      state.process.error = e.message;
      state.process.state = 'error';
    });
};

const addPosts = (feedId, posts, state) => {
  const preparedPosts = posts.map((post) => ({ ...post, feedId, id: uniqueId() }));
  state.content.posts = [...preparedPosts, ...state.content.posts];
};

const updatePosts = (state) => {
  const promises = state.content.feeds.map(({ link, id }) => getAxiosRequest(link, state).then((response) => {
    const { posts } = parser(response);
    const alreadyAddedPosts = state.content.posts.map((post) => post.link);
    const newPosts = posts.filter((post) => !alreadyAddedPosts.includes(post.link));
    if (newPosts.length > 0) {
      addPosts(id, newPosts, state);
    }
    state.process.state = 'update';

    return Promise.resolve();
  }));

  Promise.allSettled(promises).finally(() => {
    setTimeout(() => updatePosts(state), updateTime);
  });
};

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance
    .init({
      lng: 'ru',
      debug: false,
      resources: {
        ru,
      },
    })
    .then((sourceText) => {
      const initialState = {
        process: {
          state: 'filling',
          error: null,
        },
        content: {
          feeds: [],
          posts: [],
        },
        uiState: {
          modalPostId: null,
          visitedPostId: new Set(),
        },
      };

      const elements = {
        form: document.querySelector('.rss-form'),
        feedback: document.querySelector('.feedback'),
        input: document.querySelector('#url-input'),
        button: document.querySelector('button[type="submit"]'),
        posts: document.querySelector('.posts'),
        feeds: document.querySelector('.feeds'),
        buttonView: document.querySelector('.btn-sm'),
        modal: {
          modalElements: document.querySelector('.modal'),
          title: document.querySelector('.modal-title'),
          body: document.querySelector('.modal-body'),
          buttonReadCompletely: document.querySelector('a[role="button"]'),
        },
      };

      setLocale({
        mixed: {
          url: 'invalidUrl',
          required: 'mustNotBeEmpty',
          notOneOf: 'alreadyAddedUrl',
        },
      });

      const watchedState = onChange(initialState, render(initialState, elements, sourceText));

      updatePosts(watchedState);

      elements.form.addEventListener('submit', (e) => {
        watchedState.process.error = null;
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        const addedLinks = watchedState.content.feeds.map(({ link }) => link);

        validate(url, addedLinks)
          .then((link) => {
            watchedState.process.state = 'sending';
            return getAxiosRequest(link, watchedState);
          })
          .then((response) => {
            if (!watchedState.process.error) {
              const { feed, posts } = parser(response);
              const feedId = uniqueId();
              watchedState.content.feeds.unshift({ ...feed, feedId, link: url });
              addPosts(feedId, posts, watchedState);
              watchedState.process.state = 'finish';
            }
          })
          .catch((err) => {
            const errorMessage = err.message ?? 'defaultError';
            watchedState.process.error = errorMessage;
            watchedState.process.state = 'error';
          });
      });

      elements.modal.modalElements.addEventListener('shown.bs.modal', (e) => {
        watchedState.uiState.modalPostId = e.relatedTarget.dataset.id;
        watchedState.uiState.visitedPostId.add(watchedState.uiState.modalPostId);
        console.log('visited =', watchedState.uiState.visitedPostId);
        watchedState.process.state = 'update';
      });
    });
};
