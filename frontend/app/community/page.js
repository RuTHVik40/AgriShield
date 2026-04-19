'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Heart, MessageCircle, Send, ImagePlus
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { communityApi } from '@/lib/apiClient';

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newPost, setNewPost] = useState('');
  const [image, setImage] = useState(null);
  const [openComments, setOpenComments] = useState({});

  // ── Redirect ──
  useEffect(() => {
    if (!session) router.push('/auth/signin');
  }, [session]);

  // ── Fetch Feed ──
  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getFeed(1);

      setPosts(res.data);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // ── Upload Image ──
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const res = await communityApi.uploadImage(file);
    setImage(res.data.url);
    toast.success('Image uploaded');
  } catch {
    toast.error('Upload failed');
  }
};

  // ── Create Post ──
  const submitPost = async () => {
    if (!newPost.trim()) return;

    try {
      await communityApi.createPost({
        content: newPost,
        image_url: image,
      });

      setNewPost('');
      setImage(null);
      toast.success('Post created');
      fetchFeed();
    } catch {
      toast.error('Failed to post');
    }
  };

  // ── Like ──
  const handleLike = async (id) => {
    try {
      const res = await communityApi.likePost(id);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                likes_count: res.data.likes_count,
                liked_by_user: res.data.liked,
              }
            : p
        )
      );
    } catch {
      toast.error('Like failed');
    }
  };

  // ── Toggle Comments ──
  const toggleComments = (id) => {
    setOpenComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 px-4 max-w-2xl mx-auto">

        {/* HEADER */}
        <h1 className="text-3xl text-white mb-6 flex gap-2">
          <Users /> Community
        </h1>

        {/* CREATE POST */}
        <div className="glass-card p-5 mb-6 rounded-2xl space-y-3">

          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your crop issue or experience..."
            className="input-field w-full"
          />

          {/* Upload */}
          <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-300">
            <ImagePlus size={18} /> Add Image
            <input type="file" hidden onChange={handleImageUpload} />
          </label>

          {image && (
            <img src={image} className="rounded-xl h-40 object-cover" />
          )}

          <button onClick={submitPost} className="btn-primary w-full">
            <Send size={16} /> Post
          </button>
        </div>

        {/* FEED */}
        {loading && <p className="text-gray-400">Loading posts...</p>}

        {!loading && posts.length === 0 && (
          <p className="text-gray-400">No posts yet 🌱</p>
        )}

        {posts.map((post) => (
          <motion.div
            key={post.id}
            className="glass-card p-5 mb-6 rounded-2xl hover:scale-[1.01] transition"
          >
            {/* HEADER */}
            <div className="flex justify-between">
              <div>
                <h3 className="text-white font-semibold">
                  {post.author_name}
                </h3>
                <p className="text-xs text-gray-400">
                  {post.location_name || 'Unknown'}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleString()}
              </span>
            </div>

            {/* IMAGE */}
            {post.image_url && (
              <img
                src={post.image_url}
                className="mt-3 rounded-xl w-full h-64 object-cover"
              />
            )}

            {/* TEXT */}
            <p className="mt-3 text-gray-200">{post.content}</p>

            {/* ACTIONS */}
            <div className="flex gap-6 mt-4 text-sm">

              <button onClick={() => handleLike(post.id)}>
  {post.liked_by_user ? '💖' : '🤍'} {post.likes_count}
</button>

              <button onClick={() => toggleComments(post.id)}>
                💬 {post.comments_count}
              </button>

            </div>

            {/* COMMENTS */}
            {openComments[post.id] && (
              <CommentsSection postId={post.id} />
            )}
          </motion.div>
        ))}

      </div>
    </div>
  );
}

/* ───────────────── COMMENTS COMPONENT ───────────────── */

function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
  communityApi.getComments(postId)
    .then((res) => setComments(res.data))
    .catch(() => toast.error("Failed to load comments"));
}, [postId]);

  const submit = async () => {
  if (!text.trim()) return;

  try {
    await communityApi.addComment(postId, text);
    setText('');

    const res = await communityApi.getComments(postId);
    setComments(res.data);
  } catch {
    toast.error("Failed to add comment");
  }
};

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">

      {comments.map((c) => (
        <p key={c.id} className="text-sm text-gray-300">
          <b>{c.author}</b>: {c.content}
        </p>
      ))}

      <div className="flex mt-2 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field flex-1"
          placeholder="Add comment..."
        />
        <button onClick={submit}>Send</button>
      </div>

    </div>
  );
}