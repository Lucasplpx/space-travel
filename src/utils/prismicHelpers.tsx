import Prismic from '@prismicio/client';
import Link from 'next/link';
import {
  apiEndpoint,
  accessToken,
  linkResolver,
  routeResolver,
} from '../prismicConfiguration';

export const customLink = (type, element, content, children, index) => (
  <Link key={index} href={linkResolver(element.data)}>
    <a>{content}</a>
  </Link>
);

export const Client = (req = null) =>
  Prismic.client(
    apiEndpoint,
    // eslint-disable-next-line no-use-before-define
    createClientOptions(req, accessToken, routeResolver)
  );

const createClientOptions = (
  req = null,
  prismicAccessToken = null,
  routes = null
) => {
  const reqOption = req ? { req } : {};
  const accessTokenOption = prismicAccessToken
    ? { accessToken: prismicAccessToken }
    : {};
  const routesOption = routes ? { routes: routeResolver.routes } : {};
  return {
    ...reqOption,
    ...accessTokenOption,
    ...routesOption,
  };
};

export default Client;
