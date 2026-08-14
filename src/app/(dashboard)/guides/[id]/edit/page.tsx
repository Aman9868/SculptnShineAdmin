'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import Link from 'next/link';
import { guideAPI } from '@/lib/api/guide';
import RichTextEditor from '@/components/RichTextEditor';

export default function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'NUTRITION',
    image: '',
    videoUrl: '',
    readTime: '5 min read',
    content: '',
    status: true
  });

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const res = await guideAPI.getById(id);
        const guide = res.data.data;
        setFormData({
          title: guide.title,
          slug: guide.slug,
          category: guide.category,
          image: guide.image,
          videoUrl: guide.videoUrl || '',
          readTime: guide.readTime,
          content: guide.content,
          status: guide.status
        });
      } catch (err: any) {
        toast.error('Failed to load guide details');
        router.push('/guides');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuide();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.image || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await guideAPI.update(id, formData);
      toast.success('Guide updated successfully');
      router.push('/guides');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update guide');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/guides" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Guide</h1>
            <p className="mt-1 text-sm text-gray-500">Update article content and details</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-6 py-2.5 font-semibold text-white shadow-md hover:from-gold-500 hover:to-gold-600 disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-gold-500 focus:ring-gold-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-gold-500 focus:ring-gold-500 outline-none bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (Rich Text) *</label>
                <div className="border border-gray-300 rounded-xl overflow-hidden min-h-[300px]">
                   <RichTextEditor 
                      value={formData.content} 
                      onChange={handleEditorChange} 
                      placeholder="Write your guide content here..." 
                   />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Organization & Media</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-gold-500 focus:ring-gold-500 outline-none"
                >
                  <option value="NUTRITION">Nutrition</option>
                  <option value="WORKOUT">Workout</option>
                  <option value="WELLNESS">Wellness</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Read Time</label>
                <input
                  type="text"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-gold-500 focus:ring-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image URL *</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-gold-500 focus:ring-gold-500 outline-none"
                  required
                />
              </div>
              
              {formData.image && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={formData.image} alt="Thumbnail preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (Optional)</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="YouTube, Vimeo, or raw mp4 URL"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-gold-500 focus:ring-gold-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                 <input 
                    type="checkbox" 
                    name="status"
                    id="status"
                    checked={formData.status}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                 />
                 <label htmlFor="status" className="text-sm font-medium text-gray-900">Publish Immediately</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
