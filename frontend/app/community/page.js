'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Heart, MessageCircle, Camera, Send, Map, Activity } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

const InfestationMap = dynamic(() => import('@/components/map/InfestationMap'), { ssr: false });

const mockPosts = [
  {
    id: 1,
    author: 'Ravi Kumar',
    avatar: 'RK',
    location: 'Karimnagar, Telangana',
    time: '12 min ago',
    pest: 'Tomato Late Blight',
    severity: 'critical',
    text: 'Found severe late blight in my 2-acre tomato field. Applying Ridomil Gold immediately. Alert to neighbors!',
    imageUrl: null,
    likes: 14,
    comments: 3,
    coords: { lat: 18.43, lng: 79.13 },
  },
  {
    id: 2,
    author: 'Priya Sharma',
    avatar: 'PS',
    location: 'Warangal, Telangana',
    time: '1 hr ago',
    pest: 'Spider Mites',
    severity: 'medium',
    text: 'Spider mite infestation starting on cotton. Neem oil spray working decently. Hot and dry weather is making it worse.',
    imageUrl: null,
    likes: 7,
    comments: 5,
    coords: { lat: 17.97, lng: 79.59 },
  },
  {
    id: 3,
    author: 'Mohammed Farukh',
    avatar: 'MF',
    location: 'Nalgonda, Telangana',
    time: '3 hrs ago',
    pest: 'Corn Common Rust',
    severity: 'high',
    text: 'Rust spreading fast after last week\'s rains. Applied Tilt (Propiconazole) — seeing improvement after 3 days.',
    imageUrl: null,
    likes: 22,
    comments: 8,
    coords: { lat: 17.06, lng: 79.27 },
  },
];

const severityConfig = {
  critical: { label: 'Critical',  color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/30' },
  high:     { label: 'High Risk', color: 'text-accent-400', bg: 'bg-amber-900/30',  border: 'border-amber-700/30' },
  medium:   { label: 'Moderate',  color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/30' },
  low:      { label: 'Low Risk',  color: 'text-primary-400',bg: 'bg-primary-900/30',border: 'border-primary-700/30' },
};

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter(); 
  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  const [activeTab, setActiveTab] = useState('feed');  // feed | heatmap
  const [newPost, setNewPost] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [posts, setPosts] = useState(mockPosts);

  const handleLike = (id) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submitPost = () => {
    if (!newPost.trim()) return;
    const post = {
      id: Date.now(),
      author: session?.user?.name || 'Anonymous Farmer',
      avatar: (session?.user?.name?.[0] || 'A').toUpperCase(),
      location: 'Your Location',
      time: 'just now',
      pest: 'General Observation',
      severity: 'low',
      text: newPost,
      imageUrl: null,
      likes: 0,
      comments: 0,
      coords: { lat: 17.385, lng: 78.48 },
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-800 text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-primary-400" />
              Farmer Community
            </h1>
            <p className="text-primary-500 mt-1">Real-time pest intelligence from your region</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 p-1 rounded-xl bg-dark-950/60 border border-primary-900/40">
            {[
              { id: 'feed',    label: 'Community Feed', icon: Activity },
              { id: 'heatmap', label: 'Heatmap',        icon: Map },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all
                           ${activeTab === tab.id 
                             ? 'bg-primary-700 text-white shadow-glow-green' 
                             : 'text-primary-500 hover:text-primary-300'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'feed' ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* Feed */}
              <div className="lg:col-span-2 space-y-4">
                {/* Post composer */}
                {session && (
                  <div className="glass-card p-5">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center 
                                      flex-shrink-0 text-white text-sm font-700">
                        {session.user?.name?.[0]?.toUpperCase() || 'F'}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newPost}
                          onChange={e => setNewPost(e.target.value)}
                          placeholder="Share a pest sighting or observation..."
                          rows={3}
                          className="input-field resize-none"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex gap-2">
                            <button className="text-primary-600 hover:text-primary-400 transition-colors p-2">
                              <Camera className="w-4 h-4" />
                            </button>
                            <button className="text-primary-600 hover:text-primary-400 transition-colors p-2">
                              <MapPin className="w-4 h-4" />
                            </button>
                          </div>
                          <button onClick={submitPost} className="btn-primary py-2 px-5 text-sm">
                            <Send className="w-4 h-4" />
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts */}
                {posts.map((post, i) => {
                  const sc = severityConfig[post.severity] || severityConfig.low;
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`glass-card p-5 border ${sc.border}`}
                    >
                      {/* Post header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center
                                        text-primary-300 font-700 flex-shrink-0">
                          {post.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-700 text-white text-sm">{post.author}</span>
                            <span className={`badge text-xs ${sc.bg} ${sc.color} border ${sc.border}`}>
                              {post.pest}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-primary-600">
                            <MapPin className="w-3 h-3" />
                            {post.location}
                            <span>·</span>
                            {post.time}
                          </div>
                        </div>
                      </div>

                      <p className="text-primary-200 text-sm leading-relaxed mb-4">{post.text}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-primary-900/40">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 text-sm transition-colors
                                     ${likedPosts.has(post.id) ? 'text-red-400' : 'text-primary-600 hover:text-primary-400'}`}
                        >
                          <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-400">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <h3 className="font-display font-700 text-white mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-400" />
                    Active Threats Nearby
                  </h3>
                  <div className="space-y-3">
                    {[
                      { pest: 'Late Blight', count: 4, trend: 'rising', color: 'text-red-400' },
                      { pest: 'Spider Mites', count: 2, trend: 'stable', color: 'text-accent-400' },
                      { pest: 'Corn Rust', count: 1, trend: 'falling', color: 'text-primary-400' },
                    ].map(t => (
                      <div key={t.pest} className="flex items-center justify-between py-2 border-b border-primary-900/30 last:border-0">
                        <span className="text-primary-300 text-sm">{t.pest}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm font-600 ${t.color}`}>{t.count} reports</span>
                          <span className="text-xs text-primary-600">
                            {t.trend === 'rising' ? '↑' : t.trend === 'falling' ? '↓' : '→'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini map */}
                <div className="glass-card overflow-hidden" style={{ height: '220px' }}>
                  <InfestationMap center={[17.385, 78.4867]} zoom={8} height="220px" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card overflow-hidden"
              style={{ height: '600px' }}
            >
              <div className="p-4 border-b border-primary-800/30 flex items-center gap-3">
                <Map className="w-5 h-5 text-primary-400" />
                <span className="font-display font-700 text-white">Infestation Heatmap — Telangana Region</span>
                <div className="ml-auto flex items-center gap-2 text-xs text-primary-500">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                  Live data
                </div>
              </div>
              <InfestationMap center={[17.385, 78.4867]} zoom={8} height="555px" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
