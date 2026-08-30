'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate: string
  totalMarks: number
  subject: { name: string; code: string }
  class: { name: string; section?: string }
  classId: string
  _count?: { submissions: number }
}

interface SubmissionStatus {
  [assignmentId: string]: boolean
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [studentClassId, setStudentClassId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissionStatuses, setSubmissionStatuses] = useState<SubmissionStatus>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitData, setSubmitData] = useState({ content: '', submissionUrl: '', studentName: '', className: '', admissionNo: '' })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: '',
    totalMarks: 100
  })

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchRole()
    fetchAssignments()
    fetchSubjects()
    fetchClasses()
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (role === 'STUDENT' && assignments.length > 0) {
      fetchSubmissionStatuses()
    }
  }, [role, assignments, status])

  const fetchRole = async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      const data = await res.json()
      setRole(data.role || '')
      if (data.role === 'STUDENT') {
        if (data.student?.classId) setStudentClassId(data.student.classId)
        setSubmitData(prev => ({
          ...prev,
          studentName: data.name || '',
          className: data.student?.class?.name ? data.student.class.name + (data.student.class.section ? ` - ${data.student.class.section}` : '') : '',
          admissionNo: data.student?.admissionNo || '',
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assignments', { cache: 'no-store' })
      if (!res.ok) { setAssignments([]); return }
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects', { cache: 'no-store' })
      if (!res.ok) { setSubjects([]); return }
      const data = await res.json()
      setSubjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes', { cache: 'no-store' })
      if (!res.ok) { setClasses([]); return }
      const data = await res.json()
      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchSubmissionStatuses = async () => {
    try {
      const statuses: SubmissionStatus = {}
      for (const assignment of assignments) {
        const res = await fetch(`/api/submissions?assignmentId=${assignment.id}`, { cache: 'no-store' })
        const data = await res.json()
        statuses[assignment.id] = data.submitted || false
      }
      setSubmissionStatuses(statuses)
    } catch (error) {
      console.error('Error fetching submission statuses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchAssignments()
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    try {
      await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' })
      fetchAssignments()
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
  }

  const openSubmitModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setSubmitData(prev => ({ ...prev, content: '', submissionUrl: '' }))
    setShowSubmitModal(true)
  }

  const handleSubmission = async () => {
    if (!selectedAssignment) return
    if (!submitData.studentName || !submitData.className || !submitData.admissionNo) {
      alert('Please fill in your name, class and admission number')
      return
    }
    if (!submitData.content && !submitData.submissionUrl) {
      alert('Please provide content or a submission URL')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          content: submitData.content || null,
          submissionUrl: submitData.submissionUrl || null,
          studentName: submitData.studentName,
          className: submitData.className,
          admissionNo: submitData.admissionNo,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to submit')
        return
      }

      setShowSubmitModal(false)
      setSelectedAssignment(null)
      setSubmissionStatuses(prev => ({ ...prev, [selectedAssignment.id]: true }))
    } catch (error) {
      console.error('Error submitting assignment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      classId: '',
      dueDate: '',
      totalMarks: 100
    })
  }

  const filteredAssignments = role === 'STUDENT' && studentClassId
    ? assignments.filter(a => a.classId === studentClassId)
    : assignments

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
            <p className="text-gray-500">
              {role === 'STUDENT' ? 'View and submit your assignments' : 'Create and manage assignments'}
            </p>
          </div>
          {role !== 'STUDENT' && (
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
            >
              + New Assignment
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                {role !== 'STUDENT' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {role === 'STUDENT' ? 'Status' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={role === 'STUDENT' ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={role === 'STUDENT' ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                    No assignments found
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{assignment.title}</div>
                      {assignment.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{assignment.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {assignment.subject?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {assignment.class?.name || 'N/A'}{assignment.class?.section ? ` - ${assignment.class.section}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      <span className={isOverdue(assignment.dueDate) ? 'text-red-600 font-medium' : ''}>
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {assignment.totalMarks}
                    </td>
                    {role !== 'STUDENT' && (
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {assignment._count?.submissions || 0}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {role === 'STUDENT' ? (
                        submissionStatuses[assignment.id] ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                            Submitted
                          </span>
                        ) : isOverdue(assignment.dueDate) ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                            Overdue
                          </span>
                        ) : (
                          <button
                            onClick={() => openSubmitModal(assignment)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                          >
                            Submit
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">New Assignment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject: any) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-blue-700 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSubmitModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold mb-2">Submit Assignment</h2>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">{selectedAssignment.title}</p>
                  <p className="text-sm text-gray-500">{selectedAssignment.subject?.name || 'N/A'} | Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                  {selectedAssignment.description && (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{selectedAssignment.description}</p>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={submitData.studentName}
                      onChange={(e) => setSubmitData({ ...submitData, studentName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission No *</label>
                    <input
                      type="text"
                      value={submitData.admissionNo}
                      onChange={(e) => setSubmitData({ ...submitData, admissionNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                      placeholder="e.g. 2024/001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <input
                    type="text"
                    value={submitData.className}
                    onChange={(e) => setSubmitData({ ...submitData, className: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="e.g. JSS 1 - A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer *</label>
                  <textarea
                    value={submitData.content}
                    onChange={(e) => setSubmitData({ ...submitData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    rows={8}
                    placeholder="Type your answer here..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission URL (optional)</label>
                  <input
                    type="url"
                    value={submitData.submissionUrl}
                    onChange={(e) => setSubmitData({ ...submitData, submissionUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false)
                    setSelectedAssignment(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmission}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
