'use client';

import React, { useState, useEffect } from 'react';
import { shippingAPI, ShippingRule, ShippingData } from '@/lib/api/shipping';
import { Plus, Edit2, Trash2, Check, X, Truck, IndianRupee, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function ShippingManagement() {
  const [data, setData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [thresholdInput, setThresholdInput] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [ruleForm, setRuleForm] = useState<{name: string, charge: string, states: string[], isDefault: boolean}>({
    name: '', charge: '', states: [], isDefault: false
  });
  const [savingRule, setSavingRule] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await shippingAPI.getSettings();
      if (response.success) {
        setData(response.data);
        setThresholdInput(response.data.threshold.toString());
      }
    } catch (error: any) {
      toast.error('Failed to fetch shipping settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateThreshold = async () => {
    try {
      const val = parseFloat(thresholdInput);
      if (isNaN(val) || val < 0) return toast.error('Invalid threshold amount');
      setSavingThreshold(true);
      await shippingAPI.updateThreshold(val);
      toast.success('Free shipping threshold updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update threshold');
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleOpenModal = (rule?: ShippingRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        charge: rule.charge.toString(),
        states: rule.states,
        isDefault: rule.isDefault
      });
    } else {
      setEditingRule(null);
      setRuleForm({ name: '', charge: '', states: [], isDefault: false });
    }
    setIsModalOpen(true);
  };

  const handleSaveRule = async () => {
    try {
      if (!ruleForm.name || !ruleForm.charge) return toast.error('Name and Charge are required');
      setSavingRule(true);
      const payload = {
        name: ruleForm.name,
        charge: parseFloat(ruleForm.charge),
        states: ruleForm.states,
        isDefault: ruleForm.isDefault
      };

      if (editingRule) {
        await shippingAPI.updateRule(editingRule.id, payload);
        toast.success('Rule updated successfully');
      } else {
        await shippingAPI.createRule(payload);
        toast.success('Rule created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save rule');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this shipping rule?')) {
      try {
        await shippingAPI.deleteRule(id);
        toast.success('Rule deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete rule');
      }
    }
  };

  const toggleStateSelection = (stateName: string) => {
    setRuleForm(prev => {
      if (prev.states.includes(stateName)) {
        return { ...prev, states: prev.states.filter(s => s !== stateName) };
      } else {
        return { ...prev, states: [...prev.states, stateName] };
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-32 animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
      </div>
    );
  }

  const totalRules = data?.rules.length || 0;
  const assignedStatesCount = data?.rules.reduce((sum, r) => sum + r.states.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure shipping zones, charges and free shipping threshold</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-gold-600/20 hover:shadow-xl transition-all cursor-pointer"
        >
          <Plus size={16} />
          Add Zone
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Free Shipping Threshold */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Truck size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Free Shipping Above</p>
              <p className="text-xl font-bold text-gray-900">₹{data?.threshold.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-brandPrimary focus:ring-1 focus:ring-brandPrimary"
              placeholder="e.g. 2000"
            />
            <button
              onClick={handleUpdateThreshold}
              disabled={savingThreshold}
              className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-gold-600/20 transition-all disabled:opacity-50"
            >
              {savingThreshold ? '...' : 'Update'}
            </button>
          </div>
        </div>

        {/* Total Zones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MapPin size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shipping Zones</p>
              <p className="text-xl font-bold text-gray-900">{totalRules}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {assignedStatesCount} states assigned across all zones
          </p>
        </div>

        {/* Charge Range */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <IndianRupee size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Charge Range</p>
              {data && data.rules.length > 0 ? (
                <p className="text-xl font-bold text-gray-900">
                  ₹{Math.min(...data.rules.map(r => r.charge))} — ₹{Math.max(...data.rules.map(r => r.charge))}
                </p>
              ) : (
                <p className="text-xl font-bold text-gray-400">—</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Min to max shipping charge
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Zone Name</th>
                <th className="p-4 font-semibold">Charge</th>
                <th className="p-4 font-semibold">States Covered</th>
                <th className="p-4 font-semibold text-center">Type</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4">
                    <span className="font-semibold text-gray-900">{rule.name}</span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-0.5 text-base font-bold text-gray-900">
                      ₹{rule.charge}
                    </span>
                  </td>
                  <td className="p-4">
                    {rule.isDefault ? (
                      <span className="text-sm text-gray-400 italic">All other states (fallback)</span>
                    ) : rule.states.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {rule.states.slice(0, 5).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                            {s}
                          </span>
                        ))}
                        {rule.states.length > 5 && (
                          <span className="px-2 py-0.5 bg-brandPrimary/10 text-brandPrimary text-xs rounded-md font-semibold">
                            +{rule.states.length - 5} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No states assigned</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {rule.isDefault ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">
                        <Check size={12} /> Default
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                        Zone
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(rule)}
                        className="p-2 text-gray-400 hover:text-brandPrimary hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {(!data?.rules || data.rules.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <Truck size={40} className="text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No shipping zones configured</p>
                      <p className="text-sm text-gray-400 mt-1">Add a zone to start calculating shipping charges</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-gold-600/20 transition-all"
                      >
                        <Plus size={14} className="inline mr-1" />
                        Add First Zone
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {data && data.rules.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Showing {data.rules.length} shipping zone{data.rules.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{editingRule ? 'Edit Shipping Zone' : 'Add Shipping Zone'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zone Name</label>
                  <input
                    type="text"
                    value={ruleForm.name}
                    onChange={e => setRuleForm({...ruleForm, name: e.target.value})}
                    placeholder="e.g. Metro Cities"
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-brandPrimary focus:ring-1 focus:ring-brandPrimary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Charge (₹)</label>
                  <input
                    type="number"
                    value={ruleForm.charge}
                    onChange={e => setRuleForm({...ruleForm, charge: e.target.value})}
                    placeholder="e.g. 150"
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-brandPrimary focus:ring-1 focus:ring-brandPrimary text-sm"
                  />
                </div>
              </div>

              <div className="mb-5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={ruleForm.isDefault}
                  onChange={e => setRuleForm({...ruleForm, isDefault: e.target.checked})}
                  className="w-4 h-4 text-brandPrimary rounded focus:ring-brandPrimary border-gray-300"
                />
                <label htmlFor="isDefault" className="text-sm font-semibold text-gray-700">
                  Set as Default Fallback (Rest of India)
                </label>
              </div>

              {!ruleForm.isDefault && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Select States</label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{ruleForm.states.length} selected</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ALL_STATES.map(state => {
                        const isSelected = ruleForm.states.includes(state);
                        return (
                          <div
                            key={state}
                            onClick={() => toggleStateSelection(state)}
                            className={`px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-all ${
                              isSelected
                              ? 'bg-brandPrimary text-white font-semibold shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {isSelected && <Check size={10} className="inline mr-1" />}
                            {state}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={savingRule}
                className="px-6 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-gold-600/20 transition-all disabled:opacity-50"
              >
                {savingRule ? 'Saving...' : (editingRule ? 'Update Zone' : 'Create Zone')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
