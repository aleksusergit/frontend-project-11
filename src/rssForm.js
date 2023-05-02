/* eslint-disable import/no-extraneous-dependencies */

import './styles.scss';
import 'bootstrap';
import axios from 'axios';
import i18n from 'i18next';
import onChange from 'on-change';
import { string, setLocale } from 'yup';
import last from 'lodash/last.js';
import uniqueId from 'lodash/uniqueId.js';

import parser from './parser.js';
import render from './view.js';
import ru from './locales/ru.js';

const validate = (link, state) => {
  const schema = string()
    .trim()
    .url('invalidUrl') // 'Ссылка должна быть валидным URL'
    .required('mustNotBeEmpty') // 'Поле не должно быть пустым'
    .notOneOf(state.content.urls, 'alreadyAddedUrl'); // 'RSS уже существует'

  return schema.validate(link);
};

const getAxiosRequest = (state) => {
  const url = last(state.content.urls);
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

export default () => {
  console.log('Start!');

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
          urls: [],
          feeds: [],
          posts: [],
        },
        uiState: {},
      };

      const elements = {
        form: document.querySelector('.rss-form'),
        feedback: document.querySelector('.feedback'),
        input: document.querySelector('#url-input'),
        button: document.querySelector('button[type="submit"]'),
        posts: document.querySelector('.posts'),
        feeds: document.querySelector('.feeds'),
        modal: {},
      };

      setLocale({
        mixed: {
          url: 'invalidUrl',
          required: 'mustNotBeEmpty',
          notOneOf: 'alreadyAddedUrl',
        },
      });

      const watchedState = onChange(initialState, render(initialState, elements, sourceText));

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');

        validate(url, watchedState)
          .then((link) => {
            watchedState.content.urls.push(link); // 'RSS успешно загружен'
            watchedState.process.state = 'sending';
            return getAxiosRequest(watchedState);
          })
          .then((response) => {
            if (!watchedState.process.error) {
              const { feeds, posts } = parser(response);
              posts.forEach((post) => {
                post.postId = uniqueId();
              });
              watchedState.content.feeds.unshift(feeds);
              watchedState.content.posts.unshift(posts);
              watchedState.process.state = 'finish';
            }
          })
          .catch((err) => {
            watchedState.process.error = err.message;
            watchedState.process.state = 'error';
          });
      });
    });
};
