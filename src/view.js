const renderFeeds = (state, element) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  state.content.feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;

    li.append(h3);
    li.append(p);
    ul.append(li);
  });

  element.replaceChildren(ul);
};

const renderPosts = (state, element, source) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  state.content.posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );

    const a = document.createElement('a');
    a.setAttribute('href', post.link);
    const isVisitedPost = state.uiState.visitedPostId.has(String(post.id));
    const [boldClass] = ['fw-bold', 'link-secondary'];
    const currentClass = isVisitedPost ? 'fw-normal' : boldClass;
    a.classList.add(currentClass);
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.title;

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = source('view');

    li.append(a);
    li.append(button);
    ul.append(li);
  });

  element.replaceChildren(ul);
};

const makeContainer = (title, state, elements, source) => {
  const container = {
    posts: (element) => renderPosts(state, element, source),
    feeds: (element) => renderFeeds(state, element),
  };

  elements[title].innerHTML = '';

  const div = document.createElement('div');
  div.classList.add('card', 'border-0');

  const divCardBody = document.createElement('div');
  divCardBody.classList.add('card-body');

  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = source(title);

  div.append(divCardBody);
  divCardBody.append(h2);
  elements[title].replaceChildren(div);
  container[title](div);
};

const handlerProcessState = (state, elements, source) => {
  elements.feedback.textContent = '';

  makeContainer('posts', state, elements, source);
  makeContainer('feeds', state, elements, source);

  elements.input.focus();
  elements.form.reset();
  elements.button.disabled = false;
  elements.input.disabled = false;

  elements.input.classList.remove('is-invalid');
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = source('success');
};

const handlerProcessError = (state, elements, source) => {
  elements.input.classList.add('is-invalid');
  elements.feedback.classList.add('text-danger');
  elements.button.disabled = false;
  elements.input.disabled = false;

  if (state.process.error === 'Network Error') {
    elements.feedback.textContent = source('errors.netError');
  } else {
    elements.feedback.textContent = source(`errors.${state.process.error}`);
  }
};

const handlerModal = (state, elements) => {
  const [currentPost] = state.content.posts.filter((post) => post.id === state.uiState.modalPostId);
  console.log('currentPost =', currentPost);
  elements.modal.title.textContent = currentPost.title;
  elements.modal.body.textContent = currentPost.description;
  elements.modal.buttonReadCompletely.setAttribute('href', currentPost.link);
};

export default (state, elements, source) => (path, value) => {
  switch (path) {
    case 'process.state': {
      if (value === 'filling') {
        elements.feedback.classList.add('text-danger');
        elements.feedback.classList.remove('text-success');
        elements.input.classList.remove('is-invalid');
        elements.feedback.textContent = '';
        elements.button.disabled = false;
        elements.input.disabled = false;
      }
      if (value === 'sending') {
        elements.button.disabled = true;
        elements.input.disabled = true;
      }
      if (value === 'finish') {
        handlerProcessState(state, elements, source);
      }
      if (value === 'update') {
        elements.input.focus();
        makeContainer('posts', state, elements, source);
      }
      if (value === 'error') {
        handlerProcessError(state, elements, source);
      }
      break;
    }

    case 'uiState.modalPostId': {
      handlerModal(state, elements);
      break;
    }

    default:
      break;
  }
  state.process.state = 'filling';
};
