const renderFeeds = (state, elements, source) => {
  const div = document.createElement('div');
  div.classList.add('card', 'border-0');

  const divCardBody = document.createElement('div');
  divCardBody.classList.add('card-body');
  div.append(divCardBody);

  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = source('feeds');
  divCardBody.append(h2);

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  div.append(ul);

  state.content.feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;
    li.append(h3);

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;
    li.append(p);

    ul.append(li);
  });

  elements.feeds.replaceChildren(div);
};

const renderPosts = (state, elements, source) => {
  const div = document.createElement('div');
  div.classList.add('card', 'border-0');

  const divCardBody = document.createElement('div');
  divCardBody.classList.add('card-body');
  div.append(divCardBody);

  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = source('posts');
  divCardBody.append(h2);

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  div.append(ul);

  state.content.posts.forEach((item) => {
    item.map((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      const a = document.createElement('a');
      a.setAttribute('href', post.postLink);
      a.classList.add('fw-bold');
      a.setAttribute('data-id', post.postId);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.textContent = post.postTitle;
      li.append(a);

      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.setAttribute('data-id', post.postId);
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.textContent = source('view');
      li.append(button);

      ul.append(li);
      return post;
    });
  });

  elements.posts.replaceChildren(div);
};

const handleProcessState = (state, elements, source) => {
  elements.button.disabled = false;
  elements.input.disabled = false;

  renderFeeds(state, elements, source);
  renderPosts(state, elements, source);

  elements.input.classList.remove('is-invalid');
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = source('success');
};

const handleProcessError = (state, elements, source) => {
  elements.input.classList.add('is-invalid');
  elements.feedback.classList.add('text-danger');
  // console.log('process.error =', state.process.error);

  if (state.process.error === 'Network Error') {
    elements.feedback.textContent = source('errors.netError');
  } else {
    elements.feedback.textContent = source(`errors.${state.process.error}`);
  }

  elements.button.disabled = false;
  elements.input.disabled = false;
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
        handleProcessState(state, elements, source);
      }
      if (value === 'error') {
        handleProcessError(state, elements, source);
        console.log(state.process.error);
      }
      break;
    }

    default:
      elements.feedback.textContent = source('errors.defaultError');
      break;
  }
  state.process.state = 'filling';
};
