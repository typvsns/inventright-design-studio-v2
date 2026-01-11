import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '../ui/GlassCard';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoucherManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'flat',
    discount_amount: 0,
    expiration_date: '',
    uses_per_user: 1,
    active: true
  });

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => base44.entities.VoucherCode.list('-created_date'),
    initialData: []
  });

  const createVoucherMutation = useMutation({
    mutationFn: (data) => base44.entities.VoucherCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher created successfully');
      resetForm();
    },
    onError: () => toast.error('Failed to create voucher')
  });

  const updateVoucherMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VoucherCode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher updated successfully');
      resetForm();
    },
    onError: () => toast.error('Failed to update voucher')
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: (id) => base44.entities.VoucherCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success('Voucher deleted successfully');
    },
    onError: () => toast.error('Failed to delete voucher')
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'flat',
      discount_amount: 0,
      expiration_date: '',
      uses_per_user: 1,
      active: true
    });
    setEditingVoucher(null);
    setShowForm(false);
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      description: voucher.description || '',
      discount_type: voucher.discount_type,
      discount_amount: voucher.discount_amount,
      expiration_date: voucher.expiration_date || '',
      uses_per_user: voucher.uses_per_user,
      active: voucher.active
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVoucher) {
      updateVoucherMutation.mutate({ id: editingVoucher.id, data: formData });
    } else {
      createVoucherMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4791FF] mx-auto" />
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-black">Voucher Codes</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Voucher
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-black">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="glass border-[#4791FF]/30 text-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type" className="text-black">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                >
                  <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Amount ($)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-black">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of the voucher"
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_amount" className="text-black">
                  Amount * {formData.discount_type === 'flat' ? '($)' : '(%)'}
                </Label>
                <Input
                  id="discount_amount"
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) })}
                  placeholder="0"
                  className="glass border-[#4791FF]/30 text-black"
                  min="0"
                  step={formData.discount_type === 'flat' ? '0.01' : '1'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uses_per_user" className="text-black">Uses Per User</Label>
                <Input
                  id="uses_per_user"
                  type="number"
                  value={formData.uses_per_user}
                  onChange={(e) => setFormData({ ...formData, uses_per_user: parseInt(e.target.value) })}
                  className="glass border-[#4791FF]/30 text-black"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration_date" className="text-black">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  className="glass border-[#4791FF]/30 text-black"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="text-black font-normal cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                {editingVoucher ? 'Update' : 'Create'} Voucher
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#4791FF]/30">
                <th className="text-left p-3 text-black font-semibold">Code</th>
                <th className="text-left p-3 text-black font-semibold">Description</th>
                <th className="text-left p-3 text-black font-semibold">Discount</th>
                <th className="text-left p-3 text-black font-semibold">Uses/User</th>
                <th className="text-left p-3 text-black font-semibold">Expiration</th>
                <th className="text-left p-3 text-black font-semibold">Status</th>
                <th className="text-left p-3 text-black font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-600">
                    No voucher codes found
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-[#4791FF]/10">
                    <td className="p-3 text-black font-mono">{voucher.code}</td>
                    <td className="p-3 text-gray-700">{voucher.description || '-'}</td>
                    <td className="p-3 text-black">
                      {voucher.discount_type === 'flat' 
                        ? `$${voucher.discount_amount}` 
                        : `${voucher.discount_amount}%`}
                    </td>
                    <td className="p-3 text-gray-700">{voucher.uses_per_user}</td>
                    <td className="p-3 text-gray-700">
                      {voucher.expiration_date 
                        ? new Date(voucher.expiration_date).toLocaleDateString()
                        : 'No expiration'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        voucher.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {voucher.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(voucher)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this voucher?')) {
                              deleteVoucherMutation.mutate(voucher.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}