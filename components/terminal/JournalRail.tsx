/**
 * The AltSpot Journal rail.
 *
 * Real posts from the publication's public feed. Headline, standfirst
 * and art only: the reader goes to the publication to read the piece,
 * which is the point of linking out rather than republishing.
 *
 * The empty state is the important part of this file. A feed can be
 * down, renamed, or not yet switched on, and none of that is the
 * investor's problem. It gets a quiet panel and a way through to the
 * publication, never an error.
 */
import { dateStr } from '@/lib/format';
import { JOURNAL_SITE_URL, type JournalPost } from '@/lib/terminal/journal';

import s from './Terminal.module.css';

export default function JournalRail({ posts }: { posts: JournalPost[] }) {
  if (posts.length === 0) {
    return (
      <div className={s.quiet}>
        <b>Nothing to show right now</b>
        <span>
          The Journal is published outside the portal and today it is not
          answering. Read it at the source in the meantime.
        </span>
        <a
          className={`btn btn-ghost btn-sm ${s.quietLink}`}
          href={JOURNAL_SITE_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          Open the Journal
        </a>
      </div>
    );
  }

  return (
    <div className={s.journalGrid}>
      {posts.map((post) => (
        <a
          key={post.id}
          className={s.post}
          href={post.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {post.imageUrl ? (
            // Remote editorial art from the publication CDN. Plain img
            // rather than next/image: the host is config-driven and can
            // change with a rename, which a configured loader cannot.
            // eslint-disable-next-line @next/next/no-img-element
            <img className={s.postArt} src={post.imageUrl} alt="" />
          ) : (
            <div className={s.postArtFallback}>
              <span className="brandmark">AltSpot Journal</span>
            </div>
          )}

          <div className={s.postBody}>
            <h4 className={s.postTitle}>{post.title}</h4>
            {post.excerpt && <p className={s.postExcerpt}>{post.excerpt}</p>}
            <div className={s.postFoot}>
              <span>{post.publishedAt ? dateStr(post.publishedAt) : 'AltSpot'}</span>
              <span className={s.go}>Read ↗</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
