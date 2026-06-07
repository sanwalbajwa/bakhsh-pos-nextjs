'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { Stethoscope, Users, FileText, Calendar, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const emptyPatient = { name: '', phone: '', age: '', gender: '', address: '', allergies: '', notes: '' }
const emptyPrescription = {
    patientId: '',
    diagnosis: '',
    instructions: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
}
const emptyAppointment = { patientId: '', scheduledAt: '', reason: '' }

export default function DoctorPage() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const { getAccessToken } = useAuth()

    const [patients, setPatients] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [patientForm, setPatientForm] = useState(emptyPatient)
    const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescription)
    const [appointmentForm, setAppointmentForm] = useState(emptyAppointment)
    const [saving, setSaving] = useState(false)

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: Stethoscope },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
    ]

    const apiRequest = useCallback(async (url, options = {}) => {
        const token = await getAccessToken()
        if (!token) throw new Error('Authentication required')

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
            cache: 'no-store',
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.success === false) {
            throw new Error(payload?.error || 'Request failed')
        }
        return payload
    }, [getAccessToken])

    const fetchCareData = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const [patientsPayload, prescriptionsPayload, appointmentsPayload] = await Promise.all([
                apiRequest('/api/patients'),
                apiRequest('/api/prescriptions'),
                apiRequest('/api/appointments'),
            ])
            setPatients(patientsPayload?.data || [])
            setPrescriptions(prescriptionsPayload?.data || [])
            setAppointments(appointmentsPayload?.data || [])
        } catch (err) {
            setError(err.message || 'Failed to load doctor workspace')
        } finally {
            setLoading(false)
        }
    }, [apiRequest])

    useEffect(() => {
        fetchCareData()
    }, [fetchCareData])

    const todayAppointments = useMemo(() => appointments.filter((appointment) => {
        if (!appointment.scheduled_at) return false
        return new Date(appointment.scheduled_at).toDateString() === new Date().toDateString()
    }), [appointments])

    const pendingPrescriptions = prescriptions.filter((item) => item.status !== 'dispensed')

    const handlePatientSubmit = async (event) => {
        event.preventDefault()
        try {
            setSaving(true)
            setError('')
            await apiRequest('/api/patients', {
                method: 'POST',
                body: JSON.stringify(patientForm),
            })
            setPatientForm(emptyPatient)
            await fetchCareData()
        } catch (err) {
            setError(err.message || 'Failed to save patient')
        } finally {
            setSaving(false)
        }
    }

    const handlePrescriptionSubmit = async (event) => {
        event.preventDefault()
        try {
            setSaving(true)
            setError('')
            await apiRequest('/api/prescriptions', {
                method: 'POST',
                body: JSON.stringify(prescriptionForm),
            })
            setPrescriptionForm(emptyPrescription)
            await fetchCareData()
        } catch (err) {
            setError(err.message || 'Failed to save prescription')
        } finally {
            setSaving(false)
        }
    }

    const handleAppointmentSubmit = async (event) => {
        event.preventDefault()
        try {
            setSaving(true)
            setError('')
            await apiRequest('/api/appointments', {
                method: 'POST',
                body: JSON.stringify(appointmentForm),
            })
            setAppointmentForm(emptyAppointment)
            await fetchCareData()
        } catch (err) {
            setError(err.message || 'Failed to save appointment')
        } finally {
            setSaving(false)
        }
    }

    const updateMedicine = (index, key, value) => {
        setPrescriptionForm((prev) => ({
            ...prev,
            medicines: prev.medicines.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [key]: value } : item
            )),
        }))
    }

    const addMedicineLine = () => {
        setPrescriptionForm((prev) => ({
            ...prev,
            medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }],
        }))
    }

    const StatCard = ({ title, value, subtext, color }) => (
        <div className={`rounded-lg p-6 border ${color}`}>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </div>
    )

    return (
        <ProtectedRoute allowedRoles={['doctor']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                            <p className="text-gray-600 mt-1">Manage patients, prescriptions, and appointments</p>
                        </div>
                        <button
                            onClick={fetchCareData}
                            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-gray-200 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${
                                        isActive ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : activeTab === 'dashboard' ? (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <StatCard title="Total Patients" value={patients.length} subtext="Registered" color="bg-blue-50 border-blue-100" />
                                    <StatCard title="Today&apos;s Appointments" value={todayAppointments.length} subtext="Scheduled" color="bg-green-50 border-green-100" />
                                    <StatCard title="Pending Prescriptions" value={pendingPrescriptions.length} subtext="Awaiting dispensing" color="bg-orange-50 border-orange-100" />
                                    <StatCard title="Active Cases" value={prescriptions.length} subtext="Prescriptions issued" color="bg-purple-50 border-purple-100" />
                                </div>
                            </div>
                        ) : activeTab === 'patients' ? (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Patient Records</h2>
                                <form onSubmit={handlePatientSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <input value={patientForm.name} onChange={(e) => setPatientForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Patient name" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <input value={patientForm.phone} onChange={(e) => setPatientForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <input type="number" value={patientForm.age} onChange={(e) => setPatientForm((prev) => ({ ...prev, age: e.target.value }))} placeholder="Age" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <select value={patientForm.gender} onChange={(e) => setPatientForm((prev) => ({ ...prev, gender: e.target.value }))} className="px-3 py-2.5 border border-gray-300 rounded-lg">
                                        <option value="">Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <input value={patientForm.allergies} onChange={(e) => setPatientForm((prev) => ({ ...prev, allergies: e.target.value }))} placeholder="Allergies" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <input value={patientForm.address} onChange={(e) => setPatientForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Address" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <textarea value={patientForm.notes} onChange={(e) => setPatientForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Clinical notes" className="md:col-span-2 px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <button disabled={saving} className="px-4 py-2.5 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                                        <Plus className="w-4 h-4" />
                                        Add Patient
                                    </button>
                                </form>

                                <RecordsTable
                                    columns={['Name', 'Phone', 'Age', 'Gender', 'Allergies']}
                                    rows={patients.map((patient) => [patient.name, patient.phone, patient.age || '-', patient.gender || '-', patient.allergies || '-'])}
                                    emptyText="No patients registered yet"
                                />
                            </div>
                        ) : activeTab === 'prescriptions' ? (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Prescription Writer</h2>
                                <form onSubmit={handlePrescriptionSubmit} className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <select value={prescriptionForm.patientId} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, patientId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg">
                                        <option value="">Select patient</option>
                                        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} ({patient.phone})</option>)}
                                    </select>
                                    <input value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, diagnosis: e.target.value }))} placeholder="Diagnosis" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <div className="space-y-3">
                                        {prescriptionForm.medicines.map((medicine, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <input value={medicine.name} onChange={(e) => updateMedicine(index, 'name', e.target.value)} placeholder="Medicine" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                                <input value={medicine.dosage} onChange={(e) => updateMedicine(index, 'dosage', e.target.value)} placeholder="Dosage" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                                <input value={medicine.frequency} onChange={(e) => updateMedicine(index, 'frequency', e.target.value)} placeholder="Frequency" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                                <input value={medicine.duration} onChange={(e) => updateMedicine(index, 'duration', e.target.value)} placeholder="Duration" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                            </div>
                                        ))}
                                        <button type="button" onClick={addMedicineLine} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white">Add medicine line</button>
                                    </div>
                                    <textarea value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, instructions: e.target.value }))} placeholder="Instructions" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <button disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-60">Issue Prescription</button>
                                </form>

                                <RecordsTable
                                    columns={['Patient', 'Diagnosis', 'Medicines', 'Status', 'Date']}
                                    rows={prescriptions.map((item) => [
                                        item.patients?.name || 'Patient',
                                        item.diagnosis || '-',
                                        `${Array.isArray(item.medicines) ? item.medicines.length : 0} item(s)`,
                                        item.status || 'issued',
                                        item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
                                    ])}
                                    emptyText="No prescriptions issued yet"
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Appointment Calendar</h2>
                                <form onSubmit={handleAppointmentSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <select value={appointmentForm.patientId} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, patientId: e.target.value }))} className="px-3 py-2.5 border border-gray-300 rounded-lg">
                                        <option value="">Select patient</option>
                                        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} ({patient.phone})</option>)}
                                    </select>
                                    <input type="datetime-local" value={appointmentForm.scheduledAt} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, scheduledAt: e.target.value }))} className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <input value={appointmentForm.reason} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Reason" className="px-3 py-2.5 border border-gray-300 rounded-lg" />
                                    <button disabled={saving} className="px-4 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-60">Schedule</button>
                                </form>

                                <RecordsTable
                                    columns={['Date/Time', 'Patient', 'Reason', 'Status']}
                                    rows={appointments.map((item) => [
                                        item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '-',
                                        item.patients?.name || 'Patient',
                                        item.reason || '-',
                                        item.status || 'scheduled',
                                    ])}
                                    emptyText="No appointments scheduled"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function RecordsTable({ columns, rows, emptyText }) {
    if (rows.length === 0) {
        return (
            <div className="text-center py-12 border border-gray-200 rounded-lg">
                <p className="text-gray-500">{emptyText}</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        {columns.map((column) => (
                            <th key={column} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
