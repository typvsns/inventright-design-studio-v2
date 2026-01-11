import React, { useState } from 'react';
import { format } from 'date-fns';
import { User, Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CommentThread({ messages, jobId, user, job, onMessageSent, canSendProof }) {
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedFiles.push({
          name: file.name,
          url: file_url
        });
      }
      setAttachments([...attachments, ...uploadedFiles]);
      toast.success('Files attached');
    } catch (error) {
      toast.error('Failed to upload files');
    }
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (isProof = false) => {
    if (!newComment.trim() && attachments.length === 0) {
      toast.error('Please add a message or attachment');
      return;
    }

    const userName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.full_name || user.email;
    
    const messageData = {
      job_id: jobId,
      sender_id: user.id,
      sender_name: userName,
      sender_role: user.role || 'client',
      content: newComment,
      is_proof: isProof,
      attachments: attachments.map(a => a.url)
    };

    if (isProof) {
      toast.success('Proof sent - status will be updated automatically');
    }

    await onMessageSent(messageData, isProof);
    setNewComment('');
    setAttachments([]);
  };

  const getRoleColor = (role) => {
    const colors = {
      client: 'bg-blue-500',
      designer: 'bg-purple-500',
      admin: 'bg-red-500',
      manager: 'bg-green-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  const getRoleLabel = (role) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`glass rounded-lg p-4 ${
              message.is_proof ? 'border-2 border-purple-500/50 bg-purple-50/30' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${getRoleColor(message.sender_role)} flex items-center justify-center flex-shrink-0`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-black font-medium">{message.sender_name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {getRoleLabel(message.sender_role)}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(message.created_date + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                {message.is_proof && (
                  <span className="inline-block px-2 py-1 rounded text-xs bg-purple-500 text-white mb-2">
                    📋 Proof Sent
                  </span>
                )}
                <p className="text-black whitespace-pre-wrap break-words">{message.content}</p>
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Paperclip className="w-4 h-4" />
                        Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Comment Form */}
      <div className="glass-strong rounded-lg p-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type your message..."
          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 mb-3"
          rows={3}
        />

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between glass rounded p-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-black">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(idx)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="comment-file-upload" className="cursor-pointer">
            <div className="glass hover:glass-strong px-3 py-2 rounded-lg text-black flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attach
            </div>
            <input
              id="comment-file-upload"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
          
          <Button
            onClick={() => handleSubmit(false)}
            className="bg-[#4791FF] hover:bg-[#4791FF]/90 text-white"
            disabled={!newComment.trim() && attachments.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
          
          {canSendProof && (
            <Button
              onClick={() => handleSubmit(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!newComment.trim() && attachments.length === 0}
            >
              Send as Proof
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}