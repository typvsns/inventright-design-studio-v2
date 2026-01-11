import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Users, Building2, Loader2, Tag, Plus, Edit, Trash2 } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import VoucherManagement from '../components/admin/VoucherManagement';
import EmailTemplateManager from '../components/admin/EmailTemplateManager';
import { toast } from 'sonner';
import { getWordPressUser, isAuthenticated } from '../components/utils/wordpressAuth';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(createPageUrl('WordPressLogin'));
      return;
    }
    const userData = getWordPressUser();
    // Admin settings requires admin role
    if (userData.role !== 'admin') {
      navigate(createPageUrl('ClientDashboard'));
      return;
    }
    setUser(userData);
  }, [navigate]);

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
    initialData: []
  });

  const saveDepartmentMutation = useMutation({
    mutationFn: async (deptData) => {
      if (editingDept) {
        return await base44.entities.Department.update(editingDept.id, deptData);
      } else {
        return await base44.entities.Department.create(deptData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`Department ${editingDept ? 'updated' : 'created'} successfully`);
      setShowDeptForm(false);
      setEditingDept(null);
      setDeptFormData({ name: '', description: '', active: true });
    },
    onError: () => {
      toast.error('Failed to save department');
    }
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (deptId) => {
      return await base44.entities.Department.delete(deptId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete department');
    }
  });

  const handleEditDept = (dept) => {
    setEditingDept(dept);
    setDeptFormData({
      name: dept.name,
      description: dept.description || '',
      active: dept.active !== false
    });
    setShowDeptForm(true);
  };

  const handleSaveDept = (e) => {
    e.preventDefault();
    saveDepartmentMutation.mutate(deptFormData);
  };

  const handleDeleteDept = (deptId) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      deleteDepartmentMutation.mutate(deptId);
    }
  };

  if (deptLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#4791FF]" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">System Settings</h1>
        <p className="text-gray-700">Manage users, departments, and vouchers</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="glass-dark border border-[#4791FF]/20">
          <TabsTrigger value="users" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Building2 className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            <Tag className="w-4 h-4 mr-2" />
            Vouchers
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-[#4791FF] data-[state=active]:text-white text-black">
            Email Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <GlassCard>
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-black mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">
                Users are managed through your WordPress admin panel.
              </p>
              <p className="text-sm text-gray-500">
                User roles (admin, manager, designer, client) are assigned via WordPress user roles.
              </p>
              <a 
                href="https://inventtraining.com/wp-admin/users.php" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-4"
              >
                <Button className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                  Open WordPress Users
                </Button>
              </a>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Department Management</h2>
            <Button
              onClick={() => {
                setShowDeptForm(true);
                setEditingDept(null);
                setDeptFormData({ name: '', description: '', active: true });
              }}
              className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>

          {showDeptForm && (
            <GlassCard variant="strong">
              <h3 className="text-lg font-semibold text-black mb-4">
                {editingDept ? 'Edit Department' : 'New Department'}
              </h3>
              <form onSubmit={handleSaveDept} className="space-y-4">
                <div>
                  <Label htmlFor="deptName" className="text-black">Department Name *</Label>
                  <Input
                    id="deptName"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    className="glass border-[#4791FF]/30 text-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deptDesc" className="text-black">Description</Label>
                  <Textarea
                    id="deptDesc"
                    value={deptFormData.description}
                    onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                    className="glass border-[#4791FF]/30 text-black"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deptActive"
                    checked={deptFormData.active}
                    onChange={(e) => setDeptFormData({ ...deptFormData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="deptActive" className="text-black">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                    Save Department
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDeptForm(false);
                      setEditingDept(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </GlassCard>
          )}

          <GlassCard>
            <div className="space-y-4">
              {departments.map(dept => (
                <div key={dept.id} className="glass rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-black font-semibold text-lg">{dept.name}</h3>
                      <p className="text-gray-700 text-sm mb-2">{dept.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded ${dept.active ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-600'}`}>
                          {dept.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-gray-600">
                          {dept.form_fields?.length || 0} form fields
                        </span>
                      </div>
                      {dept.pricing_options?.length > 0 && (
                        <div className="mt-2 text-sm text-gray-700">
                          Pricing: {dept.pricing_options.map(p => `${p.name} ($${p.price})`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDept(dept)}
                        className="text-[#4791FF] hover:text-[#3680ee]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDept(dept.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="vouchers">
          <VoucherManagement />
        </TabsContent>

        <TabsContent value="emails">
          <EmailTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}