import { Document } from '@prismicio/client/types/documents';

export const repoName = 'postdesafio';

export const apiEndpoint = `https://${repoName}.cdn.prismic.io/api/v2`;

export const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

export const linkResolver = (doc: Document): string => {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
};

export const routeResolver = {
  routes: [],
};
