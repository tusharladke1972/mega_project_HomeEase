import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
        <Card className="max-w-lg w-full shadow-2xl rounded-3xl border-0 p-8">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be signed in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <Card className="w-full max-w-2xl shadow-2xl rounded-3xl border-0 p-8 flex flex-col items-center">
        <div className="w-full flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </Button>
          <CardTitle className="mx-auto text-3xl font-extrabold text-gray-900 tracking-tight">Profile</CardTitle>
        </div>
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full bg-blue-200 flex items-center justify-center shadow-lg mb-4 border-4 border-white">
            <UserIcon className="w-20 h-20 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">{profile?.full_name}</div>
          <div className="text-base text-gray-500">{user.email}</div>
        </div>
        <CardContent className="w-full flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-gray-700">Full Name</label>
            <Input value={profile?.full_name || ''} disabled className="bg-white/80 text-lg py-3 px-4 rounded-xl border border-gray-200" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-gray-700">Phone</label>
            <Input value={profile?.phone || ''} disabled className="bg-white/80 text-lg py-3 px-4 rounded-xl border border-gray-200" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base font-semibold text-gray-700">Role</label>
            <Input value={profile?.role || ''} disabled className="bg-white/80 text-lg py-3 px-4 rounded-xl border border-gray-200 capitalize" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage; 