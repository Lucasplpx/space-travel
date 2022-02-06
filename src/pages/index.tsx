import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { GetStaticProps } from 'next';

import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import LeavePreview from '../components/LeavePreview';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination: { results, next_page },
  preview,
}: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState(null);

  function handleFormatPosts(postsData: Post[]) {
    return postsData.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(
            post.uid === 'como-utilizar-hooks'
              ? post.first_publication_date
              : new Date(2021, 2, 25)
          ),
          'd MMM yyyy',
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
  }

  useEffect(() => {
    if (results.length > 0) {
      const postForma = handleFormatPosts(results);
      setPosts(postForma);
    }
    setNextPage(next_page);
  }, [next_page, results]);

  async function handleNextPage() {
    if (!nextPage) return;

    const response = await fetch(next_page).then(res => res.json());
    setNextPage(response.next_page);

    const newPosts = handleFormatPosts(response.results);

    setPosts([...posts, ...newPosts]);
  }

  return (
    <div className={styles.container}>
      {posts.map(post => (
        <div key={post.uid} className={styles.contentPost}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.infoUser}>
                <section>
                  <img src="images/calendar.svg" alt="icon calendar" />
                  <p>{post.first_publication_date}</p>
                </section>
                <section>
                  <img src="images/user.svg" alt="icon user" />
                  <p>{post.data.author}</p>
                </section>
              </div>
            </a>
          </Link>
        </div>
      ))}

      {nextPage && (
        <button
          type="button"
          onClick={handleNextPage}
          className={styles.loadPost}
        >
          Carregar mais posts
        </button>
      )}

      {preview && <LeavePreview />}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
  };
};
