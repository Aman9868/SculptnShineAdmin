'use client';

import React, { useState, useEffect } from 'react';
import { supportAPI, SupportTicket, TicketStatus, TicketCategory } from '@/lib/api/support';
import { 
  Headset, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  MoreVertical,
  X,
  Send,
  Package,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  
  // Drawer state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<SupportTicket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await supportAPI.getAllTickets({ 
        status: statusFilter as TicketStatus || undefined,
        search: searchTerm || undefined 
      });
      if (res.success) {
        setTickets(res.data);
      }
    } catch (error) {
      toast.error('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const openTicketDrawer = async (id: string) => {
    setSelectedTicketId(id);
    setIsDrawerOpen(true);
    setIsLoadingDetails(true);
    try {
      const res = await supportAPI.getTicketDetails(id);
      if (res.success) {
        setTicketDetails(res.data);
      }
    } catch (error) {
      toast.error('Failed to load ticket details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTicketDetails(null);
    setSelectedTicketId(null);
    setReplyMessage('');
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticketDetails) return;
    try {
      setIsUpdatingStatus(true);
      const res = await supportAPI.updateTicketStatus(ticketDetails.id, newStatus);
      if (res.success) {
        toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
        setTicketDetails(prev => prev ? { ...prev, status: newStatus } : null);
        fetchTickets(); // Refresh list in background
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReply = async () => {
    if (!ticketDetails || !replyMessage.trim()) return;
    try {
      setIsReplying(true);
      const res = await supportAPI.addReply(ticketDetails.id, replyMessage);
      if (res.success) {
        toast.success('Reply sent successfully');
        setReplyMessage('');
        // Refresh ticket details to show new message
        const detailsRes = await supportAPI.getTicketDetails(ticketDetails.id);
        if (detailsRes.success) {
          setTicketDetails(detailsRes.data);
        }
        fetchTickets(); // Refresh list to update status if it changed
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOW': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Headset className="w-6 h-6 text-gold-600" />
            Support & Complaints
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer inquiries, complaints, and requests.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tickets', value: tickets.length, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Open Tickets', value: tickets.filter(t => t.status === 'OPEN').length, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
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
            placeholder="Search by ticket #, user email, or subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </form>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Headset className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-900">No tickets found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openTicketDrawer(ticket.id)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ticket.ticketNumber}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{ticket.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ticket.userProfile?.user?.firstName} {ticket.userProfile?.user?.lastName}</div>
                      <div className="text-xs text-gray-500">{ticket.userProfile?.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{ticket.category.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gold-600 hover:text-gold-700 font-medium text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Drawer / Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
          
          <div className="relative w-full max-w-2xl bg-gray-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {ticketDetails?.ticketNumber || 'Loading...'}
                  {ticketDetails && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticketDetails.status)}`}>
                      {ticketDetails.status.replace('_', ' ')}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500">Customer Support Ticket</p>
              </div>
              <button onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-gold-200 border-t-gold-600 rounded-full animate-spin" />
                </div>
              ) : ticketDetails ? (
                <div className="space-y-6">
                  {/* Context Info */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject</h3>
                      <p className="text-gray-900 font-medium">{ticketDetails.subject}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
                        <p className="text-gray-900">{ticketDetails.category.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority</h3>
                        <span className={`px-2 py-0.5 inline-block rounded border text-xs font-semibold ${getPriorityColor(ticketDetails.priority)}`}>
                          {ticketDetails.priority}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer</h3>
                        <p className="text-gray-900">{ticketDetails.userProfile?.user?.firstName} {ticketDetails.userProfile?.user?.lastName}</p>
                        <p className="text-gray-500 text-sm">{ticketDetails.userProfile?.user?.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Created At</h3>
                        <p className="text-gray-900">{new Date(ticketDetails.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Linked Order/Product */}
                    {(ticketDetails.order || ticketDetails.product) && (
                      <div className="pt-4 border-t border-gray-100 flex gap-4">
                        {ticketDetails.order && (
                          <div className="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Linked Order</p>
                              <p className="text-sm font-medium text-gray-900">{ticketDetails.order.orderNumber}</p>
                            </div>
                          </div>
                        )}
                        {ticketDetails.product && (
                          <div className="flex-1 flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <Package className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Linked Product</p>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{ticketDetails.product.title}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Initial Description */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Issue Description</h3>
                    <p className="text-gray-800 whitespace-pre-wrap text-sm">{ticketDetails.description}</p>
                    
                    {ticketDetails.attachments && ticketDetails.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Attachments</h3>
                        <div className="flex flex-wrap gap-2">
                          {ticketDetails.attachments.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden relative group block">
                              <img src={url} alt={`Attachment ${i}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-xs font-medium">View</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversation Thread */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Conversation</h3>
                      
                      {/* Status Actions */}
                      <div className="flex gap-2">
                        {ticketDetails.status === 'OPEN' && (
                          <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={isUpdatingStatus} className="text-xs font-medium px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors">
                            Mark In Progress
                          </button>
                        )}
                        {ticketDetails.status !== 'RESOLVED' && ticketDetails.status !== 'CLOSED' && (
                          <button onClick={() => handleStatusChange('RESOLVED')} disabled={isUpdatingStatus} className="text-xs font-medium px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors">
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {ticketDetails.messages?.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-4">No replies yet.</p>
                      ) : (
                        ticketDetails.messages?.map((msg) => (
                          <div key={msg.id} className={`flex gap-3 ${msg.senderType === 'ADMIN' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.senderType === 'ADMIN' ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-600'}`}>
                              {msg.senderType === 'ADMIN' ? 'A' : 'C'}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.senderType === 'ADMIN' ? 'bg-gold-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {msg.attachments.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs underline opacity-80 hover:opacity-100">
                                      Attachment {i+1}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className={`text-[10px] mt-1 ${msg.senderType === 'ADMIN' ? 'text-gold-200' : 'text-gray-500'}`}>
                                {new Date(msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Drawer Footer (Reply Input) */}
            {ticketDetails && ticketDetails.status !== 'CLOSED' && (
              <div className="bg-white border-t border-gray-100 p-4 shrink-0">
                <div className="flex gap-3">
                  <textarea 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none resize-none h-20"
                  />
                  <button 
                    onClick={handleReply}
                    disabled={isReplying || !replyMessage.trim()}
                    className="bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white rounded-xl px-6 font-semibold flex items-center gap-2 transition-colors shrink-0"
                  >
                    {isReplying ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
