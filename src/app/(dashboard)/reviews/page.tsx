'use client';

import React, { useState, useEffect } from 'react';
import { reviewAPI, ProductReview, ReviewStatus } from '@/lib/api/review';
import Pagination from '@/components/Pagination';
import { 
  Star, 
  Search, 
  CheckCircle2,
  XCircle,
  Plus,
  X,
  MessageSquare,
  Package,
  Trash2,
  Edit2,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Create Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [viewingReview, setViewingReview] = useState<ProductReview | null>(null);

  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [] as string[]
  });

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(reviews.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedReviews = reviews.slice((currentPage - 1) * limit, currentPage * limit);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await reviewAPI.getAllReviews({ 
        status: statusFilter as ReviewStatus || undefined,
        search: searchTerm || undefined 
      });
      if (res.success) {
        setReviews(res.data);
      }
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleStatusChange = async (id: string, newStatus: ReviewStatus) => {
    try {
      const res = await reviewAPI.updateReviewStatus(id, newStatus);
      if (res.success) {
        toast.success(`Review ${newStatus.toLowerCase()} successfully`);
        setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await reviewAPI.deleteReview(id);
      if (res.success) {
        toast.success('Review deleted');
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  // Product Search for creating a review
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await reviewAPI.searchProducts(productSearch);
        if (res.success) {
          // Backend returns { success, data: { products, pagination } }
          setSearchResults(res.data?.products || res.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      return toast.error('Please select a product');
    }
    
    try {
      setIsSubmitting(true);
      const res = await reviewAPI.addReview({
        productId: selectedProduct.id,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: newReview.images
      });
      
      if (res.success) {
        toast.success('Review added successfully');
        setIsModalOpen(false);
        setNewReview({ rating: 5, title: '', comment: '', images: [] });
        setSelectedProduct(null);
        setProductSearch('');
        fetchReviews();
      }
    } catch (error) {
      toast.error('Failed to add review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    
    try {
      setIsSubmitting(true);
      const res = await reviewAPI.updateReview(editingReview.id, {
        rating: editingReview.rating,
        title: editingReview.title,
        comment: editingReview.comment,
      });
      
      if (res.success) {
        toast.success('Review updated successfully');
        setEditingReview(null);
        fetchReviews();
      }
    } catch (error) {
      toast.error('Failed to update review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-gold-400 text-gold-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-gold-600 fill-gold-600" />
            Ratings & Reviews
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage product reviews and ratings.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-gold-600/20 hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved', value: reviews.filter(t => t.status === 'APPROVED').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', value: reviews.filter(t => t.status === 'PENDING').length, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Rejected', value: reviews.filter(t => t.status === 'REJECTED').length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search reviews or products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </form>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReviewStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Review</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">No reviews found</p>
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {review.product?.images?.[0] ? (
                          <img src={review.product.images[0]} className="w-10 h-10 rounded object-cover border border-gray-200" alt="product" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-gray-200"><Package className="w-5 h-5 text-gray-400" /></div>
                        )}
                        <div className="truncate max-w-[150px] font-medium text-gray-900" title={review.product?.title}>
                          {review.product?.title || 'Unknown Product'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]" title={review.title}>{review.title || 'No Title'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]" title={review.comment}>{review.comment || 'No Comment'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {review.userProfile ? (
                        <>
                          <div className="font-medium text-gray-900">{review.userProfile.user.firstName} {review.userProfile.user.lastName}</div>
                          <div className="text-xs text-gray-500">{review.userProfile.user.email}</div>
                          {review.isVerifiedPurchase && <span className="text-[10px] text-green-600 font-semibold uppercase bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block">Verified</span>}
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-xs font-bold">A</div>
                          <span className="text-sm text-gray-600 italic">Admin Review</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setViewingReview(review)} className="text-gray-500 hover:text-gray-700 inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingReview(review)} className="text-blue-500 hover:text-blue-600 inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:text-red-600 inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && reviews.length > 0 && (
          <Pagination
            page={currentPage}
            limit={limit}
            total={reviews.length}
            totalPages={totalPages}
            itemLabel="reviews"
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Add Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Admin Review</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReview} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product *</label>
                {!selectedProduct ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search product by name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                    />
                    {isSearchFocused && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-lg rounded-xl max-h-60 overflow-y-auto z-10 p-1">
                        {searchResults.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedProduct(p)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            {p.images?.[0] ? <img src={p.images[0]} className="w-8 h-8 rounded object-cover" alt="" /> : <Package className="w-8 h-8 p-1 text-gray-400 bg-gray-100 rounded" />}
                            <span className="text-sm font-medium text-gray-900 truncate">{p.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border border-gold-200 bg-gold-50 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {selectedProduct.images?.[0] && <img src={selectedProduct.images[0]} className="w-8 h-8 rounded object-cover" alt="" />}
                      <span className="text-sm font-medium text-gray-900 truncate">{selectedProduct.title}</span>
                    </div>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${star <= newReview.rating ? 'fill-gold-400 text-gold-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Amazing product!"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Comment</label>
                <textarea 
                  placeholder="Share your thoughts..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none resize-none h-24"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !selectedProduct}
                  className="px-6 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-gold-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingReview(null)} />
          
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Review</h2>
              <button onClick={() => setEditingReview(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditReview} className="p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditingReview({ ...editingReview, rating: star })}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${star <= editingReview.rating ? 'fill-gold-400 text-gold-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Title</label>
                <input 
                  type="text"
                  placeholder="Summarize the experience"
                  value={editingReview.title || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Content</label>
                <textarea 
                  placeholder="What did they like or dislike?"
                  value={editingReview.comment || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none resize-none h-32"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 font-bold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#111] hover:bg-black text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Review Modal */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewingReview(null)} />
          
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Review Details</h2>
              <button onClick={() => setViewingReview(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Product Info */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {viewingReview.product?.images?.[0] ? (
                  <img src={viewingReview.product.images[0]} className="w-16 h-16 rounded-lg object-cover border border-gray-200" alt="product" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200"><Package className="w-8 h-8 text-gray-400" /></div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900">{viewingReview.product?.title || 'Unknown Product'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(viewingReview.status)}`}>
                      {viewingReview.status}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(viewingReview.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {renderStars(viewingReview.rating)}
                </div>
                {viewingReview.title && <h3 className="font-bold text-gray-900 text-lg mb-2">{viewingReview.title}</h3>}
                <p className="text-gray-600 text-sm leading-relaxed">{viewingReview.comment || 'No comment provided.'}</p>
              </div>

              {/* Customer Info */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Customer</h4>
                {viewingReview.userProfile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {viewingReview.userProfile.user.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {viewingReview.userProfile.user.firstName} {viewingReview.userProfile.user.lastName}
                        {viewingReview.isVerifiedPurchase && <span className="text-[10px] text-green-600 font-bold uppercase bg-green-50 px-1.5 py-0.5 rounded">Verified</span>}
                      </div>
                      <div className="text-sm text-gray-500">{viewingReview.userProfile.user.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-bold">A</div>
                    <span className="text-gray-700 font-medium">Admin Review</span>
                  </div>
                )}
              </div>

              {/* Moderation Actions */}
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                {viewingReview.status !== 'APPROVED' && (
                  <button 
                    onClick={() => { handleStatusChange(viewingReview.id, 'APPROVED'); setViewingReview({ ...viewingReview, status: 'APPROVED' }); }}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 transition-all"
                  >
                    Approve Review
                  </button>
                )}
                {viewingReview.status !== 'REJECTED' && (
                  <button 
                    onClick={() => { handleStatusChange(viewingReview.id, 'REJECTED'); setViewingReview({ ...viewingReview, status: 'REJECTED' }); }}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-600/20 transition-all"
                  >
                    Reject Review
                  </button>
                )}
                <button 
                  onClick={() => setViewingReview(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 font-bold rounded-xl transition-colors text-sm ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
