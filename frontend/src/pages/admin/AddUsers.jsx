import { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { 
  Users, UserPlus, Shield, Search, Filter, X, Check, AlertCircle, 
  UserCheck, UserX, ArrowRight, Sparkles, Crown, Star, Award,
  ChevronDown, Grid, List, RefreshCw, MoreVertical, CheckCircle,
  Mail, Phone, School, MapPin, Calendar, Edit, Trash2, Eye
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function AdminAddUsers() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('create')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [viewMode, setViewMode] = useState('grid')

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '', 
    name: '',
    role: 'SCOUT',
    firstName: '',
    lastName: '',
    nickname: '',
    school: '',
    province: '',
    phone: '',
    email: '',
    campId: '',
    squadId: ''
  })

  // Fetch available scouts (users without squads)
  const { data: availableScouts = [], isLoading: scoutsLoading, refetch: refetchScouts } = useQuery(
    'available-scouts', 
    () => api.get('/admin/scouts/available'),
    {
      retry: 2,
      onError: () => {
        toast.error('ไม่สามารถโหลดข้อมูลลูกเสือได้')
      }
    }
  )

  // Fetch available leaders (users not assigned as leaders)
  const { data: availableLeaders = [], isLoading: leadersLoading, refetch: refetchLeaders } = useQuery(
    'available-leaders', 
    () => api.get('/admin/leaders/available'),
    {
      retry: 2,
      onError: () => {
        toast.error('ไม่สามารถโหลดข้อมูลผู้กำกับได้')
      }
    }
  )

  // Fetch camps for dropdown
  const { data: camps = [] } = useQuery('camps', () => api.get('/camps'))

  const filteredScouts = availableScouts.filter(scout => 
    scout.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scout.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scout.scoutCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scout.school?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLeaders = availableLeaders.filter(leader => 
    leader.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = async () => {
    try {
      // Validate form
      if (!formData.username || !formData.password || !formData.name || !formData.role) {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('รหัสผ่านไม่ตรงกัน')
        return
      }

      const userData = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        campId: formData.campId || null
      }

      // Add role-specific fields
      if (formData.role === 'SCOUT') {
        userData.firstName = formData.firstName
        userData.lastName = formData.lastName
        userData.nickname = formData.nickname
        userData.school = formData.school
        userData.province = formData.province
        userData.phone = formData.phone
        userData.email = formData.email
        userData.squadId = formData.squadId || null
      }

      await api.post('/admin/accounts', userData)
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'SCOUT',
        firstName: '',
        lastName: '',
        nickname: '',
        school: '',
        province: '',
        phone: '',
        email: '',
        campId: '',
        squadId: ''
      })
      
      setShowCreateModal(false)
      toast.success('สร้างผู้ใช้สำเร็จ')
      
      // Refresh data
      qc.invalidateQueries('available-scouts')
      qc.invalidateQueries('available-leaders')
    } catch (error) {
      toast.error(error.response?.data?.error || 'สร้างผู้ใช้ไม่สำเร็จ')
    }
  }

  const handleAssignUsers = async () => {
    try {
      if (selectedUsers.length === 0) {
        toast.error('กรุณาเลือกผู้ใช้อย่างน้อย 1 คน')
        return
      }

      if (activeTab === 'scouts') {
        await api.post('/admin/scouts/assign', { scoutIds: selectedUsers })
      } else {
        await api.post('/admin/leaders/assign', { leaderIds: selectedUsers })
      }
      
      qc.invalidateQueries('available-scouts')
      qc.invalidateQueries('available-leaders')
      
      setSelectedUsers([])
      toast.success('จัดสรรผู้ใช้สำเร็จ')
    } catch (error) {
      toast.error(error.response?.data?.error || 'จัดสรรผู้ใช้ไม่สำเร็จ')
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const isLoading = activeTab === 'scouts' ? scoutsLoading : leadersLoading
  const currentData = activeTab === 'scouts' ? filteredScouts : filteredLeaders
  const totalCount = activeTab === 'scouts' ? availableScouts.length : availableLeaders.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-scout-50 via-white to-emerald-50 dark:from-scout-950 dark:via-scout-900 dark:to-emerald-950">
      {/* Modern Header */}
      <div className="bg-white/80 dark:bg-scout-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-scout-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-scout-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <UserPlus size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-scout-900 dark:text-white">จัดการผู้ใช้</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">เพิ่มและจัดสรรผู้กำกับและลูกเสือ</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-scout-600 to-emerald-600 hover:from-scout-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <UserPlus size={20} />
                สร้างผู้ใช้ใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Stats */}
        <div className="bg-gradient-to-br from-scout-600 via-emerald-600 to-teal-600 rounded-4xl p-12 mb-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-black mb-4">ศูนย์กลางการจัดการผู้ใช้</h1>
                <p className="text-xl text-white/90">สร้างและจัดสรรผู้กำกับและลูกเสือเข้าสู่ระบบ</p>
              </div>
              <div className="text-right">
                <p className="text-6xl font-black mb-2">{availableScouts.length + availableLeaders.length}</p>
                <p className="text-lg text-white/80">ผู้ใช้ที่รอจัดสรร</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{availableScouts.length}</p>
                    <p className="text-white/80">ลูกเสือรอจัดสรร</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{availableLeaders.length}</p>
                    <p className="text-white/80">ผู้กำกับรอจัดสรร</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
                    <Check size={24} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{selectedUsers.length}</p>
                    <p className="text-white/80">เลือกแล้ว</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-scout-900 rounded-3xl shadow-xl mb-8 border border-gray-200 dark:border-scout-700">
          <div className="flex border-b border-gray-200 dark:border-scout-700">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-8 py-6 font-bold text-lg transition-all ${
                activeTab === 'create'
                  ? 'text-purple-600 dark:text-purple-400 border-b-4 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-scout-800'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <UserPlus size={24} />
                <span>สร้างผู้ใช้ใหม่</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('scouts')}
              className={`flex-1 px-8 py-6 font-bold text-lg transition-all ${
                activeTab === 'scouts'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-4 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-scout-800'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Users size={24} />
                <span>ลูกเสือ</span>
                <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                  {availableScouts.length}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('leaders')}
              className={`flex-1 px-8 py-6 font-bold text-lg transition-all ${
                activeTab === 'leaders'
                  ? 'text-blue-600 dark:text-blue-400 border-b-4 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-scout-800'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Shield size={24} />
                <span>ผู้กำกับ</span>
                <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                  {availableLeaders.length}
                </span>
              </div>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'create' ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-8">
                  <UserPlus size={64} className="text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-400 mb-4">สร้างผู้ใช้ใหม่</h3>
                <p className="text-lg text-gray-400 mb-8">คลิกปุ่ม "สร้างผู้ใช้ใหม่" ด้านบนเพื่อเริ่มสร้างบัญชีผู้ใช้ใหม่</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto"
                >
                  <UserPlus size={20} />
                  สร้างผู้ใช้ใหม่
                </button>
              </div>
            ) : (
              <>
                {/* Search and Filter Section */}
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                  <div className="flex-1 relative">
                    <Search size={24} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`ค้นหา${activeTab === 'scouts' ? 'ชื่อ, รหัส, โรงเรียน...' : 'ชื่อ, อีเมล...'}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 border-2 border-gray-200 dark:border-scout-700 rounded-2xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-scout-500 focus:border-transparent transition-all text-lg"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="px-6 py-4 bg-gray-100 dark:bg-scout-800 hover:bg-gray-200 dark:hover:bg-scout-700 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-3">
                      <Filter size={20} />
                      กรองขั้นสูง
                      <ChevronDown size={16} />
                    </button>
                    
                    <button
                      onClick={() => activeTab === 'scouts' ? refetchScouts() : refetchLeaders()}
                      className="px-6 py-4 bg-gray-100 dark:bg-scout-800 hover:bg-gray-200 dark:hover:bg-scout-700 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-3"
                    >
                      <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                      รีเฟรช
                    </button>
                  </div>
                </div>

                {/* Selected Users Bar */}
                {selectedUsers.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 mb-8 border-2 border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                          <Check size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                            เลือกไว้ {selectedUsers.length} คน
                          </p>
                          <p className="text-emerald-600 dark:text-emerald-400">
                            ลูกเสือ {selectedUsers.filter(id => filteredScouts.some(scout => scout.id === id)).length} คน, 
                            ผู้กำกับ {selectedUsers.filter(id => filteredLeaders.some(leader => leader.id === id)).length} คน
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleAssignUsers}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
                      >
                        <UserPlus size={20} />
                        จัดสรรผู้ใช้ที่เลือก
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Users Grid */}
                <div className="min-h-[400px]">
                  {isLoading ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 border-4 border-scout-200 border-t-scout-700 rounded-full animate-spin mx-auto mb-8"></div>
                      <p className="text-xl text-gray-400">กำลังโหลดข้อมูล...</p>
                    </div>
                  ) : currentData.length === 0 ? (
                    <div className="text-center py-20">
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 ${
                        activeTab === 'scouts' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {activeTab === 'scouts' ? 
                          <UserX size={64} className="text-emerald-500 dark:text-emerald-400" /> :
                          <UserX size={64} className="text-blue-500 dark:text-blue-400" />
                        }
                      </div>
                      <h3 className="text-2xl font-bold text-gray-400 mb-4">
                        {searchTerm ? 'ไม่พบรายชื่อที่ค้นหา' : 'ไม่มีผู้ใช้ที่สามารถจัดสรรได้'}
                      </h3>
                      <p className="text-lg text-gray-400">
                        {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ลองตรวจสอบข้อมูลอีกครั้ง'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {currentData.map(user => (
                        <div
                          key={user.id}
                          className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 cursor-pointer ${
                            selectedUsers.includes(user.id)
                              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-600 shadow-2xl scale-105'
                              : 'bg-white dark:bg-scout-800 border-gray-200 dark:border-scout-700 hover:bg-gray-50 dark:hover:bg-scout-700 hover:shadow-xl hover:scale-102'
                          }`}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="p-6">
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all mb-4 ${
                                selectedUsers.includes(user.id)
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl scale-110'
                                  : activeTab === 'scouts' 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              }`}>
                                {selectedUsers.includes(user.id) ? (
                                  <Check size={32} />
                                ) : activeTab === 'scouts' ? (
                                  user.firstName?.[0] || 'U'
                                ) : (
                                  <Shield size={28} />
                                )}
                              </div>
                              
                              <h3 className="font-bold text-scout-900 dark:text-white truncate mb-2 group-hover:text-scout-700 dark:group-hover:text-scout-200 transition-colors text-lg">
                                {activeTab === 'scouts' ? 
                                  `${user.firstName} ${user.lastName}` : 
                                  user.name
                                }
                              </h3>
                              
                              <div className="space-y-2 text-sm">
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                  {activeTab === 'scouts' ? 
                                    user.scoutCode :
                                    user.username
                                  }
                                </p>
                                <p className="text-gray-500 dark:text-gray-500 truncate">
                                  {activeTab === 'scouts' ? 
                                    user.school :
                                    user.email
                                  }
                                </p>
                              </div>
                            </div>
                            
                            <div className={`absolute top-4 right-4 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                              selectedUsers.includes(user.id)
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-scout-400'
                            }`}>
                              {selectedUsers.includes(user.id) && (
                                <Check size={18} className="text-white" />
                              )}
                            </div>
                          </div>
                          
                          {selectedUsers.includes(user.id) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none rounded-3xl" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', animation: 'fadeIn 0.3s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className="bg-white dark:bg-scout-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Modal Header */}
            <div className="relative p-8 border-b border-gray-200 dark:border-scout-700 bg-gradient-to-br from-purple-100 via-emerald-50 to-blue-100 dark:from-purple-800/50 dark:via-emerald-900/30 dark:to-blue-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-600 flex items-center justify-center shadow-xl">
                    <UserPlus size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-scout-900 dark:text-white">สร้างผู้ใช้ใหม่</h2>
                    <p className="text-scout-600 dark:text-scout-400">กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="w-12 h-12 rounded-xl bg-white/80 dark:bg-scout-800/80 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:bg-white dark:hover:bg-scout-800"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      ประเภทผู้ใช้
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, role: 'SCOUT'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'SCOUT'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-200 dark:border-scout-700 hover:border-gray-300 dark:hover:border-scout-600'
                        }`}
                      >
                        <Users size={24} className="mx-auto mb-2" />
                        <p className="font-semibold">ลูกเสือ</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, role: 'TROOP_LEADER'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'TROOP_LEADER'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-scout-700 hover:border-gray-300 dark:hover:border-scout-600'
                        }`}
                      >
                        <Shield size={24} className="mx-auto mb-2" />
                        <p className="font-semibold">ผู้กำกับ</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      ชื่อผู้ใช้ *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="กรอกชื่อผู้ใช้"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="กรอกชื่อ-นามสกุล"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        รหัสผ่าน *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="กรอกรหัสผ่าน"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        ยืนยันรหัสผ่าน *
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="ยืนยันรหัสผ่าน"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      ค่าย
                    </label>
                    <select
                      value={formData.campId}
                      onChange={(e) => setFormData({...formData, campId: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">เลือกค่าย</option>
                      {camps.map(camp => (
                        <option key={camp.id} value={camp.id}>{camp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column - Role Specific Info */}
                <div className="space-y-6">
                  {formData.role === 'SCOUT' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            ชื่อจริง
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="ชื่อจริง"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            นามสกุล
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="นามสกุล"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          ชื่อเล่น
                        </label>
                        <input
                          type="text"
                          value={formData.nickname}
                          onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="ชื่อเล่น"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          โรงเรียน
                        </label>
                        <input
                          type="text"
                          value={formData.school}
                          onChange={(e) => setFormData({...formData, school: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="โรงเรียน"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          จังหวัด
                        </label>
                        <input
                          type="text"
                          value={formData.province}
                          onChange={(e) => setFormData({...formData, province: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="จังหวัด"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            เบอร์โทรศัพท์
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="เบอร์โทรศัพท์"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            อีเมล
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-scout-700 rounded-xl bg-gray-50 dark:bg-scout-800 text-scout-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="อีเมล"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-8">
                        <Shield size={64} className="text-blue-500 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-400 mb-4">ผู้กำกับ</h3>
                      <p className="text-gray-400">สำหรับผู้กำกับ ใช้เพียงข้อมูลพื้นฐานเท่านั้น</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-scout-800 hover:bg-gray-200 dark:hover:bg-scout-700 transition-all border-2 border-gray-200 dark:border-scout-600"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreateUser}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  <UserPlus size={20} />
                  สร้างผู้ใช้ใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { 
          from { opacity: 0 } 
          to { opacity: 1 } 
        }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(60px) scale(0.95) } 
          to { opacity: 1; transform: translateY(0) scale(1) } 
        }
        .scale-101 { transform: scale(1.01); }
        .scale-102 { transform: scale(1.02); }
        .scale-105 { transform: scale(1.05); }
      `}</style>
    </div>
  )
}
