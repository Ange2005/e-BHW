import { useState } from 'react'
import { api, qs, useFetch } from '../api'
import { Empty, Err, Field, Flag, bind, d10, today } from './ui'

const CATEGORIES = { vaccination: "Children's vaccination", prenatal: 'Prenatal checkup', '4ps': '4Ps checkup', checkup: 'General checkup' }
const STATUSES = ['Scheduled', 'Completed', 'Cancelled']

function ScheduleForm({ initial, residents, onDone, onCancel, category }) {
  const [f, setF] = useState(initial ? { ...initial, resident: initial.resident._id, child: initial.child?._id ?? '', date: d10(initial.date) } : { resident: '', child: '', category: category || 'checkup', service: '', date: today(), time: '08:00', location: '', remarks: '' })
  const [error, setError] = useState('')
  const set = bind(f, setF)
  const submit = async (e) => {
    e.preventDefault()
    try { await api(initial ? `/schedules/${initial._id}` : '/schedules', { method: initial ? 'PUT' : 'POST', body: { ...f, child: f.category === 'prenatal' || f.category === '4ps' ? '' : f.child, service: category ? (initial?.service || CATEGORIES[f.category]) : f.service, remarks: category ? (initial?.remarks || '') : f.remarks } }); onDone() } catch (err) { setError(err.message) }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h3>{initial ? 'Edit schedule' : 'Add schedule'}</h3>
      <div className="grid">
        <Field label="Resident"><select required value={f.resident} onChange={(e) => setF({ ...f, resident: e.target.value, child: '' })}><option value="">Select…</option>{residents.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.residentId})</option>)}</select></Field>
        {(f.category === 'vaccination' || !category) && (<Field label={category ? 'Child name' : 'For'}><select required={category === 'vaccination'} value={f.child} onChange={set('child')}><option value="">{category ? 'Select child…' : 'The resident'}</option>{(residents.find((r) => String(r._id) === String(f.resident))?.children ?? []).map((c) => <option key={c._id} value={c._id}>{c.name} (child)</option>)}</select></Field>)}
        <Field label="Type"><select disabled={!!category} value={f.category} onChange={set('category')}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        {!category && <Field label="Service details"><input required value={f.service} onChange={set('service')} /></Field>}
        <Field label="Date"><input type="date" required value={f.date} onChange={set('date')} /></Field>
        <Field label="Time"><input type="time" required value={f.time} onChange={set('time')} /></Field>
        <Field label="Location"><input required value={f.location} onChange={set('location')} /></Field>
        {!category && <Field label="Remarks"><input value={f.remarks || ''} onChange={set('remarks')} /></Field>}
      </div>
      <Err msg={error} />
      <div className="row" style={{ marginTop: 12 }}><button className="btn">Save schedule</button><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

export default function Schedules({ user, category }) {
  const staff = user.role !== 'resident'
  const [f, setF] = useState({ q: '', date: '', category: category || '', status: '' })
  const set = bind(f, setF)
  const { data, error, reload } = useFetch('/schedules' + qs(f))
  const { data: residents } = useFetch('/residents')
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')
  const run = async (fn) => { try { await fn(); setMsg(''); reload() } catch (e) { setMsg(e.message) } }
  const changeStatus = (s, status) => confirm(`Change status to ${status}?`) && run(() => api(`/schedules/${s._id}`, { method: 'PUT', body: { status } }))
  return (
    <>
      <div className="row between">
        <h2>{CATEGORIES[category] || "Schedules"}</h2>
        {staff && <button className="btn" onClick={() => setEditing('new')}>Add schedule</button>}
      </div>
      {editing && <ScheduleForm category={category} initial={editing === 'new' ? null : editing} residents={residents || []} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload() }} />}
      <div className="card filters">
        {staff && <input type="search" placeholder="Search name or resident ID" value={f.q} onChange={set('q')} />}
        <input type="date" value={f.date} onChange={set('date')} aria-label="Filter by date" />
        <select disabled={!!category} value={f.category} onChange={set('category')}><option value="">All types</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.status} onChange={set('status')}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <Err msg={error || msg} />
      <div className="card">
        {!data ? <Empty>Loading…</Empty> : data.length === 0 ? <Empty>No schedules found.</Empty> : (
          <ul className="list">
            {data.map((s) => (
              <li key={s._id} data-status={s.status}>
                <div className={s.status === 'Cancelled' ? 'done' : ''}>
                  <b>{s.child ? s.child.name : s.resident?.name}</b>{s.child && <span className="muted"> child of {s.resident?.name}</span>} <Flag r={s.resident} /><span className={`badge c-${s.category}`}>{CATEGORIES[s.category]}</span>
                  <div className="muted">{d10(s.date)} {s.time} · {s.location}{s.category !== 'prenatal' && <> · {s.service}{s.remarks && ` · ${s.remarks}`}</>}</div>
                </div>
                <div className="row">
                  {staff ? (
                    <>
                      <select style={{ width: 'auto' }} value={s.status} onChange={(e) => changeStatus(s, e.target.value)} aria-label="Status">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                      <button className="btn ghost sm" onClick={() => setEditing(s)}>Edit</button>
                      <button className="btn danger sm" onClick={() => confirm('Delete this schedule?') && run(() => api(`/schedules/${s._id}`, { method: 'DELETE' }))}>Delete</button>
                    </>
                  ) : <span className={`badge s-${s.status}`}>{s.status}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
