import { useState } from 'react'
import { api, useFetch } from '../api'
import '../styles/profile.css'
import { Records } from './Residents'
import { Avatar, Empty, Err, Field, YesNo, bind, d10 } from './ui'

const ageMonths = (iso) => {
  if (!iso) return null
  const b = new Date(iso), n = new Date()
  let months = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth()
  if (n.getDate() < b.getDate()) months--
  return Number.isFinite(months) && months >= 0 ? months : null
}
const age = (iso) => { const m = ageMonths(iso); return m === null ? 'Age unavailable' : m < 24 ? `${m} mo` : `${Math.floor(m / 12)} yrs` }
const category = (iso) => { const m = ageMonths(iso); return m === null ? 'Unknown' : m < 12 ? 'Infant' : m < 216 ? 'Child' : 'Adult offspring' }
const Status = ({ yes, positive, negative }) => <span className={`profile-status ${yes ? 'positive' : 'neutral'}`}>{yes ? positive : negative}</span>
const Info = ({ label, children }) => <div className="info-item"><dt>{label}</dt><dd>{children || '—'}</dd></div>

// Edit your own details, change status (pregnant / 4Ps) and add or remove children.
function ProfileEditor({ self, kids, onDone, onCancel }) {
  const [f, setF] = useState({
    name: self?.name ?? '', contact: self?.contact ?? '', address: self?.address ?? '',
    pregnant: self?.type === 'pregnant' ? 'yes' : 'no',
    dueDate: self?.type === 'pregnant' ? d10(self.birthdate) : '',
    birthdate: self?.type === 'adult' ? d10(self.birthdate) : '',
    is4Ps: self?.is4Ps ? 'yes' : 'no',
  })
  const [children, setChildren] = useState(kids.map((c) => ({ id: c._id, name: c.name, birthdate: d10(c.birthdate) })))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = bind(f, setF)
  const setChild = (i, k) => (e) => setChildren(children.map((c, j) => (j === i ? { ...c, [k]: e.target.value } : c)))
  const removed = kids.filter((k) => !children.some((c) => c.id === k._id))

  const submit = async (e) => {
    e.preventDefault()
    if (removed.length && !confirm(`Remove ${removed.map((r) => r.name).join(', ')}? Their health records will be deleted.`)) return
    setSaving(true)
    try {
      const pregnant = f.pregnant === 'yes'
      // 4Ps is on the parent's profile, so it covers the whole household
      const me = { name: f.name, contact: f.contact, address: f.address, type: pregnant ? 'pregnant' : 'adult', birthdate: pregnant ? f.dueDate : f.birthdate }
      const saved = await (self ? api(`/residents/${self._id}`, { method: 'PUT', body: me }) : api('/residents', { method: 'POST', body: me }))
      const base = `/residents/${saved._id ?? saved.id}/children`
      for (const r of removed) await api(`${base}/${r._id}`, { method: 'DELETE' })
      for (const c of children) {
        const body = { name: c.name, birthdate: c.birthdate }
        await (c.id ? api(`${base}/${c.id}`, { method: 'PUT', body }) : api(base, { method: 'POST', body }))
      }
      onDone()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit}>
      <section className="card">
        <h3>Personal information</h3>
        <div className="grid">
          <Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Contact number"><input value={f.contact} onChange={set('contact')} /></Field>
          <Field label="Sitio / Purok"><input required value={f.address} onChange={set('address')} /></Field>
        </div>
      </section>
      <section className="card">
        <h3>My status</h3>
        <div className="grid">
          <YesNo label="Are you pregnant?" value={f.pregnant} onChange={(v) => setF({ ...f, pregnant: v })} />
          {f.pregnant === 'yes'
            ? <Field label="Expected due date"><input type="date" required value={f.dueDate} onChange={set('dueDate')} /></Field>
            : <Field label="Your birthdate"><input type="date" required value={f.birthdate} onChange={set('birthdate')} /></Field>}
          <Field label="4Ps membership"><input readOnly value={f.is4Ps === 'yes' ? 'Yes' : 'No'} /></Field>
        </div>
        <p className="muted">Contact your BHW to correct your 4Ps membership status.</p>
      </section>
      <section className="card">
        <h3>Children</h3>
        {children.length === 0 && <p className="muted">No children listed.</p>}
        {children.map((c, i) => (
          <div className="kid-edit" key={c.id ?? `new-${i}`}>
            <Field label={`Child ${i + 1} name`}><input required value={c.name} onChange={setChild(i, 'name')} /></Field>
            <Field label="Birthdate"><input type="date" required value={c.birthdate} onChange={setChild(i, 'birthdate')} /></Field>
            <button type="button" className="btn danger sm" onClick={() => setChildren(children.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn ghost sm" onClick={() => setChildren([...children, { name: '', birthdate: '' }])}>+ Add child</button>
      </section>
      <Err msg={error} />
      <div className="row">
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default function MyProfile({ user }) {
  const { data, error, reload } = useFetch('/residents') // the server only returns this account's own profiles
  const [editing, setEditing] = useState(false)
  const [openId, setOpenId] = useState(null)
  if (error) return <Err msg={error} />
  if (!data) return <Empty>Loading…</Empty>

  const normalize = (r) => ({ ...r, _id: r._id ?? r.id, records: (r.records ?? []).map(x => ({ ...x, _id: x._id ?? x.id })) })
  const self = data[0] ? { ...normalize(data[0]), children: (data[0].children ?? []).map(normalize) } : null
  const kids = self?.children ?? []
  const infants = kids.filter(k => category(k.birthdate) === 'Infant').length
  const children = kids.filter(k => category(k.birthdate) === 'Child').length
  const unknown = kids.some(k => category(k.birthdate) === 'Unknown')
  const openKid = kids.find((k) => k._id === openId) ?? null
  const done = () => { setEditing(false); reload() }
  const showRecords = (id) => { setOpenId(id); setTimeout(() => document.getElementById('records-panel')?.scrollIntoView({ behavior: 'smooth' }), 50) }

  if (editing || !self) {
    return (
      <>
        <h2>{self ? 'Edit profile' : 'Set up your profile'}</h2>
        <p className="sub">Update your details, your status, and your children.</p>
        <ProfileEditor self={self} kids={kids} onDone={done} onCancel={self ? () => setEditing(false) : undefined} />
      </>
    )
  }

  return (
    <>
      <div className="row between">
        <div><h2>My Profile</h2><p className="sub">View and update your resident and family information.</p></div>
        <button className="btn" onClick={() => setEditing(true)}>Edit profile</button>
      </div>

      <section className="card profile-hero">
        <Avatar name={self.name} tone={self.type} />
        <div className="grow">
          <div className="profile-name-flags">
            <h3>{self.name}</h3>
            <Status yes={self.is4Ps} positive="4Ps Member" negative="Non-4Ps Member" />
            <Status yes={infants > 0} positive="Has Infant" negative={unknown ? 'Infant status unknown' : 'No Infant'} />
            <Status yes={children > 0} positive="Has Child" negative={unknown ? 'Child status unknown' : 'No Child'} />
            <Status yes={self.type === 'pregnant'} positive="Pregnant" negative="Not Pregnant" />
          </div>
          <p className="muted">{self.residentId}{self.address && ` · ${self.address}`}</p>
        </div>
        <button className="btn ghost sm" onClick={() => showRecords('self')}>My health records</button>
      </section>

      {openId && (
        <div id="records-panel">
          <div className="row between"><b>Health records: {openKid?.name ?? self.name}</b><button className="btn ghost sm" onClick={() => setOpenId(null)}>Close</button></div>
          <Records key={openId} resident={self} child={openKid} onChange={reload} />
        </div>
      )}

      <section className="card">
        <h3>Personal information</h3>
        <dl className="info">
          <Info label="Full name">{self.name}</Info>
          <Info label="Email">{user.email}</Info>
          <Info label="Contact number">{self.contact}</Info>
          <Info label="Sitio / Purok">{self.address}</Info>
          <Info label={self.type === 'pregnant' ? 'Expected due date' : 'Birthdate'}>{d10(self.birthdate)}</Info>
          <Info label="Resident ID">{self.residentId}</Info>
        </dl>
      </section>
      <section className="card">
        <h3>Health and membership status</h3>
        <dl className="info status-info">
          <Info label="4Ps member">{self.is4Ps ? 'Yes' : 'No'}</Info>
          <Info label="Pregnant">{self.type === 'pregnant' ? 'Yes' : 'No'}</Info>
          <Info label="Infants (under 1 year)">{String(infants)}</Info>
          <Info label="Children (1–17 years)">{String(children)}</Info>
          <Info label="Has children">{kids.length ? 'Yes' : 'No'}</Info>
          <Info label="Number of children">{String(kids.length)}</Info>
        </dl>
      </section>

      <section className="card">
        <div className="row between"><h3>Children Information ({kids.length})</h3><button className="btn ghost sm" onClick={() => setEditing(true)}>Add or remove</button></div>
        {kids.length === 0 ? <Empty>No children listed. Use “Edit profile” to add one.</Empty> : (
          <div className="kids">
            {kids.map((k) => (
              <div className="kid" key={k._id}>
                <Avatar name={k.name} tone="child" />
                <div><small className="muted">Full name</small><div><b>{k.name}</b> <span className="profile-status neutral">{category(k.birthdate)}</span></div><div className="muted">Birthdate: {d10(k.birthdate)} · {age(k.birthdate)}</div></div>
                <button className="btn ghost sm" onClick={() => showRecords(k._id)}>Health records</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
