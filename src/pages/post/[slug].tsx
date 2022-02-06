import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import LeavePreview from '../../components/LeavePreview';

interface Post {
  first_publication_date: string | null;
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
  preview: boolean;
}

export default function Post({ post, preview }: PostProps) {
  const router = useRouter();

  if (router.isFallback || !post) {
    return <p>Carregando...</p>;
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
      preview,
    },
  };
};
