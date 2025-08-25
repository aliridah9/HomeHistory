import * as React from "react"
import { Helmet } from "react-helmet-async"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Eye, 
  EyeOff, 
  Bell, 
  Shield, 
  Trash2,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Container } from "@/components/layout/Layout"
import { useAuthStore, useUser } from "@/stores/auth.store"
import { useUIStore } from "@/stores/ui.store"
import { cn } from "@/lib/utils"

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  location: string
  website: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const user = useUser()
  const { updateProfile, changePassword, deleteAccount, isLoading } = useAuthStore()
  const { addNotification } = useUIStore()
  
  const [activeTab, setActiveTab] = React.useState<"profile" | "security" | "notifications" | "privacy">("profile")
  const [profileData, setProfileData] = React.useState<ProfileFormData>({
    firstName: user?.name?.split(' ')[0] || "",
    lastName: user?.name?.split(' ')[1] || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || ""
  })
  
  const [passwordData, setPasswordData] = React.useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!profileData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!profileData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "Invalid email address"
    }

    if (profileData.phone && !/^\+?[\d\s\-\(\)]+$/.test(profileData.phone)) {
      newErrors.phone = "Invalid phone number"
    }

    if (profileData.website && !/^https?:\/\/.+/.test(profileData.website)) {
      newErrors.website = "Website must start with http:// or https://"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) return

    try {
      const updateData = {
        name: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website
      }

      const success = await updateProfile(updateData)
      
      if (success) {
        addNotification({
          type: "success",
          title: "Profile updated",
          message: "Your profile has been successfully updated."
        })
      }
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Update failed",
        message: error.message || "Failed to update profile"
      })
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Settings }
  ]

  return (
    <>
      <Helmet>
        <title>Profile Settings - HomeHistory</title>
        <meta name="description" content="Manage your HomeHistory profile, security settings, and preferences." />
      </Helmet>

      <Container className="py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Profile Settings
            </h1>
            <p className="text-base text-text-secondary">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-muted text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md">
                {activeTab === "profile" && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-text-primary mb-6">
                      Profile Information
                    </h2>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      {/* Profile Image */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-primary" />
                            )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">Profile Photo</h3>
                          <p className="text-sm text-text-secondary">
                            Upload a photo to personalize your account
                          </p>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            First name
                          </label>
                          <Input
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              firstName: e.target.value
                            }))}
                            className={cn(
                              "rounded-lg border-gray-200 focus:border-primary",
                              errors.firstName && "border-danger focus:border-danger"
                            )}
                            placeholder="John"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-danger">{errors.firstName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Last name
                          </label>
                          <Input
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              lastName: e.target.value
                            }))}
                            className={cn(
                              "rounded-lg border-gray-200 focus:border-primary",
                              errors.lastName && "border-danger focus:border-danger"
                            )}
                            placeholder="Doe"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-danger">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Email address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                            <Input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                email: e.target.value
                              }))}
                              className={cn(
                                "pl-10 rounded-lg border-gray-200 focus:border-primary",
                                errors.email && "border-danger focus:border-danger"
                              )}
                              placeholder="john@example.com"
                            />
                          </div>
                          {errors.email && (
                            <p className="mt-1 text-sm text-danger">{errors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Phone number
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                            <Input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                phone: e.target.value
                              }))}
                              className={cn(
                                "pl-10 rounded-lg border-gray-200 focus:border-primary",
                                errors.phone && "border-danger focus:border-danger"
                              )}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          {errors.phone && (
                            <p className="mt-1 text-sm text-danger">{errors.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-primary hover:bg-primary/90 text-white rounded-full font-semibold px-8 flex items-center space-x-2"
                        >
                          {isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Other tabs would be implemented here */}
                {activeTab !== "profile" && (
                  <div className="p-6">
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🚧</div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Coming Soon
                      </h3>
                      <p className="text-text-secondary">
                        This section is under development and will be available soon.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}