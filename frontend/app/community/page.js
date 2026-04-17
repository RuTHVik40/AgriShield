'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, Heart, MessageCircle,
  Camera, Send, Map, Activity
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

import { communityApi } from '@/lib/apiClient';

const InfestationMap = dynamic(
  () => import('@/components/map/InfestationMap'),
  { ssr: false }
);

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('feed');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Redirect if not logged in ──
  useEffect(() => {
    if (!session) router.push('/auth/signin');
  }, [session, router]);

  // ── Fetch Feed ──
  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getFeed(1);

      const mapped = res.data.map((p) => ({
        id: p.id,
        author: p.author_name,
        location: p.location_name || 'Unknown',
        time: new Date(p.created_at).toLocaleString(),
        pest: p.pest_name || 'General',
        severity: 'low', // optional (you can enhance later)
        text: p.content,
        imageUrl: p.image_url,
        likes: p.likes_count,
      }));

      setPosts(mapped);
    } catch (err) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // ── Create Post ──
  const submitPost = async () => {
    if (!newPost.trim()) return;

    try {
      await communityApi.createPost({
        content: newPost,
      });

      setNewPost('');
      toast.success('Post created');

      fetchFeed(); // refresh
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Like Post ──
  const handleLike = async (id) => {
    try {
      const res = await communityApi.likePost(id);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, likes: res.data.likes_count }
            : p
        )
      );
    } catch (err) {
      toast.error('Like failed');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between mb-8">
          <h1 className="text-3xl text-white flex gap-2">
            <Users /> Community
          </h1>

          <div className="flex gap-2">
            <button onClick={() => setActiveTab('feed')}>Feed</button>
            <button onClick={() => setActiveTab('heatmap')}>Map</button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── FEED ── */}
          {activeTab === 'feed' ? (
            <motion.div key="feed">

              {/* Post Box */}
              <div className="glass-card p-4 mb-6">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something..."
                  className="input-field w-full"
                />

                <button onClick={submitPost} className="btn-primary mt-2">
                  <Send className="w-4 h-4" />
                  Post
                </button>
              </div>

              {/* Loading */}
              {loading && <p>Loading feed...</p>}

              {/* Posts */}
              {posts.map((post) => (
                <div key={post.id} className="glass-card p-4 mb-4">
                  <h3 className="text-white font-bold">{post.author}</h3>
                  <p className="text-sm text-gray-400">{post.location}</p>

                  <p className="mt-2">{post.text}</p>

                  <div className="flex gap-4 mt-3">
                    <button onClick={() => handleLike(post.id)}>
                      ❤️ {post.likes}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (

            /* ── MAP ── */
            <motion.div key="map" className="h-[600px]">
              <InfestationMap height="600px" />
            </motion.div>

          )}
        </AnimatePresence>
      </div>
    </div>
  );
}