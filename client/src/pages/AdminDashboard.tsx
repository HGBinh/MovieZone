import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, FiMessageSquare, FiUsers, FiFilm, 
  FiExternalLink, FiTrash2, FiCheck, FiX, 
  FiTrendingUp, FiArrowUpRight, FiSearch, FiPlus, FiImage, FiLink,
  FiHeart, FiCornerDownRight, FiEdit2, FiSave, FiUpload, FiAlertCircle,
  FiSlash, FiUserCheck, FiArrowRight, FiActivity, FiSend, FiChevronLeft, FiSettings, FiLogOut
} from 'react-icons/fi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import supportService from '../services/supportService';

const isDefaultGroup = (target: any) => target === 'group';
const isCustomGroup = (target: any) => Boolean(target?.isChatGroup);
const isPrivateChat = (target: any) => target && !isDefaultGroup(target) && !isCustomGroup(target);

const toCustomGroup = (group: any) => ({ ...group, isChatGroup: true });

const sortSupportConversations = (list: any[]) =>
  [...list].sort((a: any, b: any) => {
    const aU = a.unreadCount > 0 ? 1 : 0;
    const bU = b.unreadCount > 0 ? 1 : 0;
    if (bU !== aU) return bU - aU;
    return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
  });

const compareUnreadThenRecent = (unreadA: number, unreadB: number, timeA: string | Date, timeB: string | Date) => {
  const aU = unreadA > 0 ? 1 : 0;
  const bU = unreadB > 0 ? 1 : 0;
  if (bU !== aU) return bU - aU;
  return new Date(timeB || 0).getTime() - new Date(timeA || 0).getTime();
};

const getChatParams = (target: any) => {
  if (isDefaultGroup(target)) return { receiverId: 'group' };
  if (isCustomGroup(target)) return { groupId: target._id };
  return { receiverId: target._id };
};

const UnreadBadge = ({ count, active = false, className = '' }: { count: number, active?: boolean, className?: string }) => {
  if (!count || count <= 0) return null;
  const label = count > 99 ? '99+' : count;
  return (
    <span
      className={`min-w-[1.25rem] h-5 px-1.5 text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shrink-0 ${
        active ? 'bg-white text-primary' : 'bg-red-500 text-white'
      } ${className}`}
    >
      {label}
    </span>
  );
};

const AdminDashboard = () => {
  const { user, theme, lang, t } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [stats, setStats] = useState<any>({ 
    users: 0, 
    comments: 0, 
    movies: 0, 
    activeUsers: 0,
    latestUsers: [],
    healthChart: [],
    movieStorage: [],
    latestComments: []
  });
  const [requests, setRequests] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [editingAdminMsg, setEditingAdminMsg] = useState<any>(null);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<any>('group');

  // Support Chat State
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [selectedSupportUser, setSelectedSupportUser] = useState<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportReply, setSupportReply] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [editingSupportMsg, setEditingSupportMsg] = useState<any>(null);

  // Mobile chat panel (Zalo-style: list OR chat view)
  const [showMobileAdminChat, setShowMobileAdminChat] = useState(false);
  const [showMobileSupportChat, setShowMobileSupportChat] = useState(false);

  // Custom chat groups
  const [chatGroups, setChatGroups] = useState<any[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<any[]>([]);
  const [manageGroupMembers, setManageGroupMembers] = useState<any[]>([]);
  const [manageGroupCoAdmins, setManageGroupCoAdmins] = useState<any[]>([]);
  const [adminChatSearch, setAdminChatSearch] = useState('');
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [manageMemberSearch, setManageMemberSearch] = useState('');
  const [chatUnread, setChatUnread] = useState<any>({ threads: [], unreadThreads: 0, totalUnreadMessages: 0 });

  // Quick View State
  const [activeQuickView, setActiveQuickView] = useState<any>(null);

  // Edit states
  const [editingComment, setEditingComment] = useState<any>(null);
  const [uploading, setUploading] = useState<any>({ movie: false, banner: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [commentFilter, setCommentFilter] = useState('all'); 
  const [commentSort, setCommentSort] = useState('newest'); 
  
  const [isEditingContent, setIsEditingContent] = useState<any>(null);

  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    posterPath: '',
    trailerUrl: '',
    runtime: '',
    country: '',
    genres: '',
    releaseDate: ''
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image: '',
    movie: '',
    link: '' 
  });

  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    try {
      const [statsData, reqData, commData, movieData, bannerData, adminListData] = await Promise.all([
        adminService.getStats(user.token),
        adminService.getRequests(user.token),
        adminService.getComments(user.token),
        adminService.getMovies(user.token),
        adminService.getBanners(user.token),
        adminService.getAdmins(user.token)
      ]);
      setStats(statsData);
      setRequests(reqData);
      setComments(commData);
      setMovies(movieData);
      setBanners(bannerData);
      setAdminList(adminListData);
    } catch (error) {
      toast.error(t('error_update'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshInbox = useCallback(async () => {
    if (!user?.token) return;
    try {
      const [unreadData, convData] = await Promise.all([
        adminService.getChatUnread(user.token),
        supportService.getAdminConversations(user.token)
      ]);
      setChatUnread(unreadData);
      setSupportConversations(sortSupportConversations(convData));
    } catch (error) {
      console.error('Error refreshing inbox:', error);
    }
  }, [user]);

  const getAdminThreadMeta = useCallback((type: any, id: any) => {
    return chatUnread.threads?.find(
      (th: any) => th.type === type && String(th.id) === String(id)
    );
  }, [chatUnread.threads]);

  const getAdminThreadUnread = useCallback((type: any, id: any) => {
    return getAdminThreadMeta(type, id)?.unreadCount || 0;
  }, [getAdminThreadMeta]);

  useEffect(() => {
    if (!user?.token) return;
    refreshInbox();
    const interval = setInterval(refreshInbox, 20000);
    return () => clearInterval(interval);
  }, [user?.token, refreshInbox]);

  useEffect(() => {
    setShowMobileAdminChat(false);
    setShowMobileSupportChat(false);
  }, [activeTab]);

  const fetchChatMessages = useCallback(async () => {
    if (!user?.token) return;
    try {
      setChatLoading(true);
      const data = await adminService.getMessages(user.token, getChatParams(selectedReceiver));
      setChatMessages(data);
      refreshInbox();
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setChatLoading(false);
    }
  }, [selectedReceiver, user, refreshInbox]);

  const fetchChatGroups = useCallback(async () => {
    if (!user?.token) return;
    try {
      const data = await adminService.getChatGroups(user.token);
      setChatGroups(data.map(toCustomGroup));
    } catch (error) {
      console.error('Error fetching chat groups:', error);
    }
  }, [user]);

  const fetchSupportMessages = useCallback(async (userId: string) => {
    if (!user?.token) return;
    try {
      setSupportLoading(true);
      const data = await supportService.getAdminUserMessages(user.token, userId);
      setSupportMessages(data);
      refreshInbox();
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setSupportLoading(false);
    }
  }, [user, refreshInbox]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatMessages();
      fetchChatGroups();
    }
    if (activeTab === 'support') {
      refreshInbox();
    }
  }, [selectedReceiver, activeTab, fetchChatMessages, fetchChatGroups, refreshInbox]);

  useEffect(() => {
    if (activeTab === 'support' && selectedSupportUser) {
      fetchSupportMessages(selectedSupportUser._id);
      const interval = setInterval(() => fetchSupportMessages(selectedSupportUser._id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedSupportUser, fetchSupportMessages]);

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReply.trim() || !selectedSupportUser || !user?.token) return;

    try {
      const data = await supportService.adminReplyMessage(user.token, selectedSupportUser._id, supportReply);
      setSupportMessages(prev => [...prev, data]);
      setSupportReply('');
      refreshInbox();
    } catch (error) {
      toast.error(t('send_failed'));
    }
  };

  const handleSupportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendSupportReply(e);
    }
  };

  const handleUpdateSupportMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupportMsg?.content.trim() || !user) return;

    try {
      const data = await supportService.updateMessage(user.token, editingSupportMsg.id, editingSupportMsg.content);
      setSupportMessages(supportMessages.map(m => m._id === editingSupportMsg.id ? data : m));
      setEditingSupportMsg(null);
      toast.success(t('msg_updated'));
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleDeleteSupportMsg = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_msg')) || !user?.token) return;
    try {
      await supportService.deleteMessage(user.token, id);
      setSupportMessages(supportMessages.filter(m => m._id !== id));
      toast.success(t('msg_withdrawn'));
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.token) return;

    try {
      const payload = {
        content: newMessage,
        ...getChatParams(selectedReceiver)
      };
      const data = await adminService.sendMessage(user.token, payload);
      setChatMessages(prev => [...prev, data]);
      setNewMessage('');
      refreshInbox();
    } catch (error: any) {
      console.error('Chat error:', error.response?.data || error.message);
      toast.error(t('error_update'));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !user?.token) {
      toast.warning(t('group_name_required'));
      return;
    }

    try {
      const data = await adminService.createChatGroup(user.token, {
        name: newGroupName.trim(),
        memberIds: newGroupMembers.map((id) => id?.toString()).filter(Boolean)
      });
      const group = toCustomGroup(data);
      setChatGroups(prev => [group, ...prev]);
      setSelectedReceiver(group);
      setShowMobileAdminChat(true);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupMembers([]);
      setGroupMemberSearch('');
      toast.success(t('group_created'));
    } catch (error: any) {
      console.error('Create group error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || t('group_create_failed'));
    }
  };

  const handleUpdateGroupMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomGroup(selectedReceiver) || !user?.token) return;

    try {
      const data = await adminService.updateChatGroup(user.token, selectedReceiver._id, {
        memberIds: manageGroupMembers.map((id) => id?.toString()).filter(Boolean),
        coAdminIds: manageGroupCoAdmins.map((id) => id?.toString()).filter(Boolean)
      });
      const updated = toCustomGroup(data);
      setChatGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
      setSelectedReceiver(updated);
      setShowManageGroup(false);
      toast.success(t('group_updated'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error_update'));
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCustomGroup(selectedReceiver) || !user?.token) return;
    if (!window.confirm(t('confirm_delete_group'))) return;

    try {
      await adminService.deleteChatGroup(user.token, selectedReceiver._id);
      setChatGroups(prev => prev.filter(g => g._id !== selectedReceiver._id));
      setSelectedReceiver('group');
      setShowManageGroup(false);
      setShowMobileAdminChat(false);
      toast.success(t('group_deleted'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('delete_error'));
    }
  };

  const handleLeaveGroup = async (group: { _id: string }, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!window.confirm(t('confirm_leave_group')) || !user?.token) return;

    try {
      const data = await adminService.leaveChatGroup(user.token, group._id);
      setChatGroups((prev) => prev.filter((g) => g._id !== group._id));
      if (isCustomGroup(selectedReceiver) && selectedReceiver._id === group._id) {
        setSelectedReceiver('group');
        setShowMobileAdminChat(false);
        setShowManageGroup(false);
      }
      toast.success(t('left_group'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('leave_group_failed'));
    }
  };

  const toggleMemberSelection = (adminId: any, list: any[], setter: (newList: any[]) => void) => {
    const id = adminId?.toString();
    if (!id) return;
    const exists = list.some((item) => item?.toString() === id);
    setter(exists ? list.filter((item) => item?.toString() !== id) : [...list, adminId]);
  };

  const isMemberSelected = (adminId: any, list: any[]) =>
    list.some((item) => item?.toString() === adminId?.toString());

  const filterUsersBySearch = (users: any[], query: string, excludeUserId?: string | number) => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const uid = u._id?.toString();
      const excl = excludeUserId?.toString();
      if (excl && uid === excl) return false;
      if (!q) return true;
      return (
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  };

  const filteredAdminsForChat = useMemo(
    () => filterUsersBySearch(adminList, adminChatSearch, user?._id || user?.id),
    [adminList, adminChatSearch, user]
  );

  const filteredSupportConversations = useMemo(() => {
    const q = supportSearchQuery.trim().toLowerCase();
    const base = q
      ? supportConversations.filter(
          (conv) =>
            conv.user?.username?.toLowerCase().includes(q) ||
            conv.user?.email?.toLowerCase().includes(q) ||
            conv.lastMessage?.toLowerCase().includes(q)
        )
      : supportConversations;
    return sortSupportConversations(base);
  }, [supportConversations, supportSearchQuery]);

  const sortedAdminsForChat = useMemo(() => {
    return [...filteredAdminsForChat].sort((a, b) => {
      const ta = getAdminThreadMeta('private', a._id);
      const tb = getAdminThreadMeta('private', b._id);
      return compareUnreadThenRecent(
        ta?.unreadCount || 0,
        tb?.unreadCount || 0,
        ta?.lastMessageAt,
        tb?.lastMessageAt
      );
    });
  }, [filteredAdminsForChat, getAdminThreadMeta]);

  const sortedChatGroups = useMemo(() => {
    return [...chatGroups].sort((a, b) => {
      const ta = getAdminThreadMeta('group', a._id);
      const tb = getAdminThreadMeta('group', b._id);
      return compareUnreadThenRecent(
        ta?.unreadCount || 0,
        tb?.unreadCount || 0,
        ta?.lastMessageAt,
        tb?.lastMessageAt
      );
    });
  }, [chatGroups, getAdminThreadMeta]);

  const filteredAdminsForNewGroup = useMemo(
    () => filterUsersBySearch(adminList, groupMemberSearch, user?._id || user?.id),
    [adminList, groupMemberSearch, user]
  );

  const filteredAdminsForManage = useMemo(
    () => filterUsersBySearch(adminList, manageMemberSearch, user?._id || user?.id),
    [adminList, manageMemberSearch, user]
  );

  const getChatTitle = () => {
    if (isDefaultGroup(selectedReceiver)) return t('admin_chat_room');
    if (isCustomGroup(selectedReceiver)) return selectedReceiver.name;
    return `${t('chat_with')} ${selectedReceiver.username}`;
  };

  const getChatSubtitle = () => {
    if (isDefaultGroup(selectedReceiver)) return t('admin_chat_desc');
    if (isCustomGroup(selectedReceiver)) {
      return t('members_count', { count: selectedReceiver.members?.length || 0 });
    }
    return t('private_chat_desc');
  };

  const getChatPlaceholder = () => {
    if (isDefaultGroup(selectedReceiver)) return t('chat_placeholder_group');
    if (isCustomGroup(selectedReceiver)) return t('chat_placeholder_custom_group', { name: selectedReceiver.name });
    return t('chat_placeholder_private', { name: selectedReceiver.username });
  };

  const handleDeleteAdminMsg = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_comment')) || !user?.token) return;
    try {
      await adminService.deleteMessage(user.token, id);
      setChatMessages(chatMessages.filter(m => m._id !== id));
      toast.success(t('comment_withdrawn'));
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleUpdateAdminMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminMsg.content.trim() || !user?.token) return;
    try {
      const data = await adminService.editMessage(user.token, editingAdminMsg.id, editingAdminMsg.content);
      setChatMessages(chatMessages.map(m => m._id === editingAdminMsg.id ? data : m));
      setEditingAdminMsg(null);
      toast.success(t('updated_success'));
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleToggleBan = async (userId: string) => {
    try {
      const data = await adminService.toggleBan(user?.token || '', userId);
      toast.success(data.isBanned ? t('user_banned') : t('user_unbanned'));
      fetchData(); // Refresh stats/latest users
    } catch (error) {
      toast.error((error as any).response?.data?.message || t('error_update'));
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(user?.token || '', userId, newRole);
      toast.success(t('role_updated'));
      fetchData();
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type === 'movie' ? 'movie' : 'banner', file);

    setUploading({ ...uploading, [type]: true });
    try {
      const data = await adminService.uploadFile(user?.token || '', type, formData);
      
      if (type === 'movie') {
        setMovieForm({ ...movieForm, posterPath: data.url || '' });
      } else {
        setBannerForm({ ...bannerForm, image: data.url || '' });
      }
      toast.success(t('upload_file_success'));
    } catch (error) {
      toast.error(t('upload_file_error'));
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const handleEditComment = async () => {
    try {
      let data;
      if (editingComment.isReply) {
        data = await adminService.updateReply(user?.token || '', editingComment.parentId, editingComment.id, editingComment.content);
      } else {
        data = await adminService.updateComment(user?.token || '', editingComment.id, { content: editingComment.content });
      }
      
      setComments(comments.map(c => {
        if (!editingComment.isReply && c._id === editingComment.id) {
          return { ...c, content: editingComment.content };
        }
        if (editingComment.isReply && c._id === editingComment.parentId) {
          return {
            ...c,
            replies: c.replies.map((r: any) => r._id === editingComment.id ? { ...r, content: editingComment.content } : r)
          };
        }
        return c;
      }));
      
      setEditingComment(null);
      toast.success(t('updated_success'));
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm(t('confirm_delete_reply'))) return;
    try {
      await adminService.deleteReply(user?.token || '', commentId, replyId);
      setComments(comments.map(c => {
        if (c._id === commentId) {
          return { ...c, replies: c.replies.filter((r: any) => r._id !== replyId) };
        }
        return c;
      }));
      toast.success(t('reply_deleted'));
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const genresArray = movieForm.genres ? (Array.isArray(movieForm.genres) ? movieForm.genres : movieForm.genres.split(',').map(g => g.trim())) : [];
      
      const movieData: any = { ...movieForm, genres: genresArray };
      Object.keys(movieData).forEach(key => {
        if (movieData[key as keyof typeof movieData] === '') delete (movieData as any)[key];
      });

      if (isEditingContent?.type === 'movie') {
        const data = await adminService.updateMovie(user?.token || '', isEditingContent.data._id, movieData);
        setMovies(movies.map(m => m._id === isEditingContent.data._id ? data : m));
        setIsEditingContent(null);
        toast.success(t('updated_success'));
      } else {
        const data = await adminService.addMovie(user?.token || '', movieData);
        setMovies([data, ...movies]);
        toast.success(t('success_update'));
      }
      setMovieForm({ title: '', description: '', posterPath: '', trailerUrl: '', runtime: '', country: '', genres: '', releaseDate: '' });
      fetchData(); // Refresh stats
    } catch (error) {
      toast.error((error as any).response?.data?.message || t('error_update'));
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bannerData: any = { ...bannerForm };
      // Gửi null để xóa liên kết phim/link cũ trong DB (chỉ xóa field thì MongoDB không gỡ được)
      bannerData.movie = bannerData.movie || null;
      bannerData.link = bannerData.link?.trim() || null;
      if (!bannerData.description?.trim()) bannerData.description = '';

      if (isEditingContent?.type === 'banner') {
        const data = await adminService.updateBanner(user?.token || '', isEditingContent.data._id, bannerData);
        setBanners(banners.map(b => b._id === isEditingContent.data._id ? data : b));
        setIsEditingContent(null);
        toast.success(t('updated_success'));
      } else {
        const data = await adminService.addBanner(user?.token || '', bannerData);
        setBanners([data, ...banners]);
        toast.success(t('success_update'));
      }
      setBannerForm({ title: '', description: '', image: '', movie: '', link: '' });
    } catch (error) {
      toast.error((error as any).response?.data?.message || t('error_update'));
    }
  };

  const handleEditMovieClick = useCallback((movie: any) => {
    setIsEditingContent({ type: 'movie', data: movie });
    setMovieForm({
      title: movie.title || '',
      description: movie.description || '',
      posterPath: movie.posterPath || '',
      trailerUrl: movie.trailerUrl || '',
      runtime: movie.runtime || '',
      country: movie.country || '',
      genres: movie.genres ? movie.genres.join(', ') : '',
      releaseDate: movie.releaseDate || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEditBannerClick = useCallback((banner: any) => {
    setIsEditingContent({ type: 'banner', data: banner });
    setBannerForm({
      title: banner.title || '',
      description: banner.description || '',
      image: banner.image || '',
      movie: banner.movie?._id || banner.movie || '',
      link: banner.link || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteMovie = async (id: string) => {
    if (!window.confirm(t('confirm_delete_history'))) return;
    try {
      await adminService.deleteMovie(user?.token || '', id);
      setMovies(movies.filter(m => m._id !== id));
      toast.success(t('history_deleted'));
      fetchData();
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm(t('confirm_delete_history'))) return;
    try {
      await adminService.deleteBanner(user?.token || '', id);
      setBanners(banners.filter(b => b._id !== id));
      toast.success(t('history_deleted'));
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const handleApprove = async (userId: string, status: string) => {
    try {
      await adminService.approveRequest(user?.token || '', userId, status);
      setRequests(requests.filter(r => r._id !== userId));
      toast.success(status === 'approved' ? t('approved') : t('rejected'));
      fetchData();
    } catch (error) {
      toast.error(t('error_update'));
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_comment'))) return;
    try {
      await adminService.deleteComment(user?.token || '', id);
      setComments(comments.filter(c => c._id !== id));
      toast.success(t('comment_withdrawn'));
      fetchData();
    } catch (error) {
      toast.error(t('delete_error'));
    }
  };

  const filteredComments = useMemo(() => {
    return comments
      .filter(c => {
        if (!c) return false;
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
          c.user?.username?.toLowerCase().includes(search) ||
          c.user?.email?.toLowerCase().includes(search) ||
          c.movieTitle?.toLowerCase().includes(search) ||
          c.movieId?.toString().includes(search) ||
          c.content?.toLowerCase().includes(search)
        );
        const matchesFilter = commentFilter === 'all' || (commentFilter === 'reported' && (c.reportsCount || 0) > 0);
        return matchesSearch && matchesFilter;
      })
      .sort((a: any, b: any) => {
        if (commentSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (commentSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (commentSort === 'most_reported') return (b.reportsCount || 0) - (a.reportsCount || 0);
        return 0;
      });
  }, [comments, searchTerm, commentFilter, commentSort]);

  const supportUnreadThreads = useMemo(
    () => supportConversations.filter((c) => c.unreadCount > 0).length,
    [supportConversations]
  );

  const tabs = useMemo(() => [
    { id: 'requests', label: t('requests'), icon: FiShield },
    { id: 'comments', label: t('stats_comm'), icon: FiMessageSquare },
    { id: 'movies', label: t('manage_movies'), icon: FiFilm },
    { id: 'chat', label: t('admin_chat'), icon: FiActivity, badge: chatUnread.unreadThreads || 0 },
    { id: 'support', label: t('support_user'), icon: FiMessageSquare, badge: supportUnreadThreads }
  ], [t, chatUnread.unreadThreads, supportUnreadThreads]);

  const statItems = useMemo(() => [
    { id: 'users', label: t('total_users'), value: stats.users, icon: FiUsers, color: 'text-blue-500' },
    { id: 'active', label: t('active_7d'), value: stats.activeUsers, icon: FiTrendingUp, color: 'text-green-500' },
    { id: 'comments', label: t('stats_comm'), value: stats.comments, icon: FiMessageSquare, color: 'text-primary' },
    { id: 'movies', label: t('total_movies'), value: stats.movies, icon: FiFilm, color: 'text-yellow-500' }
  ], [t, stats]);

  // Helper to translate weekday names from backend
  const formatChartData = useMemo(() => {
    return stats.healthChart?.map((item: any) => {
      let translatedName = item.name;
      const name = item.name.toLowerCase();
      if (name.includes('thứ 2') || name.includes('t2') || name.includes('mon')) translatedName = t('mon');
      else if (name.includes('thứ 3') || name.includes('t3') || name.includes('tue')) translatedName = t('tue');
      else if (name.includes('thứ 4') || name.includes('t4') || name.includes('wed')) translatedName = t('wed');
      else if (name.includes('thứ 5') || name.includes('t5') || name.includes('thu')) translatedName = t('thu');
      else if (name.includes('thứ 6') || name.includes('t6') || name.includes('fri')) translatedName = t('fri');
      else if (name.includes('thứ 7') || name.includes('t7') || name.includes('sat')) translatedName = t('sat');
      else if (name.includes('chủ nhật') || name.includes('cn') || name.includes('sun')) translatedName = t('sun');
      
      return { ...item, name: translatedName };
    });
  }, [stats.healthChart, t]);

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center space-y-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-primary font-bold animate-pulse tracking-widest uppercase text-xs">{t('loading')}</p>
    </div>
  );

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-dark'} pt-10 pb-20`}>
      <div className="container mx-auto px-4 md:px-10 max-w-full overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase mb-2">
              Admin<span className="text-primary">Zone</span>
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              {t('admin_system')}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveQuickView(item.id)}
              className={`p-8 rounded-[2rem] border text-left transition-all relative group overflow-hidden ${
                theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/[0.08]' : 'bg-white border-gray-100 shadow-xl hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <FiArrowUpRight className="text-neutral-500 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
              <h4 className="text-3xl font-black tracking-tighter mb-1 relative z-10">{item.value}</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 relative z-10">{item.label}</p>
              
              {/* Background Glow */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${
                item.id === 'users' ? 'bg-blue-500' : 
                item.id === 'active' ? 'bg-green-500' : 
                item.id === 'comments' ? 'bg-primary' : 'bg-yellow-500'
              }`} />
            </motion.button>
          ))}
        </div>

        {/* Quick View Modals/Drawers */}
        <AnimatePresence>
          {activeQuickView && (
            <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-10 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveQuickView(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              
              {activeQuickView === 'users' && (
                <motion.div 
                  layoutId="users"
                  className={`w-full max-w-2xl rounded-t-[2rem] sm:rounded-[2.5rem] border overflow-hidden relative z-10 flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-x-hidden ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-5 sm:p-8 border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-black uppercase tracking-tighter truncate">{t('quick_user_manage')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('ten_latest_members')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"><FiX size={20} /></button>
                  </div>
                  <div className="overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2 flex-1 min-h-0">
                    {stats.latestUsers?.map((u: any) => (
                      <div key={u._id} className={`p-3 sm:p-4 rounded-2xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between group min-w-0 ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar src={u.avatar} size={40} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-black text-sm truncate max-w-[140px] sm:max-w-none">{u.username}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${
                                u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'
                              }`}>{u.role === 'admin' ? t('admin_role') : t('user_role')}</span>
                              {u.isBanned && <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded font-black uppercase shrink-0">{t('banned_status')}</span>}
                            </div>
                            <p className="text-[10px] text-neutral-500 font-bold truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleToggleBan(u._id)}
                            className={`p-2.5 rounded-xl transition-all no-min-h ${
                              u.isBanned ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                            title={u.isBanned ? t('unban') : t('ban')}
                          >
                            {u.isBanned ? <FiUserCheck size={14} /> : <FiSlash size={14} />}
                          </button>
                          <select 
                            value={u.role}
                            onChange={(e) => handleChangeRole(u._id, e.target.value)}
                            className={`text-[10px] font-black uppercase p-2 rounded-xl outline-none cursor-pointer transition-all max-w-[8.5rem] sm:max-w-none ${
                              theme === 'dark' 
                                ? 'bg-neutral-800 border-white/10 text-white hover:bg-neutral-700' 
                                : 'bg-gray-100 border-gray-200 text-dark hover:bg-gray-200'
                            }`}
                          >
                            <option value="user" className={theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}>{t('user_role')}</option>
                            <option value="admin" className={theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}>{t('admin_role')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 sm:p-6 bg-primary/5 text-center shrink-0">
                    <button onClick={() => { setActiveQuickView(null); setActiveTab('requests'); }} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">{t('pending_requests')}</button>
                  </div>
                </motion.div>
              )}

              {activeQuickView === 'active' && (
                <motion.div 
                  layoutId="active"
                  className={`w-full max-w-4xl rounded-[2.5rem] border overflow-hidden relative z-10 flex flex-col ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter flex items-center">
                        <FiActivity className="mr-3 text-green-500" /> {t('website_health')}
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('traffic_7d')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="p-8 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formatChartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#333' : '#eee'} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#ef4444" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorUsers)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-8 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase text-neutral-500 mb-1">{t('peak_day')}</p>
                      <p className="text-lg font-black text-primary">{t('sat')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase text-neutral-500 mb-1">{t('avg_active')}</p>
                      <p className="text-lg font-black text-green-500">{(stats.activeUsers / 7).toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase text-neutral-500 mb-1">{t('growth')}</p>
                      <p className="text-lg font-black text-blue-500">+12%</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeQuickView === 'comments' && (
                <motion.div 
                  initial={{ x: 500 }}
                  animate={{ x: 0 }}
                  exit={{ x: 500 }}
                  className={`fixed top-0 right-0 h-full w-full max-w-md border-l z-20 flex flex-col ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{t('moderation_room')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('recent_comments')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {stats.latestComments?.map((c: any) => (
                      <div key={c._id} className={`p-6 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar src={c.user?.avatar} size={32} />
                            <span className="font-black text-xs">{c.user?.username}</span>
                          </div>
                          <span className="text-[8px] text-neutral-500 font-bold uppercase">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-neutral-400 italic leading-relaxed">"{c.content}"</p>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => { handleDeleteComment(c._id); fetchData(); }}
                            className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                          >{t('cleanup')}</button>
                          <button 
                            onClick={() => { setActiveQuickView(null); setActiveTab('comments'); }}
                            className="flex-1 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all"
                          >{t('view_details')}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeQuickView === 'movies' && (
                <motion.div 
                  layoutId="movies"
                  className={`w-full max-w-2xl rounded-[2.5rem] border overflow-hidden relative z-10 flex flex-col ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{t('quick_movie_store')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('genre_distribution')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-4">
                    {stats.movieStorage?.map((item: any, i: any) => (
                      <div 
                        key={i} 
                        className={`p-5 rounded-2xl flex items-center justify-between border ${
                          item.count === 0 
                            ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                            : theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest">{item.genre}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black tracking-tighter">{item.count}</span>
                          {item.count === 0 && <span className="text-[8px] font-black uppercase">{t('need_more')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-8 border-t border-white/5">
                    <button 
                      onClick={() => { setActiveQuickView(null); setActiveTab('movies'); }}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-primary/30"
                    >
                      <FiPlus size={18} />
                      <span>{t('add_movie_now')}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
         
          <div className="lg:col-span-3 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-5 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                    : theme === 'dark' ? 'bg-white/5 text-neutral-500 hover:bg-white/10' : 'bg-white text-neutral-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} className="shrink-0" />
                <span className="flex-1 text-left truncate">{tab.label}</span>
                <UnreadBadge count={tab.badge} active={activeTab === tab.id} />
              </button>
            ))}
          </div>

          {}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <h3 className="font-black uppercase tracking-widest text-sm">
                      {t('pending_requests')}
                    </h3>
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black">{requests.length}</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                          <th className="p-8">{t('username')}</th>
                          <th className="p-8">{t('email')}</th>
                          <th className="p-8 text-right">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.length === 0 ? (
                          <tr><td colSpan={3} className="p-20 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">{t('no_results')}</td></tr>
                        ) : requests.map(req => (
                          <tr key={req._id} className={`border-b transition-colors ${theme === 'dark' ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50'}`}>
                            <td className="p-8">
                              <div className="flex items-center space-x-4">
                                <Avatar src={req.avatar} size={32} />
                                <span className="font-bold text-sm">{req.username}</span>
                              </div>
                            </td>
                            <td className="p-8 text-neutral-500 text-xs font-medium">{req.email}</td>
                            <td className="p-8 text-right">
                              <div className="flex items-center justify-end space-x-3">
                                <button 
                                  onClick={() => handleApprove(req._id, 'approved')}
                                  className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                >
                                  <FiCheck size={16} />
                                </button>
                                <button 
                                  onClick={() => handleApprove(req._id, 'rejected')}
                                  className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h3 className="font-black uppercase tracking-widest text-sm">
                      {t('manage_comments')}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Search */}
                      <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input 
                          type="text" 
                          placeholder={t('search_comm_placeholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`border rounded-xl py-2.5 pl-10 pr-4 text-[10px] outline-none focus:border-primary transition-all w-full md:w-64 ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                      </div>

                      {/* Filter */}
                      <select 
                        value={commentFilter}
                        onChange={(e) => setCommentFilter(e.target.value)}
                        className={`border rounded-xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                        }`}
                      >
                        <option value="all" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('all_comments')}</option>
                        <option value="reported" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('reported_only')}</option>
                      </select>

                      {}
                      <select 
                        value={commentSort}
                        onChange={(e) => setCommentSort(e.target.value)}
                        className={`border rounded-xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                        }`}
                      >
                        <option value="newest" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('newest_first')}</option>
                        <option value="oldest" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('oldest_first')}</option>
                        <option value="most_reported" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('most_reported')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-white/5">
                          <th className="p-8">{t('user_info')}</th>
                          <th className="p-8">{t('movie_context')}</th>
                          <th className="p-8">{t('comm_content')}</th>
                          <th className="p-8">{t('engagement')}</th>
                          <th className="p-8 text-right">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComments.map(c => (
                          <React.Fragment key={c._id}>
                            <tr className={`border-b transition-colors ${
                              c.reportsCount > 0 
                                ? 'bg-red-500/[0.03] hover:bg-red-500/[0.05]' 
                                : theme === 'dark' ? 'hover:bg-white/[0.02] border-white/5' : 'hover:bg-gray-50 border-gray-50'
                            }`}>
                              <td className="p-8">
                                <div className="flex items-center space-x-4">
                                  <Avatar src={c.user?.avatar} size={40} className={`border ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`} />
                                  <div className="flex flex-col">
                                    <span className="font-black text-sm">{c.user?.username}</span>
                                    <span className="text-[10px] text-neutral-500 font-bold">{c.user?.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-8">
                                <div className="flex flex-col space-y-1">
                                  <span className="text-[10px] font-black uppercase text-primary tracking-tighter">
                                    {c.movieTitle}
                                  </span>
                                  <span className="text-[8px] text-neutral-600 font-bold">{t('id_label')}: {c.movieId}</span>
                                  <span className="text-[8px] text-neutral-500 uppercase font-black">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="p-8 max-w-xs">
                                {editingComment?.id === c._id && !editingComment.isReply ? (
                                  <div className="flex flex-col space-y-2">
                                    <textarea 
                                      className={`border rounded-xl p-4 text-xs outline-none focus:border-primary w-full min-h-[80px] ${
                                        theme === 'dark' ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-dark'
                                      }`}
                                      value={editingComment.content}
                                      onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                    />
                                    <div className="flex space-x-2">
                                      <button onClick={handleEditComment} className="flex items-center space-x-2 bg-primary text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><FiSave /> <span>{t('save')}</span></button>
                                      <button onClick={() => setEditingComment(null)} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${
                                        theme === 'dark' ? 'bg-white/10 text-neutral-400' : 'bg-gray-100 text-neutral-500'
                                      }`}><FiX /> <span>{t('cancel')}</span></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>{c.content}</p>
                                    {c.reportsCount > 0 && (
                                      <div className="flex flex-col gap-1 mt-3">
                                        <p className="text-[8px] font-black uppercase text-red-500 tracking-widest">{t('recent_reports')}</p>
                                        {c.reports?.slice(0, 2).map((r: any, i: any) => (
                                          <p key={i} className="text-[9px] text-red-400/80 italic font-medium">"{r.reason}"</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-8">
                                <div className="flex flex-col space-y-3">
                                  <div className="flex items-center space-x-4 text-neutral-500">
                                    <div className="flex items-center space-x-1.5">
                                      <FiHeart size={14} className="text-primary" />
                                      <span className="text-xs font-black">{c.likesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      <FiCornerDownRight size={14} className="text-blue-500" />
                                      <span className="text-xs font-black">{c.repliesCount || 0}</span>
                                    </div>
                                  </div>
                                  {c.reportsCount > 0 && (
                                    <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-lg w-fit">
                                      <FiAlertCircle size={12} />
                                      <span className="text-[10px] font-black">{c.reportsCount} {t('reports_count')}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-8 text-right">
                                <div className="flex items-center justify-end space-x-3">
                                  <button 
                                    onClick={() => setEditingComment({ id: c._id, content: c.content, isReply: false })}
                                    className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all group"
                                    title={t('edit_comm')}
                                  >
                                    <FiEdit2 size={16} className="group-hover:scale-110 transition-transform" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(c._id)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                                    title={t('delete_comm')}
                                  >
                                    <FiTrash2 size={16} className="group-hover:scale-110 transition-transform" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Replies */}
                            {c.replies?.map((r: any) => (
                              <tr key={r._id} className={`border-b transition-colors ${
                                theme === 'dark' ? 'bg-white/[0.01] hover:bg-white/[0.03] border-white/5' : 'bg-gray-50/30 hover:bg-gray-50 border-gray-50'
                              }`}>
                                <td className="p-4 pl-16">
                                  <div className="flex items-center space-x-4">
                                    <FiCornerDownRight className="text-neutral-600" />
                                    <Avatar src={r.user?.avatar} size={28} className={`border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`} />
                                    <div className="flex flex-col">
                                      <span className={`font-bold text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>{r.user?.username}</span>
                                      <span className="text-[8px] text-neutral-600 font-bold uppercase">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-[9px] font-black uppercase text-neutral-600 tracking-widest">
                                  {t('reply_to')} {c.user?.username}
                                </td>
                                <td className="p-4">
                                  {editingComment?.id === r._id && editingComment.isReply ? (
                                    <div className="flex flex-col space-y-2">
                                      <textarea 
                                        className={`border rounded-xl p-3 text-xs outline-none focus:border-primary w-full ${
                                          theme === 'dark' ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-dark'
                                        }`}
                                        value={editingComment.content}
                                        onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                      />
                                      <div className="flex space-x-2">
                                        <button onClick={handleEditComment} className="text-primary hover:text-red-700 transition-colors"><FiSave size={14} /></button>
                                        <button onClick={() => setEditingComment(null)} className="text-neutral-500 hover:text-white transition-colors"><FiX size={14} /></button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className={`text-xs italic ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>"{r.content}"</p>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-1.5 text-neutral-500">
                                      <FiHeart size={12} className="text-primary" />
                                      <span className="text-[10px] font-black">{r.likesCount || 0}</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[7px] font-black uppercase tracking-tighter w-fit">{t('sub_comment')}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button 
                                      onClick={() => setEditingComment({ id: r._id, content: r.content, isReply: true, parentId: c._id })}
                                      className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                    >
                                      <FiEdit2 size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReply(c._id, r._id)}
                                      className="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    >
                                      <FiTrash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'movies' && (
                <motion.div
                  key="movies"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* Forms Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Banner Form */}
                    <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <h3 className="font-black uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                        <span className="flex items-center"><FiImage className="mr-3 text-primary" /> {isEditingContent?.type === 'banner' ? t('edit_banner') : t('add_banner')}</span>
                        {isEditingContent?.type === 'banner' && (
                          <button onClick={() => { setIsEditingContent(null); setBannerForm({ title: '', description: '', image: '', movie: '', link: '' }); }} className="text-[10px] bg-white/5 px-3 py-1 rounded-lg hover:bg-white/10">{t('cancel_edit')}</button>
                        )}
                      </h3>
                      <form onSubmit={handleAddBanner} className="space-y-4">
                        <input 
                          type="text" placeholder={t('title')} value={bannerForm.title}
                          onChange={e => setBannerForm({...bannerForm, title: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <textarea
                          placeholder={t('description')}
                          value={bannerForm.description}
                          onChange={e => setBannerForm({ ...bannerForm, description: e.target.value })}
                          rows={3}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all resize-none ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        
                        <div className="relative group">
                          <input 
                            type="text" placeholder={t('image_url_placeholder')} value={bannerForm.image}
                            onChange={e => setBannerForm({...bannerForm, image: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all pr-12 ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                          <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all">
                            {uploading.banner ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FiUpload />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                          </label>
                        </div>

                        <select 
                          value={bannerForm.movie}
                          onChange={e => setBannerForm({...bannerForm, movie: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all appearance-none cursor-pointer ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        >
                          <option value="" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('select_movie')}</option>
                          {movies.map(m => (
                            <option key={m._id} value={m._id} className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{m.title}</option>
                          ))}
                        </select>
                        <input 
                          type="text" placeholder={t('external_link')} value={bannerForm.link}
                          onChange={e => setBannerForm({...bannerForm, link: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center justify-center space-x-2">
                          <FiPlus /> <span>{isEditingContent?.type === 'banner' ? t('update_banner') : t('save_banner')}</span>
                        </button>
                      </form>
                    </div>

                    {/* Movie Form */}
                    <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <h3 className="font-black uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                        <span className="flex items-center"><FiFilm className="mr-3 text-primary" /> {isEditingContent?.type === 'movie' ? t('edit_movie') : t('add_movie')}</span>
                        {isEditingContent?.type === 'movie' && (
                          <button onClick={() => { setIsEditingContent(null); setMovieForm({ title: '', description: '', posterPath: '', trailerUrl: '', runtime: '', country: '', genres: '', releaseDate: '' }); }} className="text-[10px] bg-white/5 px-3 py-1 rounded-lg hover:bg-white/10">{t('cancel_edit')}</button>
                        )}
                      </h3>
                      <form onSubmit={handleAddMovie} className="space-y-4">
                        <input 
                          type="text" placeholder={t('title')} value={movieForm.title}
                          onChange={e => setMovieForm({...movieForm, title: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <textarea 
                          placeholder={t('description')} value={movieForm.description}
                          onChange={e => setMovieForm({...movieForm, description: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all h-24 ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <input 
                              type="text" placeholder={t('poster_url')} value={movieForm.posterPath}
                              onChange={e => setMovieForm({...movieForm, posterPath: e.target.value})}
                              className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all pr-12 ${
                                theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                              }`}
                            />
                            <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all">
                              {uploading.movie ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FiUpload />}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'movie')} />
                            </label>
                          </div>
                          <input 
                            type="text" placeholder={t('trailer_url')} value={movieForm.trailerUrl}
                            onChange={e => setMovieForm({...movieForm, trailerUrl: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder={t('runtime_placeholder')} value={movieForm.runtime}
                            onChange={e => setMovieForm({...movieForm, runtime: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                          <input 
                            type="text" placeholder={t('country_placeholder')} value={movieForm.country}
                            onChange={e => setMovieForm({...movieForm, country: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder={t('genres_placeholder')} value={movieForm.genres}
                            onChange={e => setMovieForm({...movieForm, genres: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                          <input 
                            type="text" placeholder={t('release_year_placeholder')} value={movieForm.releaseDate}
                            onChange={e => setMovieForm({...movieForm, releaseDate: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center justify-center space-x-2">
                          <FiPlus /> <span>{isEditingContent?.type === 'movie' ? t('update_movie') : t('save_movie')}</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {}
                    <div className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <div className="p-8 border-b border-white/5">
                        <h3 className="font-black uppercase tracking-widest text-sm">{t('banners')}</h3>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {banners.map(b => (
                          <div key={b._id} className="p-6 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="flex items-center space-x-4">
                              <img src={b.image} className="w-16 h-10 object-cover rounded-lg" alt="" />
                              <div>
                                <h4 className="font-bold text-xs">{b.title}</h4>
                                <p className="text-[10px] text-neutral-500">{b.movie?.title || 'External Link'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleEditBannerClick(b)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                                <FiEdit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteBanner(b._id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Movie List */}
                    <div className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <div className="p-8 border-b border-white/5">
                        <h3 className="font-black uppercase tracking-widest text-sm">{t('movies_count')}</h3>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {movies.map(m => (
                          <div key={m._id} className="p-6 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="flex items-center space-x-4">
                              <img src={m.posterPath} className="w-10 h-14 object-cover rounded-lg" alt="" />
                              <div>
                                <h4 className="font-bold text-xs">{m.title}</h4>
                                <p className="text-[10px] text-neutral-500">{m.releaseDate}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleEditMovieClick(m)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                                <FiEdit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteMovie(m._id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl md:rounded-[2.5rem] border overflow-hidden flex h-[calc(100dvh-14rem)] md:h-[700px] max-w-full ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  {/* Left Sidebar — full width list on mobile, hidden when chat open */}
                  <div className={`${showMobileAdminChat ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r flex-col flex-shrink-0 ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="p-4 md:p-6 border-b border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-500">{t('admin_list')}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateGroup(true);
                            setNewGroupName('');
                            setNewGroupMembers([]);
                          }}
                          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all icon-btn no-min-h"
                          title={t('create_group')}
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            setSelectedReceiver('group');
                            setShowMobileAdminChat(true);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                            isDefaultGroup(selectedReceiver)
                              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                              : 'hover:bg-white/5 text-neutral-400'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                              <FiUsers size={18} />
                            </div>
                            {getAdminThreadUnread('defaultGroup', 'group') > 0 && (
                              <span className={`absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 ${isDefaultGroup(selectedReceiver) ? 'border-primary' : theme === 'dark' ? 'border-[#1a1a1a]' : 'border-gray-50'}`}>
                                {getAdminThreadUnread('defaultGroup', 'group') > 9 ? '9+' : getAdminThreadUnread('defaultGroup', 'group')}
                              </span>
                            )}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="font-black text-[11px] uppercase">{t('group_chat')}</p>
                            <p className="text-[8px] font-bold opacity-60 uppercase">{t('group_chat_desc')}</p>
                          </div>
                        </button>
                      </div>

                      {chatGroups.length > 0 && (
                        <div className="mt-5 space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 px-1">{t('my_groups')}</p>
                          {sortedChatGroups.map((group) => {
                            const isActive =
                              isCustomGroup(selectedReceiver) && selectedReceiver._id === group._id;
                            return (
                              <div
                                key={group._id}
                                className={`flex items-center gap-1 p-1 rounded-2xl transition-all ${
                                  isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'hover:bg-white/5 text-neutral-400'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReceiver(group);
                                    setShowMobileAdminChat(true);
                                  }}
                                  className="flex items-center gap-3 p-2 min-w-0 flex-1 rounded-xl text-left"
                                >
                                  <div className="relative shrink-0">
                                    <div
                                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                        isActive ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                      }`}
                                    >
                                      {group.name?.charAt(0)?.toUpperCase() || 'G'}
                                    </div>
                                    {getAdminThreadUnread('group', group._id) > 0 && (
                                      <span
                                        className={`absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 ${
                                          isActive
                                            ? 'border-primary'
                                            : theme === 'dark'
                                              ? 'border-[#1a1a1a]'
                                              : 'border-gray-50'
                                        }`}
                                      >
                                        {getAdminThreadUnread('group', group._id) > 9
                                          ? '9+'
                                          : getAdminThreadUnread('group', group._id)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-left min-w-0 flex-1">
                                    <p className="font-black text-[11px] uppercase truncate">{group.name}</p>
                                    <p className="text-[8px] font-bold opacity-60 uppercase">
                                      {t('members_count', { count: group.members?.length || 0 })}
                                    </p>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 px-1 mb-2">{t('chat_with')}</p>
                      <div className="relative mb-3">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                        <input
                          type="search"
                          value={adminChatSearch}
                          onChange={(e) => setAdminChatSearch(e.target.value)}
                          placeholder={t('search_admin_placeholder')}
                          className={`w-full rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary border ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white placeholder:text-neutral-600' : 'bg-white border-gray-200 text-dark placeholder:text-gray-400'}`}
                        />
                      </div>
                      {sortedAdminsForChat.length === 0 ? (
                        <p className="text-[10px] text-neutral-500 text-center py-4 uppercase font-bold">{t('no_search_results')}</p>
                      ) : sortedAdminsForChat.map(admin => (
                        <button 
                          key={admin._id}
                          onClick={() => {
                            setSelectedReceiver(admin);
                            setShowMobileAdminChat(true);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                            isPrivateChat(selectedReceiver) && selectedReceiver?._id === admin._id 
                              ? 'bg-white/10 border border-white/10 shadow-xl' 
                              : 'hover:bg-white/5 border border-transparent text-neutral-500'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <Avatar src={admin.avatar} size={40} className="rounded-xl" />
                            {getAdminThreadUnread('private', admin._id) > 0 && (
                              <span className={`absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 ${isPrivateChat(selectedReceiver) && selectedReceiver?._id === admin._id ? 'border-white/10' : theme === 'dark' ? 'border-[#1a1a1a]' : 'border-gray-50'}`}>
                                {getAdminThreadUnread('private', admin._id) > 9 ? '9+' : getAdminThreadUnread('private', admin._id)}
                              </span>
                            )}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className={`font-black text-[11px] uppercase truncate ${isPrivateChat(selectedReceiver) && selectedReceiver?._id === admin._id ? 'text-white' : ''}`}>
                              {admin.username}
                            </p>
                            <p className="text-[8px] font-bold opacity-60 uppercase truncate">{admin.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Window — full screen on mobile when open */}
                  <div className={`${showMobileAdminChat ? 'flex' : 'hidden md:flex'} flex-grow flex-col min-w-0 w-full`}>
                    {/* Chat Header */}
                    <div className={`p-4 md:p-8 border-b flex items-center justify-between gap-3 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setShowMobileAdminChat(false)}
                          className="md:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors icon-btn no-min-h"
                          aria-label="Back"
                        >
                          <FiChevronLeft size={22} />
                        </button>
                        <div className="min-w-0">
                          <h3 className="font-black uppercase tracking-widest text-xs md:text-sm flex items-center truncate">
                            <FiActivity className="mr-2 md:mr-3 text-primary flex-shrink-0" /> 
                            <span className="truncate">{getChatTitle()}</span>
                          </h3>
                          <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1 truncate">
                            {getChatSubtitle()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCustomGroup(selectedReceiver) && (
                          <button
                            type="button"
                            onClick={() => {
                              setManageGroupMembers(selectedReceiver.members?.map((m: any) => m._id) || []);
                              setManageGroupCoAdmins(selectedReceiver.coAdmins?.map((ca: any) => ca._id) || []);
                              setShowManageGroup(true);
                            }}
                            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors icon-btn no-min-h"
                            title={t('manage_group')}
                          >
                            <FiSettings size={18} />
                          </button>
                        )}
                        {(isDefaultGroup(selectedReceiver) || isCustomGroup(selectedReceiver)) && (
                          <div className="flex -space-x-2">
                            {(isCustomGroup(selectedReceiver) ? selectedReceiver.members : adminList).slice(0, 5).map((a: any, i: any) => (
                              <Avatar key={a._id || i} src={a.avatar} size={24} className="border-2 border-dark" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {}
                    <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar flex flex-col-reverse">
                      <div className="flex flex-col space-y-6">
                        {chatLoading ? (
                          <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <div className="text-center py-20">
                            <FiMessageSquare size={40} className="mx-auto mb-4 text-neutral-700 opacity-20" />
                            <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">
                              {isDefaultGroup(selectedReceiver) || isCustomGroup(selectedReceiver) ? t('no_chat_group') : t('no_chat_private')}
                            </p>
                          </div>
                        ) : chatMessages.map((msg, i) => (
                          <div key={msg._id} className={`flex items-start gap-4 group ${msg.user?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                            <Avatar src={msg.user?.avatar} size={36} className="flex-shrink-0 mt-1" />
                            <div className={`flex flex-col max-w-[70%] ${msg.user?._id === user?._id ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[9px] font-black uppercase text-neutral-500">{msg.user?.username}</span>
                                <span className="text-[7px] font-bold text-neutral-600">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {msg.user?._id === user?._id && (
                                  <div className={`flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity mb-1 ${msg.user?._id === user?._id ? 'justify-end' : ''}`}>
                                    <button 
                                      onClick={() => setEditingAdminMsg({ id: msg._id, content: msg.content })}
                                      className="text-neutral-500 hover:text-blue-500 transition-colors"
                                    >
                                      <FiEdit2 size={10} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAdminMsg(msg._id)}
                                      className="text-neutral-500 hover:text-red-500 transition-colors"
                                    >
                                      <FiTrash2 size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed group relative ${
                                msg.user?._id === user?._id 
                                  ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                                  : theme === 'dark' ? 'bg-white/10 text-white rounded-tl-none border border-white/5' : 'bg-gray-100 text-dark rounded-tl-none'
                              }`}>
                                {editingAdminMsg?.id === msg._id ? (
                                  <form onSubmit={handleUpdateAdminMsg} className="flex flex-col gap-2 min-w-[200px]">
                                    <textarea 
                                      autoFocus
                                      className={`w-full bg-transparent border-b border-white/20 outline-none text-xs py-1 resize-none ${msg.user?._id === user?._id ? 'text-white' : 'text-dark'}`}
                                      value={editingAdminMsg.content}
                                      onChange={(e) => setEditingAdminMsg({ ...editingAdminMsg, content: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') setEditingAdminMsg(null);
                                        if (e.key === 'Enter' && !e.shiftKey) handleUpdateAdminMsg(e);
                                      }}
                                    />
                                    <div className="flex justify-end space-x-2">
                                      <button type="button" onClick={() => setEditingAdminMsg(null)} className="text-[8px] uppercase font-black opacity-60 hover:opacity-100">{t('cancel')}</button>
                                      <button type="submit" className="text-[8px] uppercase font-black hover:underline">{t('save')}</button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    {msg.content}
                                    {msg.isEdited && (
                                      <span className={`text-[7px] font-black uppercase opacity-40 block mt-1 ${msg.user?._id === user?._id ? 'text-right' : ''}`}>
                                        ({t('edited')})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className={`p-4 md:p-6 border-t ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                      <form onSubmit={handleSendChatMessage} className="w-full min-w-0">
                        <div className="relative w-full min-w-0">
                          <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={getChatPlaceholder()}
                            className={`w-full border rounded-2xl py-3 md:py-3.5 pl-4 md:pl-5 pr-12 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-black/40 border-white/10 text-white placeholder:text-neutral-600' : 'bg-white border-gray-200 text-dark shadow-inner placeholder:text-neutral-400'
                            }`}
                          />
                          <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className={`icon-btn no-min-h absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 ${
                              newMessage.trim() 
                                ? 'bg-primary text-white shadow-md shadow-primary/25 hover:scale-105 active:scale-95' 
                                : theme === 'dark' ? 'bg-white/10 text-neutral-500' : 'bg-gray-200 text-neutral-400'
                            }`}
                          >
                            <FiSend size={15} className={newMessage.trim() ? 'fill-current' : ''} />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'support' && (
                <motion.div
                  key="support"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl md:rounded-[2.5rem] border overflow-hidden flex h-[calc(100dvh-14rem)] md:h-[700px] max-w-full ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  {/* Left Sidebar: Conversations — list view on mobile */}
                  <div className={`${showMobileSupportChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex-col flex-shrink-0 ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="p-4 md:p-6 border-b border-white/5 space-y-3">
                      <div>
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-500 mb-1">{t('customer_support')}</h4>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{t('messages_from_users')}</p>
                      </div>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                        <input
                          type="search"
                          value={supportSearchQuery}
                          onChange={(e) => setSupportSearchQuery(e.target.value)}
                          placeholder={t('search_user_placeholder')}
                          className={`w-full rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary border ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white placeholder:text-neutral-600' : 'bg-white border-gray-200 text-dark placeholder:text-gray-400'}`}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {supportConversations.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                          <FiMessageSquare size={30} className="mx-auto mb-2" />
                          <p className="text-[8px] font-black uppercase">{t('no_support_requests')}</p>
                        </div>
                      ) : filteredSupportConversations.length === 0 ? (
                        <p className="text-[10px] text-neutral-500 text-center py-6 uppercase font-bold">{t('no_search_results')}</p>
                      ) : (
                        filteredSupportConversations.map((conv) => (
                          <button 
                            key={conv.user._id}
                            onClick={() => {
                              setSelectedSupportUser(conv.user);
                              setShowMobileSupportChat(true);
                            }}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all relative ${
                              selectedSupportUser?._id === conv.user._id 
                                ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                                : theme === 'dark' ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-gray-100 text-neutral-600'
                            }`}
                          >
                             <div className="relative flex-shrink-0">
                               <Avatar src={conv.user.avatar} size={44} className="rounded-xl" />
                               {conv.unreadCount > 0 && (
                                 <span className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 ${
                                   selectedSupportUser?._id === conv.user._id ? 'border-primary' : (theme === 'dark' ? 'border-[#1a1a1a]' : 'border-white')
                                 }`}>
                                   {conv.unreadCount}
                                 </span>
                               )}
                             </div>
                               <div className="text-left min-w-0 flex-grow">
                               <div className="flex items-center justify-between gap-2 mb-1">
                                 <p className={`font-black text-[11px] uppercase truncate ${
                                   selectedSupportUser?._id === conv.user._id
                                     ? 'text-white'
                                     : conv.unreadCount > 0
                                       ? 'text-primary'
                                       : theme === 'dark' ? 'text-white' : 'text-dark'
                                 }`}>
                                   {conv.user.username}
                                 </p>
                                 <span className={`text-[8px] font-bold opacity-60 flex-shrink-0`}>
                                   {new Date(conv.lastMessageAt).toLocaleDateString()}
                                 </span>
                               </div>
                               <p className={`text-[10px] font-medium truncate opacity-70 ${selectedSupportUser?._id === conv.user._id ? 'text-white/80' : ''}`}>
                                 {conv.lastMessage}
                               </p>
                             </div>
                           </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Chat Window — full screen on mobile when open */}
                  <div className={`${showMobileSupportChat ? 'flex' : 'hidden md:flex'} flex-grow flex-col min-w-0 w-full`}>
                    {selectedSupportUser ? (
                      <>
                        <div className={`p-4 md:p-8 border-b flex items-center justify-between gap-3 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => setShowMobileSupportChat(false)}
                              className="md:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors icon-btn no-min-h"
                              aria-label="Back"
                            >
                              <FiChevronLeft size={22} />
                            </button>
                            <Avatar src={selectedSupportUser.avatar} size={44} className="flex-shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-black uppercase tracking-widest text-xs md:text-sm truncate">{selectedSupportUser.username}</h3>
                              <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1 truncate">{selectedSupportUser.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="px-2 md:px-3 py-1 bg-primary/10 text-primary text-[9px] md:text-[10px] font-black rounded-full uppercase">{t('support_label')}</span>
                          </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar flex flex-col">
                          {supportLoading && supportMessages.length === 0 ? (
                            <div className="flex justify-center py-20">
                              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                          ) : supportMessages.map((msg, i) => (
                            <div key={msg._id || i} className={`flex items-start gap-4 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                              <Avatar src={msg.sender?.avatar} size={36} className="flex-shrink-0 mt-1" />
                              <div className={`flex flex-col max-w-[70%] ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                  <span className="text-[9px] font-black uppercase text-neutral-500">{msg.sender?.username}</span>
                                  <span className="text-[7px] font-bold text-neutral-600">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed group relative shadow-sm ${
                                  msg.isAdmin 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : theme === 'dark' ? 'bg-white/10 text-white rounded-tl-none border border-white/5' : 'bg-gray-100 text-dark rounded-tl-none'
                                }`}>
                                  {editingSupportMsg?.id === msg._id ? (
                                    <form onSubmit={handleUpdateSupportMsg} className="flex flex-col gap-1.5 min-w-[200px]">
                                      <textarea
                                        autoFocus
                                        className={`w-full bg-transparent border-b border-white/20 outline-none text-xs py-1 resize-none ${msg.isAdmin ? 'text-white' : 'text-dark'}`}
                                        value={editingSupportMsg.content}
                                        onChange={(e) => setEditingSupportMsg({ ...editingSupportMsg, content: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') setEditingSupportMsg(null);
                                          if (e.key === 'Enter' && !e.shiftKey) handleUpdateSupportMsg(e);
                                        }}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setEditingSupportMsg(null)} className="text-[8px] uppercase font-black opacity-60 hover:opacity-100">{t('cancel')}</button>
                                        <button type="submit" className="text-[8px] uppercase font-black hover:underline">{t('save')}</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      {msg.content}
                                      {msg.isEdited && (
                                        <span className={`text-[7px] font-black uppercase opacity-40 block mt-1 ${msg.isAdmin ? 'text-right' : 'text-left'}`}>
                                          {t('edited_label')}
                                        </span>
                                      )}
                                      
                                      {/* Hover Actions */}
                                      {msg.sender?._id === user?._id && (
                                        <div className={`absolute top-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1 ${msg.isAdmin ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                          <button 
                                            onClick={() => setEditingSupportMsg({ id: msg._id, content: msg.content })}
                                            className="text-neutral-500 hover:text-blue-500 transition-colors"
                                          >
                                            <FiEdit2 size={10} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteSupportMsg(msg._id)}
                                            className="text-neutral-500 hover:text-red-500 transition-colors"
                                          >
                                            <FiTrash2 size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={`p-4 md:p-6 border-t ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                          <form onSubmit={handleSendSupportReply} className="w-full min-w-0">
                            <div className="relative w-full min-w-0">
                              <input 
                                type="text" 
                                value={supportReply}
                                onChange={(e) => setSupportReply(e.target.value)}
                                onKeyDown={handleSupportKeyDown}
                                placeholder={t('type_response')}
                                className={`w-full border rounded-2xl py-3 md:py-3.5 pl-4 md:pl-5 pr-12 text-xs outline-none focus:border-primary transition-all ${
                                  theme === 'dark' ? 'bg-black/40 border-white/10 text-white placeholder:text-neutral-600' : 'bg-white border-gray-200 text-dark shadow-inner placeholder:text-neutral-400'
                                }`}
                              />
                              <button 
                                type="submit"
                                disabled={!supportReply.trim()}
                                className={`icon-btn no-min-h absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 ${
                                  supportReply.trim() 
                                    ? 'bg-primary text-white shadow-md shadow-primary/25 hover:scale-105 active:scale-95' 
                                    : theme === 'dark' ? 'bg-white/10 text-neutral-500' : 'bg-gray-200 text-neutral-400'
                                }`}
                              >
                                <FiSend size={15} className={supportReply.trim() ? 'fill-current' : ''} />
                              </button>
                            </div>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center opacity-20 select-none">
                        <FiMessageSquare size={80} className="mb-6" />
                        <h3 className="font-black uppercase tracking-widest text-xl">{t('select_conversation')}</h3>
                        <p className="text-xs font-bold uppercase mt-2">{t('respond_to_user')}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100010] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCreateGroup(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl border p-6 space-y-5 ${theme === 'dark' ? 'bg-neutral-950 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('create_group_title')}</h3>
                <button type="button" onClick={() => setShowCreateGroup(false)} className="p-2 rounded-xl hover:bg-white/5 icon-btn no-min-h">
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 block">{t('group_name')}</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t('group_name_placeholder')}
                    className={`w-full rounded-2xl py-3 px-4 text-sm outline-none focus:border-primary border ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-dark'}`}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">{t('select_members')}</p>
                  <div className="relative mb-3">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                    <input
                      type="search"
                      value={groupMemberSearch}
                      onChange={(e) => setGroupMemberSearch(e.target.value)}
                      placeholder={t('search_admin_placeholder')}
                      className={`w-full rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:border-primary border ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white placeholder:text-neutral-600' : 'bg-gray-50 border-gray-200 text-dark placeholder:text-gray-400'}`}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredAdminsForNewGroup.length === 0 ? (
                      <p className="text-[10px] text-neutral-500 text-center py-4 uppercase font-bold">{t('no_search_results')}</p>
                    ) : filteredAdminsForNewGroup.map((admin: any) => (
                      <label
                        key={admin._id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isMemberSelected(admin._id, newGroupMembers) ? 'border-primary bg-primary/10' : theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isMemberSelected(admin._id, newGroupMembers)}
                          onChange={() => toggleMemberSelection(admin._id, newGroupMembers, setNewGroupMembers)}
                          className="accent-primary shrink-0"
                        />
                        <Avatar src={admin.avatar} size={32} className="rounded-lg" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{admin.username}</p>
                          <p className="text-[9px] text-neutral-500 truncate">{admin.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {t('create_group')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Group Modal */}
      <AnimatePresence>
        {showManageGroup && isCustomGroup(selectedReceiver) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100010] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowManageGroup(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl border p-6 space-y-5 ${theme === 'dark' ? 'bg-neutral-950 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('manage_group')}</h3>
                <button type="button" onClick={() => setShowManageGroup(false)} className="p-2 rounded-xl hover:bg-white/5 icon-btn no-min-h">
                  <FiX size={20} />
                </button>
              </div>
              <p className="text-sm font-bold">{selectedReceiver.name}</p>
              <form onSubmit={handleUpdateGroupMembers} className="space-y-3">
                {(() => {
                  const isCreator = selectedReceiver.createdBy?._id === user?._id || selectedReceiver.createdBy === user?._id;
                  const isCoAdmin = selectedReceiver.coAdmins?.some((ca: any) => ca._id === user?._id || ca === user?._id);
                  const canManageMembers = isCreator || isCoAdmin;

                  return (
                    <>
                      {canManageMembers && (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black uppercase text-neutral-400">{t('select_members')}</h4>
                          </div>
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={12} />
                            <input
                              type="search"
                              value={manageMemberSearch}
                              onChange={(e) => setManageMemberSearch(e.target.value)}
                              placeholder={t('search_admin_placeholder')}
                              className={`w-full rounded-lg py-2 pl-8 pr-3 text-xs outline-none focus:border-primary border ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white placeholder:text-neutral-600' : 'bg-gray-50 border-gray-200 text-dark placeholder:text-gray-400'}`}
                            />
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                            {filteredAdminsForManage.length === 0 ? (
                              <p className="text-[10px] text-neutral-500 text-center py-3 uppercase font-bold">{t('no_search_results')}</p>
                            ) : filteredAdminsForManage.map((admin: any) => (
                              <label
                                key={admin._id}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-all ${isMemberSelected(admin._id, manageGroupMembers) ? 'border-primary bg-primary/10' : theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isMemberSelected(admin._id, manageGroupMembers)}
                                  onChange={() => toggleMemberSelection(admin._id, manageGroupMembers, setManageGroupMembers)}
                                  className="accent-primary shrink-0"
                                />
                                <Avatar src={admin.avatar} size={28} className="rounded-md" />
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <p className="text-[11px] font-bold truncate">{admin.username}</p>
                                  {selectedReceiver.coAdmins?.some((ca: any) => ca._id === admin._id || ca === admin._id) && (
                                    <span className="text-[8px] text-primary font-black uppercase bg-primary/10 px-1.5 py-0.5 rounded">{t('co_admin')}</span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}

                      {isCreator && (
                        <>
                          <div className="border-t border-white/5 pt-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-xs font-black uppercase text-neutral-400">{t('co_admin')}</h4>
                              <span className="text-[8px] text-neutral-500">{t('co_admin_can_manage_members')}</span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                              {adminList.filter((a: any) => manageGroupMembers.includes(a._id)).length === 0 ? (
                                <p className="text-[10px] text-neutral-500 text-center py-3 uppercase font-bold">{t('no_search_results')}</p>
                              ) : adminList.filter((a: any) => manageGroupMembers.includes(a._id)).map((admin: any) => (
                                <label
                                  key={admin._id}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-all ${isMemberSelected(admin._id, manageGroupCoAdmins) ? 'border-primary bg-primary/10' : theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isMemberSelected(admin._id, manageGroupCoAdmins)}
                                    onChange={() => toggleMemberSelection(admin._id, manageGroupCoAdmins, setManageGroupCoAdmins)}
                                    className="accent-primary shrink-0"
                                  />
                                  <Avatar src={admin.avatar} size={28} className="rounded-md" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold truncate">{admin.username}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {canManageMembers && (
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all"
                        >
                          {t('save')}
                        </button>
                      )}
                    </>
                  );
                })()}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLeaveGroup(selectedReceiver)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-300 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FiLogOut size={12} />
                    {t('leave_group')}
                  </button>

                  {(selectedReceiver.createdBy?._id === user?._id || selectedReceiver.createdBy === user?._id) && (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-all"
                    >
                      {t('delete_group')}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
