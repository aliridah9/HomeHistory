import * as React from "react"
import { Helmet } from "react-helmet-async"
import { 
  Users, Search, Filter, MoreHorizontal, Edit, Trash2, 
  Shield, Mail, Phone, Calendar, TrendingUp, UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/Layout"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent' | 'buyer' | 'investor'
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
  lastLogin: string
  propertiesViewed: number
  searchesPerformed: number
  leadsGenerated: number
  avatar?: string
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@realty.com',
    role: 'agent',
    status: 'active',
    joinDate: '2024-01-15',
    lastLogin: '2 hours ago',
    propertiesViewed: 247,
    searchesPerformed: 89,
    leadsGenerated: 23
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    role: 'buyer',
    status: 'active',
    joinDate: '2024-02-03',
    lastLogin: '1 day ago',
    propertiesViewed: 156,
    searchesPerformed: 45,
    leadsGenerated: 12
  },
  {
    id: '3',
    name: 'Lisa Wang',
    email: 'lisa.wang@investments.com',
    role: 'investor',
    status: 'active',
    joinDate: '2023-11-20',
    lastLogin: '3 hours ago',
    propertiesViewed: 892,
    searchesPerformed: 234,
    leadsGenerated: 67
  },
  {
    id: '4',
    name: 'David Smith',
    email: 'david.smith@homehistory.com',
    role: 'admin',
    status: 'active',
    joinDate: '2023-08-10',
    lastLogin: '30 minutes ago',
    propertiesViewed: 1245,
    searchesPerformed: 456,
    leadsGenerated: 145
  }
]

export default function AdminUsers() {
  const [users] = React.useState(MOCK_USERS)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<string>('all')

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'agent': return 'bg-blue-100 text-blue-800'
      case 'buyer': return 'bg-green-100 text-green-800'
      case 'investor': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin': return Shield
      case 'agent': return UserCheck
      case 'buyer': return Users
      case 'investor': return TrendingUp
      default: return Users
    }
  }

  return (
    <>
      <Helmet>
        <title>User Management | HomeHistory Admin</title>
        <meta name="description" content="Manage users, roles, and user analytics" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Container className="py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">User Management</h1>
              <p className="text-text-secondary mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">
              <Users className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-text-primary">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {users.filter(u => u.status === 'active').length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Agents</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {users.filter(u => u.role === 'agent').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">New This Month</p>
                  <p className="text-2xl font-bold text-text-primary">12</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="buyer">Buyer</option>
                  <option value="investor">Investor</option>
                </select>
              </div>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Activity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Join Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Last Login</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role)
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold text-sm">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-text-primary">{user.name}</h3>
                              <div className="flex items-center text-sm text-text-secondary">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <RoleIcon className="w-4 h-4 text-gray-500" />
                            <Badge className={cn("capitalize", getRoleColor(user.role))}>
                              {user.role}
                            </Badge>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <Badge className={cn("capitalize", getStatusColor(user.status))}>
                            {user.status}
                          </Badge>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-text-primary">{user.propertiesViewed} views</div>
                            <div className="text-text-secondary">{user.searchesPerformed} searches</div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-secondary">
                            {new Date(user.joinDate).toLocaleDateString()}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-secondary">
                            {user.lastLogin}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Analytics */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Registration Trends */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Registration Trends</h2>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>User registration chart</p>
                  <p className="text-xs">Monthly signup trends</p>
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">User Engagement</h2>
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Engagement metrics chart</p>
                  <p className="text-xs">Activity and retention data</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  )
}