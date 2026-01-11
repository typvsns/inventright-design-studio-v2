import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import GlassCard from '../ui/GlassCard';

export default function EmailTemplateManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'job_assigned',
    recipient_type: 'client',
    additional_recipients: [],
    subject: '',
    body: '',
    enabled: true
  });
  const [newEmail, setNewEmail] = useState('');

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list(),
    initialData: []
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      if (editingTemplate) {
        return await base44.entities.EmailTemplate.update(editingTemplate.id, templateData);
      } else {
        return await base44.entities.EmailTemplate.create(templateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully`);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to save template');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      return await base44.entities.EmailTemplate.delete(templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete template');
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      trigger: 'job_assigned',
      recipient_type: 'client',
      additional_recipients: [],
      subject: '',
      body: '',
      enabled: true
    });
    setNewEmail('');
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      trigger: template.trigger,
      recipient_type: template.recipient_type,
      additional_recipients: template.additional_recipients || [],
      subject: template.subject,
      body: template.body,
      enabled: template.enabled !== false
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveTemplateMutation.mutate(formData);
  };

  const addEmail = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setFormData({
        ...formData,
        additional_recipients: [...(formData.additional_recipients || []), newEmail]
      });
      setNewEmail('');
    } else {
      toast.error('Please enter a valid email address');
    }
  };

  const removeEmail = (email) => {
    setFormData({
      ...formData,
      additional_recipients: formData.additional_recipients.filter(e => e !== email)
    });
  };

  const triggerLabels = {
    job_assigned: 'Job Assigned to Designer',
    job_started: 'Job Started',
    proof_sent: 'Proof Sent to Client',
    revisions_requested: 'Revisions Requested',
    job_completed: 'Job Completed',
    job_stale_reminder: 'Stale Job Reminder (7 days inactive)'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-black">Email Notifications</h2>
          <p className="text-sm text-gray-600">Configure automated email notifications for job status changes</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {showForm && (
        <GlassCard variant="strong">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-black">
              {editingTemplate ? 'Edit Template' : 'New Email Template'}
            </h3>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-black">Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Job Assignment Notification"
                className="glass border-[#4791FF]/30 text-black"
                required
              />
            </div>

            <div>
              <Label className="text-black">Trigger Event *</Label>
              <Select value={formData.trigger} onValueChange={(val) => setFormData({ ...formData, trigger: val })}>
                <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-black">Send To *</Label>
              <Select value={formData.recipient_type} onValueChange={(val) => setFormData({ ...formData, recipient_type: val })}>
                <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="both">Client & Designer</SelectItem>
                  <SelectItem value="custom">Custom Emails Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-black">Additional Recipients</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="glass border-[#4791FF]/30 text-black"
                  type="email"
                />
                <Button type="button" onClick={addEmail} className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.additional_recipients?.map((email, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeEmail(email)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-black">Subject Line *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Use {{job_name}}, {{job_number}}, {{client_name}}, {{designer_name}}, {{status}}"
                className="glass border-[#4791FF]/30 text-black"
                required
              />
            </div>

            <div>
              <Label className="text-black">Email Body *</Label>
              <div className="glass border-[#4791FF]/30 rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.body}
                  onChange={(value) => setFormData({ ...formData, body: value })}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ color: [] }, { background: [] }],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ align: [] }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  style={{ minHeight: '250px' }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Available variables: <strong>{'{{job_name}}'}</strong>, <strong>{'{{job_number}}'}</strong>, <strong>{'{{client_name}}'}</strong>, <strong>{'{{designer_name}}'}</strong>, <strong>{'{{status}}'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="enabled" className="text-black">Enabled</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
                Save Template
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <GlassCard key={template.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-[#4791FF]" />
                  <h3 className="font-semibold text-black">{template.name}</h3>
                  <Badge variant={template.enabled ? "default" : "secondary"}>
                    {template.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Trigger:</strong> {triggerLabels[template.trigger]}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Recipients:</strong> {template.recipient_type}
                  {template.additional_recipients?.length > 0 && ` + ${template.additional_recipients.length} more`}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Subject:</strong> {template.subject}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}

        {templates.length === 0 && !showForm && (
          <GlassCard className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No email templates configured yet</p>
            <Button onClick={() => setShowForm(true)} className="bg-[#4791FF] hover:bg-[#3680ee] text-white">
              Create Your First Template
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}