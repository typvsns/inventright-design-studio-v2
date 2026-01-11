import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function UserContactInfo({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    full_name: user?.full_name || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address_1: user?.address_1 || '',
    address_2: user?.address_2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    country: user?.country || ''
  });

  const handleSave = () => {
    onUpdate(editedInfo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo({
      full_name: user?.full_name || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address_1: user?.address_1 || '',
      address_2: user?.address_2 || '',
      city: user?.city || '',
      state: user?.state || '',
      zip: user?.zip || '',
      country: user?.country || ''
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <GlassCard variant="strong" className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Your Contact Information</h3>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-[#4791FF] hover:text-[#3680ee]"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-first-name" className="text-black">First Name *</Label>
              <Input
                id="edit-first-name"
                value={editedInfo.first_name}
                onChange={(e) => setEditedInfo({ ...editedInfo, first_name: e.target.value })}
                className="glass border-[#4791FF]/30 text-black"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-last-name" className="text-black">Last Name *</Label>
              <Input
                id="edit-last-name"
                value={editedInfo.last_name}
                onChange={(e) => setEditedInfo({ ...editedInfo, last_name: e.target.value })}
                className="glass border-[#4791FF]/30 text-black"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-email" className="text-black">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={editedInfo.email}
              onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-phone" className="text-black">Phone Number</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={editedInfo.phone}
              onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="edit-address-1" className="text-black">Address Line 1</Label>
            <Input
              id="edit-address-1"
              value={editedInfo.address_1}
              onChange={(e) => setEditedInfo({ ...editedInfo, address_1: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div>
            <Label htmlFor="edit-address-2" className="text-black">Address Line 2</Label>
            <Input
              id="edit-address-2"
              value={editedInfo.address_2}
              onChange={(e) => setEditedInfo({ ...editedInfo, address_2: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-city" className="text-black">City</Label>
              <Input
                id="edit-city"
                value={editedInfo.city}
                onChange={(e) => setEditedInfo({ ...editedInfo, city: e.target.value })}
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>

            <div>
              <Label htmlFor="edit-state" className="text-black">State</Label>
              <Input
                id="edit-state"
                value={editedInfo.state}
                onChange={(e) => setEditedInfo({ ...editedInfo, state: e.target.value })}
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>

            <div>
              <Label htmlFor="edit-zip" className="text-black">Zip Code</Label>
              <Input
                id="edit-zip"
                value={editedInfo.zip}
                onChange={(e) => setEditedInfo({ ...editedInfo, zip: e.target.value })}
                className="glass border-[#4791FF]/30 text-black"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-country" className="text-black">Country</Label>
            <Input
              id="edit-country"
              value={editedInfo.country}
              onChange={(e) => setEditedInfo({ ...editedInfo, country: e.target.value })}
              className="glass border-[#4791FF]/30 text-black"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="bg-[#4791FF] hover:bg-[#3680ee] text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <span className="text-gray-600 text-sm">Name:</span>
            <p className="text-black font-medium">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.full_name || 'Not provided'}
            </p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Email:</span>
            <p className="text-black font-medium">{user.email}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Phone:</span>
            <p className="text-black font-medium">{user.phone || <span className="text-gray-400 italic">Not provided</span>}</p>
          </div>
          {(user.address_1 || user.city || user.state || user.zip) && (
            <div>
              <span className="text-gray-600 text-sm">Address:</span>
              <p className="text-black font-medium">
                {user.address_1}
                {user.address_2 && <><br />{user.address_2}</>}
                {(user.city || user.state || user.zip) && (
                  <><br />{[user.city, user.state, user.zip].filter(Boolean).join(', ')}</>
                )}
                {user.country && <><br />{user.country}</>}
              </p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}