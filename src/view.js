const handleProcessState = (state, elements, source) => {
  elements.input.classList.remove('is-invalid');
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = source('success');
};

const handleProcessError = (state, elements, source) => {
  elements.input.classList.add('is-invalid');
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = source(`errors.${state.process.error}`);
};

export default (state, elements, source) => (path, value) => {
  switch (path) {
    case 'process.state': {
      if (value === 'filling') {
        elements.feedback.classList.add('text-danger');
        elements.feedback.classList.remove('text-success');
        elements.input.classList.remove('is-invalid');
        elements.feedback.textContent = '';
      }
      if (value === 'sending') {
        handleProcessState(state, elements, source);
        elements.form.reset();
        elements.input.focus();
      }
      if (value === 'error') {
        handleProcessError(state, elements, source);
        state.process.state = 'filling';
      }
      break;
    }

    default:
      break;
  }
};
