import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import LeavePreview from '../../components/LeavePreview';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
  preview: boolean;
}

export default function Post({ post, navigation, preview }: PostProps) {
  const router = useRouter();

  if (router.isFallback || !post) {
    return <p>Carregando...</p>;
  }

  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editionDate;
  if (isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
  }

  return (
    <>
      <img
        className={styles.imgHeader}
        src={post.data.banner.url}
        alt="banner"
      />
      <div className={styles.container}>
        <div className={styles.headerPost}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoUser}>
            <section>
              <img src="./../images/calendar.svg" alt="icon calendar" />
              <p>
                {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                  locale: ptBR,
                })}
              </p>
            </section>
            <section>
              <img src="./../images/user.svg" alt="icon user" />
              <p>{post.data.author}</p>
            </section>
            <section>
              <img src="./../images/clock.svg" alt="icon clock" />
              <p>4 min</p>
            </section>
          </div>
          {isPostEdited && <span>{editionDate}</span>}
        </div>
        {post.data.content.map(conteudo => (
          <div key={conteudo.heading} className={styles.contentPost}>
            <h1>{conteudo.heading}</h1>

            {conteudo.body.map(({ text }) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        ))}
      </div>
      <section className={`${styles.navigation} ${styles.container}`}>
        {navigation?.prevPost.length > 0 && (
          <div>
            <h3>{navigation.prevPost[0].data.title}</h3>
            <Link href={`/post/${navigation.prevPost[0].uid}`}>
              <a>Post anterior</a>
            </Link>
          </div>
        )}

        {navigation?.nextPost.length > 0 && (
          <div>
            <h3>{navigation.nextPost[0].data.title}</h3>
            <Link href={`/post/${navigation.nextPost[0].uid}`}>
              <a>Próximo post</a>
            </Link>
          </div>
        )}
      </section>

      <Comments />

      {preview && <LeavePreview />}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const slugs = postsResponse.results.map(({ uid }) => ({
    params: { slug: uid },
  }));

  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );
  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const contents = response.data.content.map(item => {
    const text = item.body.map(itemText => ({
      spans: itemText.spans,
      text: itemText.text,
      type: itemText.type,
    }));
    return {
      heading: item.heading,
      body: text,
    };
  });

  const post = {
    first_publication_date:
      response.uid === 'como-utilizar-hooks'
        ? response.first_publication_date
        : new Date(2021, 2, 25).toISOString(),
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: contents,
      subtitle: response.data.subtitle,
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
  };
};
