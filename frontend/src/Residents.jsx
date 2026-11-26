import { useState } from 'react'
import { api, qs, useFetch } from '../api'
import '../styles/profile.css'
import { Avatar, Empty, Err, Field, Flag, PARENT_TYPES, TYPES, bind, d10, today } from './ui'

function ResidentForm({ initial, onDone, onCancel }) {
  const [f, setF] = useState(initial ? { ...initial, birthdate: d10(initial.birthdate) } : { name: '', type: 'adult', birthdate: '', address: '', contact: '', is4Ps: false })
  const [error, setError] = useState('')
  const set = bind(f, setF)
  const submit = async (e) => {
    e.preventDefault()
    try {
      await api(initial ? `/residents/${initial._id}` : '/residents', { method: initial ? 'PUT' : 'POST', body: f })
      onDone()
    } catch (err) { setError(err.message) }
  }
  return (
    <form className="card" onSubmit={submit}>
      <h3>{initial ? 'Update resident' : 'Add resident'}</h3>
      <div className="grid">
        <Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Category">
          <select value={f.type} onChange={set('type')}>{Object.entries(PARENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </Field>
        <Field label={f.type === 'pregnant' ? 'Expected due date' : 'Birthdate'}><input type="date" required value={f.birthdate} onChange={set('birthdate')} /></Field>
        <Field label="Address / Purok"><input value={f.address || ''} onChange={set('address')} /></Field>
        <Field label="Contact"><input value={f.contact || ''} onChange={set('contact')} /></Field>
        <Field label="4Ps member">
          <select value={f.is4Ps ? 'YES' : 'NO'} onChange={(e) => setF({ ...f, is4Ps: e.target.value === 'YES' })}><option>NO</option><option>YES</option></select>
        </Field>
      </div>
      <Err msg={error} />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn">Save resident</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export function Records({ resident, child, onChange }) {
  const subject = child ?? resident // the child, or the parent when no child is given
  const blank = { date: today(), weight: '', height: '', bp: '', condition: '', medication: '', notes: '' }
  const [draft, setDraft] = useState(blank)
  const [error, setError] = useState('')
  const set = bind(draft, setDraft)
  const base = child ? `/residents/${resident._id}/children/${child._id}/records` : `/residents/${resident._id}/records`
  const run = async (path, method, body) => {
    try { await api(path, { method, body }); setError(''); setDraft(blank); onChange() } catch (err) { setError(err.message) }
  }
  const save = (e) => { e.preventDefault(); draft._id ? run(`${base}/${draft._id}`, 'PUT', draft) : run(base, 'POST', draft) }
  return (
    <div className="card">
      <h3>Health records — {subject.name} <Flag r={resident} /></h3>
      <form onSubmit={save}>
        <div className="grid">
          <Field label="Date"><input type="date" required value={d10(draft.date)} onChange={set('date')} /></Field>
          <Field label="Weight (kg)"><input type="number" step="0.1" min="0" value={draft.weight ?? ''} onChange={set('weight')} /></Field>
          <Field label="Height (cm)"><input type="number" step="0.1" min="0" value={draft.height ?? ''} onChange={set('height')} /></Field>
          {!child && resident.type === 'pregnant' && <Field label="Blood pressure"><input placeholder="110/70" value={draft.bp || ''} onChange={set('bp')} /></Field>}
          <Field label="Health condition"><input value={draft.condition || ''} onChange={set('condition')} /></Field>
          <Field label="Maintenance medication"><input value={draft.medication || ''} onChange={set('medication')} /></Field>
          <Field label="Notes"><input value={draft.notes || ''} onChange={set('notes')} /></Field>
        </div>
        <Err msg={error} />
        <div className="row" style={{ margin: '12px 0' }}>
          <button className="btn">{draft._id ? 'Update record' : 'Add record'}</button>
          {draft._id && <button type="button" className="btn ghost" onClick={() => setDraft(blank)}>Cancel edit</button>}
        </div>
      </form>
      {subject.records.length === 0 ? <Empty>No records yet.</Empty> : (
        <ul className="list">
          {subject.records.map((r) => (
            <li key={r._id}>
              <div>
                <b>{d10(r.date)}</b>
                <div className="muted">{[r.weight && `${r.weight} kg`, r.height && `${r.height} cm`, r.bp && `BP ${r.bp}`, r.condition, r.medication && `Meds: ${r.medication}`, r.notes].filter(Boolean).join(' · ') || '—'}</div>
              </div>
              <div className="row">
                <button className="btn ghost sm" onClick={() => setDraft(r)}>Edit</button>
                <button className="btn danger sm" onClick={() => confirm('Delete this record?') && run(`${base}/${r._id}`, 'DELETE')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Staff view of one family: the children under this profile, and the health records of the parent or any child.
function Family({ resident, onChange }) {
  const [who, setWho] = useState('self')
  const [child, setChild] = useState({ name: '', birthdate: '' })
  const [error, setError] = useState('')
  const set = bind(child, setChild)
  const kid = resident.children.find((c) => c._id === who) ?? null
  const run = async (fn) => { try { await fn(); setError(''); onChange() } catch (e) { setError(e.message) } }
  const add = (e) => { e.preventDefault(); run(async () => { await api(`/residents/${resident._id}/children`, { method: 'POST', body: child }); setChild({ name: '', birthdate: '' }) }) }
  const remove = (c) => confirm(`Remove ${c.name}? Their health records will be deleted.`) && run(async () => { await api(`/residents/${resident._id}/children/${c._id}`, { method: 'DELETE' }); if (who === c._id) setWho('self') })
  return (
    <>
      <div className="card">
        <h3>Children of {resident.name}</h3>
        {resident.children.length === 0 ? <Empty>No children listed.</Empty> : (
          <ul className="list">
            {resident.children.map((c) => (
              <li key={c._id} data-type="child">
                <div><Avatar name={c.name} tone="child" /><b>{c.name}</b><div className="muted">Born {d10(c.birthdate)} · {c.records.length} records</div></div>
                <div className="row">
                  <button className="btn ghost sm" onClick={() => setWho(c._id)}>Health records</button>
                  <button className="btn danger sm" onClick={() => remove(c)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form className="kid-edit" onSubmit={add}>
          <Field label="Add a child — name"><input required value={child.name} onChange={set('name')} /></Field>
          <Field label="Birthdate"><input type="date" required value={child.birthdate} onChange={set('birthdate')} /></Field>
          <button className="btn sm">Add child</button>
        </form>
        <Err msg={error} />
      </div>
      <div className="roles" role="group" aria-label="Whose records">
        <button type="button" className={who === 'self' ? 'active' : ''} onClick={() => setWho('self')}>{resident.name}</button>
        {resident.children.map((c) => <button type="button" key={c._id} className={who === c._id ? 'active' : ''} onClick={() => setWho(c._id)}>{c.name}</button>)}
      </div>
      <Records key={who} resident={resident} child={kid} onChange={onChange} />
    </>
  )
}

export default function Residents({ user }) {
  const isResident = user.role === 'resident'
  const [f, setF] = useState({ q: '', type: '', is4Ps: '' })
  const set = bind(f, setF)
  const { data, error, reload } = useFetch('/residents' + qs(f))
  const [editing, setEditing] = useState(null) // 'new' | resident
  const [openId, setOpenId] = useState(null)
  const [msg, setMsg] = useState('')
  const open = data?.find((r) => r._id === openId)
  const remove = async (id) => {
    if (!confirm('Delete this resident and their schedules and vaccine requests?')) return
    try { await api(`/residents/${id}`, { method: 'DELETE' }); reload() } catch (e) { setMsg(e.message) }
  }
  return (
    <>
      <div className="row between">
        <h2>{isResident ? 'My profiles' : 'Residents'}</h2>
        <button className="btn" onClick={() => setEditing('new')}>Add resident</button>
      </div>
      {editing && <ResidentForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload() }} />}
      <div className="card filters">
        <input type="search" placeholder="Search name or resident ID" value={f.q} onChange={set('q')} />
        <select value={f.type} onChange={set('type')}><option value="">All categories</option>{Object.entries(PARENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.is4Ps} onChange={set('is4Ps')}><option value="">4Ps: all</option><option value="true">4Ps members</option><option value="false">Non-members</option></select>
      </div>
      <Err msg={error || msg} />
      <div className="card">
        {!data ? <Empty>Loading…</Empty> : data.length === 0 ? <Empty>No residents found.</Empty> : (
          <ul className="list">
            {data.map((r) => (
              <li key={r._id} data-type={r.type}>
                <div>
                  <Avatar name={r.name} tone={r.type} /><b>{r.name}</b><span className={`badge t-${r.type}`}>{TYPES[r.type]}</span><Flag r={r} />
                  <div className="muted">{r.residentId} · {r.type === 'pregnant' ? 'Due' : 'Born'} {d10(r.birthdate)}{r.address && ` · ${r.address}`} · {r.records.length} records · {r.children.length} {r.children.length === 1 ? 'child' : 'children'}</div>
                </div>
                <div className="row">
                  <button className="btn sm" onClick={() => setOpenId(r._id)}>Family &amp; records</button>
                  <button className="btn ghost sm" onClick={() => setEditing(r)}>Edit</button>
                  <button className="btn danger sm" onClick={() => remove(r._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && <Family key={open._id} resident={open} onChange={reload} />}
    </>
  )
}
