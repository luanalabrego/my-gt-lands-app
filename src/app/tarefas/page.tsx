// src/app/tarefas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Task = {
  id: string
  description: string
  status: 'pending' | 'inProgress' | 'done'
  priority: 'low' | 'medium' | 'high'
  date: string // ISO yyyy-MM-dd
}

export default function TasksPage() {
  const { t } = useTranslation()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // filters
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'inProgress'|'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all'|'low'|'medium'|'high'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')        // yyyy-MM-dd
  const [dateObj, setDateObj]     = useState<Date|null>(null)

  useEffect(() => {
    // TODO: replace with real API call
    const fake: Task[] = [
      { id:'1', description:'Follow up com cliente', status:'inProgress',  priority:'medium', date:'2025-04-25' },
      { id:'2', description:'Enviar contrato Imob Gabriel', status:'pending', priority:'high',   date:'2025-04-29' },
    ]
    setTasks(fake)
    setLoading(false)
  }, [])

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (dateFilter) {
      if (t.date !== dateFilter) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center text-white">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1F1F1F] px-6 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('tasks')}</h1>
        <Link
          href="/tarefas/new"
          className="bg-gold text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
        >
          + {t('addTask')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-[#2C2C2C] rounded-lg p-3 flex flex-col">
          <label className="text-xs text-gray-300 mb-1">{t('status')}</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-black border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="all">{t('all')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="inProgress">{t('inProgress')}</option>
            <option value="done">{t('done')}</option>
          </select>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-3 flex flex-col">
          <label className="text-xs text-gray-300 mb-1">{t('priority')}</label>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="bg-black border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="all">{t('all')}</option>
            <option value="low">{t('low')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="high">{t('high')}</option>
          </select>
        </div>
        <div className="bg-[#2C2C2C] rounded-lg p-3 flex flex-col">
          <label className="text-xs text-gray-300 mb-1">{t('date')}</label>
          <DatePicker
            selected={dateObj}
            onChange={d => {
              setDateObj(d)
              setDateFilter(d ? d.toISOString().slice(0,10) : '')
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="yyyy-MM-dd"
            className="bg-black border border-gray-600 rounded px-2 py-1 text-white w-32"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-[#2C2C2C] rounded-2xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#1F1F1F]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t('task')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t('status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t('priority')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t('date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.map((task, i) => (
              <tr key={task.id}>
                <td className="px-4 py-3 text-sm text-white">{task.description}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'done'
                        ? 'bg-green-500 text-black'
                        : task.status === 'inProgress'
                        ? 'bg-gold text-black'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {t(task.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{t(task.priority)}</td>
                <td className="px-4 py-3 text-sm text-white">{task.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  {t('noTasks')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
