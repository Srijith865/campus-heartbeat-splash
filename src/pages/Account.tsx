import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload'
import { TagPicker } from '@/components/ui/tag-picker'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, LogOut, EyeOff, Eye, Trash2, UserX, Bookmark } from 'lucide-react'
import TopBar from '@/components/TopBar'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Tag {
  id: string
  text: string
  isCustom: boolean
}

interface ProfileData {
  id: string
  username: string
  email: string
  bio: string
  age: number | null
  main_photo_url: string
  photos: string[]
  interests: Tag[]
  gender: string
  is_visible: boolean
  is_active: boolean
}

const Account: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!data) {
        toast({
          title: "Profile not found",
          description: "Please complete your profile setup",
          variant: "destructive"
        })
        navigate('/create-account')
        return
      }

      if (error) throw error

      // Convert interests to Tag format
      const interestsAsTags: Tag[] = (data.interests || []).map((interest: any, index: number) => ({
        id: `${index}-${typeof interest === 'string' ? interest : interest.text}`,
        text: typeof interest === 'string' ? interest : interest.text,
        isCustom: typeof interest === 'object' ? interest.isCustom : false
      }))

      setProfile({ ...data, interests: interestsAsTags })
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    try {
      setSaving(true)

      // Convert Tag[] back to string[] or keep as Tag[]
      const interestsToSave = profile.interests.map(tag => tag.text)

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          bio: profile.bio,
          age: profile.age,
          interests: interestsToSave,
          photos: profile.photos,
          main_photo_url: profile.main_photo_url
        })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDNDToggle = async (enabled: boolean) => {
    if (!profile) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_visible: !enabled })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, is_visible: !enabled })
      toast({
        title: enabled ? "Do Not Disturb enabled" : "Do Not Disturb disabled",
        description: enabled ? "Your profile is now hidden from feeds" : "Your profile is now visible in feeds",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update DND status",
        variant: "destructive"
      })
    }
  }

  const handleDeactivate = async () => {
    if (!profile) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', profile.id)

      if (error) throw error

      toast({
        title: "Account deactivated",
        description: "Your account has been deactivated",
      })
      
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!profile) return
    
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      // Call the delete account API
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      })
      
      // Sign out and redirect
      await supabase.auth.signOut()
      navigate('/')
    } catch (error: any) {
      console.error('Delete account error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive"
      })
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
      
      navigate('/login')
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-background">
      <TopBar
        avatarUrl={profile.main_photo_url}
        onProfileClick={() => navigate('/feed')}
      />

      <main className="container max-w-2xl mx-auto p-4 pt-24">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your information</p>
        </div>

        <div className="space-y-6 bg-card rounded-2xl p-6 shadow-card border border-border">
          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-2">Photos</label>
            <CloudinaryUpload
              photos={profile.photos}
              onPhotosChange={(photos) => {
                setProfile({
                  ...profile,
                  photos,
                  main_photo_url: photos[0] || profile.main_photo_url
                })
              }}
              maxPhotos={6}
            />
          </div>

          {/* Username (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input
              value={profile.username}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              value={profile.email}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Gender (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <Input
              value={profile.gender || 'Not set'}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-2">Age</label>
            <Input
              type="number"
              value={profile.age || ''}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
              placeholder="Enter your age"
              min="17"
              max="100"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {profile.bio?.length || 0}/500 characters
            </p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium mb-2">Interests</label>
            <TagPicker
              selectedTags={profile.interests || []}
              onTagsChange={(interests) => setProfile({ ...profile, interests })}
            />
          </div>

          {/* Do Not Disturb Mode */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              {profile.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              <div>
                <p className="font-medium">Do Not Disturb Mode</p>
                <p className="text-sm text-muted-foreground">Hide your profile from feeds</p>
              </div>
            </div>
            <Switch
              checked={!profile.is_visible}
              onCheckedChange={handleDNDToggle}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          {/* Bookmarks Button */}
          <Button
            onClick={() => navigate('/bookmarks')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            View Bookmarks
          </Button>
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>

          {/* Deactivate Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950"
                size="lg"
              >
                <UserX className="w-4 h-4 mr-2" />
                Deactivate Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account will be deactivated and hidden from all users. You can reactivate it by logging in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="bg-orange-500 hover:bg-orange-600">
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account Permanently
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your data, matches, messages, and bookmarks will be permanently deleted. This includes:
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>Your profile and photos</li>
                    <li>All messages and chats</li>
                    <li>Matches and ratings</li>
                    <li>Bookmarks and preferences</li>
                  </ul>
                  <p className="mt-2 font-medium text-destructive">
                    Are you absolutely sure you want to proceed?
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  )
}

export default Account
