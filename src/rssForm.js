/* eslint-disable import/no-extraneous-dependencies */

import './styles.scss';
import 'bootstrap';
import i18n from 'i18next';
import onChange from 'on-change';
import { string, setLocale } from 'yup';
// import _ from 'lodash';
// import keyBy from 'lodash/keyBy.js';
// import isEmpty from 'lodash/isEmpty.js';

import render from './view.js';
import ru from './locales/ru.js';

const validate = (link, links) => {
  const schema = string()
    .trim()
    .url('invalidUrl') // 'Ссылка должна быть валидным URL'
    .required('mustNotBeEmpty') // 'Поле не должно быть пустым'
    .notOneOf(links, 'alreadyAddedUrl'); // 'RSS уже существует'

  return schema.validate(link);
};

export default () => {
  console.log('Start!');

  const i18nInstance = i18n.createInstance();
  i18nInstance
    .init({
      lng: 'ru',
      debug: true,
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
          url: '',
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
        watchedState.content.url = url;
        validate(url, watchedState.content.feeds)
          .then((link) => {
            watchedState.content.feeds.push(link); // 'RSS успешно загружен'
            watchedState.process.state = 'sending';
          })
          .catch((err) => {
            watchedState.process.error = err.message;
            watchedState.process.state = 'error';
          });
      });
    });
};
