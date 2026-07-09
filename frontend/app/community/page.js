'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, ImagePlus, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import { communityApi } from '@/lib/apiClient';
import { useLanguage } from '@/lib/languageContext';
import { getLocale, t } from '@/lib/translations';

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { lang } = useLanguage();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [image, setImage] = useState(null);
  const [openComments, setOpenComments] = useState({});

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [router, session]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await communityApi.getFeed(1);
      setPosts(response.data);
    } catch {
      toast.error(t(lang, 'failedToLoadFeed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [lang]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const response = await communityApi.uploadImage(file);
      setImage(response.data.url);
      toast.success(t(lang, 'imageUploaded'));
    } catch {
      toast.error(t(lang, 'uploadFailed'));
    }
  };

  const submitPost = async () => {
    if (!newPost.trim()) {
      return;
    }

    try {
      await communityApi.createPost({
        content: newPost,
        image_url: image,
      });

      setNewPost('');
      setImage(null);
      toast.success(t(lang, 'postCreated'));
      fetchFeed();
    } catch {
      toast.error(t(lang, 'failedToPost'));
    }
  };

  const handleLike = async (id) => {
    try {
      const response = await communityApi.likePost(id);

      setPosts((current) =>
        current.map((post) =>
          post.id === id
            ? {
                ...post,
                likes_count: response.data.likes_count,
                liked_by_user: response.data.liked,
              }
            : post
        )
      );
    } catch {
      toast.error(t(lang, 'likeFailed'));
    }
  };

  const toggleComments = (id) => {
    setOpenComments((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 px-4 max-w-2xl mx-auto">
        <h1 className="theme-heading text-3xl mb-6 flex gap-2">
          <Users /> {t(lang, 'community')}
        </h1>

        <div className="glass-card p-5 mb-6 rounded-2xl space-y-3">
          <textarea
            value={newPost}
            onChange={(event) => setNewPost(event.target.value)}
            placeholder={t(lang, 'shareCropIssue')}
            className="input-field w-full"
          />

          <label className="theme-subtext flex items-center gap-2 text-sm cursor-pointer">
            <ImagePlus size={18} /> {t(lang, 'addImage')}
            <input type="file" hidden onChange={handleImageUpload} />
          </label>

          {image && <img src={image} alt="Uploaded" className="rounded-xl h-40 object-cover" />}

          <button onClick={submitPost} className="btn-primary w-full">
            <Send size={16} /> {t(lang, 'post')}
          </button>
        </div>

        {loading && <p className="theme-muted">{t(lang, 'loadingPosts')}</p>}

        {!loading && posts.length === 0 && (
          <p className="theme-muted">{t(lang, 'noPostsYet')}</p>
        )}

        {posts.map((post) => (
          <motion.div
            key={post.id}
            className="glass-card p-5 mb-6 rounded-2xl hover:scale-[1.01] transition"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="theme-heading font-semibold">{post.author_name}</h3>
                <p className="theme-muted text-xs">{post.location_name || t(lang, 'unknown')}</p>
              </div>
              <span className="theme-muted text-xs">
                {new Date(post.created_at).toLocaleString(getLocale(lang))}
              </span>
            </div>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                className="mt-3 rounded-xl w-full h-64 object-cover"
              />
            )}

            <p className="theme-text mt-3">{post.content}</p>

            <div className="flex gap-6 mt-4 text-sm">
              <button onClick={() => handleLike(post.id)}>
                {post.liked_by_user ? '♥' : '♡'} {post.likes_count}
              </button>

              <button onClick={() => toggleComments(post.id)}>
                {t(lang, 'comments')} {post.comments_count}
              </button>
            </div>

            {openComments[post.id] && <CommentsSection postId={post.id} />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CommentsSection({ postId }) {
  const { lang } = useLanguage();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    communityApi.getComments(postId)
      .then((response) => setComments(response.data))
      .catch(() => toast.error(t(lang, 'failedToLoadComments')));
  }, [lang, postId]);

  const submit = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      await communityApi.addComment(postId, text);
      setText('');

      const response = await communityApi.getComments(postId);
      setComments(response.data);
    } catch {
      toast.error(t(lang, 'failedToAddComment'));
    }
  };

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--surface-border)' }}>
      {comments.map((comment) => (
        <p key={comment.id} className="theme-subtext text-sm">
          <b>{comment.author}</b>: {comment.content}
        </p>
      ))}

      <div className="flex mt-2 gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="input-field flex-1"
          placeholder={t(lang, 'addComment')}
        />
        <button onClick={submit}>{t(lang, 'send')}</button>
      </div>
    </div>
  );
}
