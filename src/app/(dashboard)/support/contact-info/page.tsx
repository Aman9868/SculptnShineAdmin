'use client';

import React, { useState, useEffect } from 'react';
import { Headset, Plus, Edit2, Trash2, X, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { supportInfoAPI, SupportInfo } from '@/lib/api/support-info';
import toast from 'react-hot-toast';

export default function SupportContactInfoPage() {
  const [contacts, setContacts] = useState<SupportInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SupportInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'GENERAL',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    address: '',
    operatingHours: '',
    isActive: true
  });

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await supportInfoAPI.getAll();
      if (res.success) {
        setContacts(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch support contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleOpenModal = (contact?: SupportInfo) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        type: contact.type,
        email: contact.email || '',
        mobileNumber: contact.mobileNumber || '',
        whatsappNumber: contact.whatsappNumber || '',
        address: contact.address || '',
        operatingHours: contact.operatingHours || '',
        isActive: contact.isActive
      });
    } else {
      setEditingContact(null);
      setFormData({
        type: 'GENERAL',
        email: '',
        mobileNumber: '',
        whatsappNumber: '',
        address: '',
        operatingHours: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) {
      return toast.error('Type is required');
    }
    
    try {
      setIsSubmitting(true);
      if (editingContact) {
        const res = await supportInfoAPI.update(editingContact.id, formData);
        if (res.success) toast.success('Contact info updated successfully');
      } else {
        const res = await supportInfoAPI.create(formData);
        if (res.success) toast.success('Contact info created successfully');
      }
      setIsModalOpen(false);
      fetchContacts();
    } catch (error) {
      toast.error('Failed to save contact info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact info?')) return;
    
    try {
      const res = await supportInfoAPI.delete(id);
      if (res.success) {
        toast.success('Contact info deleted successfully');
        fetchContacts();
      }
    } catch (error) {
      toast.error('Failed to delete contact info');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Headset className="w-6 h-6 text-gold-600" />
            Support Contact Info
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage public support contact details for users.</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-gold-600/20 hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Grid of Contacts */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Headset className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Contact Info Found</h3>
          <p className="text-gray-500 mb-4">Add contact details to help your users reach support.</p>
          <button onClick={() => handleOpenModal()} className="px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg">Add First Contact</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(contact)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(contact.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{contact.type}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${contact.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {contact.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                {contact.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.mobileNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <span>{contact.mobileNumber}</span>
                  </div>
                )}
                {contact.whatsappNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                    <span>{contact.whatsappNumber} (WA)</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <span className="line-clamp-2">{contact.address}</span>
                  </div>
                )}
                {contact.operatingHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <span>{contact.operatingHours}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingContact ? 'Edit Contact Info' : 'Add Contact Info'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type / Department *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. GENERAL, SALES, TECHNICAL"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  placeholder="support@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <input 
                    type="text" 
                    placeholder="+1 234 567 8900"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                  <input 
                    type="text" 
                    placeholder="+1 234 567 8900"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Operating Hours</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mon-Fri: 9AM - 6PM"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Physical Address</label>
                <textarea 
                  placeholder="Full office address"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-gold-600 rounded border-gray-300 focus:ring-gold-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Set as Active</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-50 font-bold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#111] hover:bg-black text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingContact ? 'Save Changes' : 'Create Contact')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
