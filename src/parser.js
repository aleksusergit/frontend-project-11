export default (content) => {
  const newParser = new DOMParser();
  const parsered = newParser.parseFromString(content, 'application/xml');

  const error = parsered.querySelector('parsererror');
  if (error) {
    throw new Error('parserError');
  }

  const channel = parsered.querySelector('channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const feeds = { title, description };

  const items = channel.querySelectorAll('item');
  const posts = Array.from(items).map((post) => {
    const postTitle = post.querySelector('title').textContent;
    const postDescription = post.querySelector('description').textContent;
    const postLink = post.querySelector('link').textContent;
    return { postTitle, postDescription, postLink };
  });

  return { feeds, posts };
};
