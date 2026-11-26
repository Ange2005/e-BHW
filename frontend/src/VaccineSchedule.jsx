import { useState } from 'react'
import { api, useFetch } from '../api'
import '../styles/vaccine.css'
import { Avatar, Empty, Err, Flag, d10 } from './ui'

const LABEL = { done: 'Done', overdue: 'Overdue', soon: 'Due soon', upcoming: 'Upcoming' }
const ageText = (m) => (m < 12 ? `${m} ${m === 1 ? 'month' : 'months'} old` : `${Math.floor(m / 12)} yr${m >= 24 ? 's' : ''}${m % 12 ? ` ${m % 12} mo` : ''} old`)
const when = (d) => (d < 0 ? `${-d} day${d === -1 ? '' : 's'} late` : d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`)
const FILTERS = [['', 'All children'], ['overdue', 'Overdue'], ['soon', 'Due soon']]

export default function VaccineSchedule({ user }) {
  const staff = user.role !== 'resident'
  const { data, error, reload } = useFetch('/vaccinations')
  const [q, setQ] = useState('')
  const [only, setOnly] = useState('')
  const [msg, setMsg] = useState('')
  if (error) return <Err msg={error} />
  if (!data) return <Empty>Loading…</Empty>

  const run = async (fn) => { try { await fn(); setMsg(''); reload() } catch (e) { setMsg(e.message) } }
  const mark = (child, step, names) => run(() => api('/vaccinations', { method: 'POST', body: { childRef: child._id, month: step.month, vaccines: names } }))
  const undo = (id) => confirm('Remove this record? The dose will show as not given.') && run(() => api(`/vaccinations/${id}`, { method: 'DELETE' }))

  const has = (c, status) => c.schedule.some((s) => s.status === status)
  const count = (status) => (status ? data.filter((c) => has(c, status)).length : data.length)
  const list = data.filter((c) => (!q || `${c.name} ${c.parent ?? ''}`.toLowerCase().includes(q.toLowerCase())) && (!only || has(c, only)))

  return (
    <>
      <h2>Vaccination schedule</h2>
      <p className="sub">Program for each child: a visit at 1, 3, 6 and 9 months after birth.{!staff && ' Dalhin ang bata sa health center sa petsang nakasulat.'}</p>

      {staff && (
        <div className="card filters">
          <input type="search" placeholder="Search child or parent" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="roles" role="group" aria-label="Show">
            {FILTERS.map(([k, label]) => <button type="button" key={k} className={only === k ? 'active' : ''} onClick={() => setOnly(k)}>{label} ({count(k)})</button>)}
          </div>
        </div>
      )}
      <Err msg={msg} />

      {list.length === 0 && (
        <div className="card"><Empty>{data.length === 0
          ? (staff ? 'No children are registered yet.' : 'No children listed yet. Add your children in My profile to see their vaccination schedule.')
          : 'No children match.'}</Empty></div>
      )}

      {list.map((c) => (
        <section className="card" key={c._id}>
          <div className="child-head">
            <Avatar name={c.name} tone="child" />
            <div className="grow">
              <h3>{c.name} <Flag r={c} /></h3>
              <p className="muted">{ageText(c.ageMonths)} · born {d10(c.birthdate)}{staff && c.parent && ` · Parent: ${c.parent}`}</p>
            </div>
            <span className="badge">{c.schedule.filter((s) => s.status === 'done').length} of {c.schedule.length} visits done</span>
          </div>

          <div className="milestones">
            {c.schedule.map((s) => {
              const left = s.vaccines.filter((v) => v.status !== 'done')
              return (
                <div key={s.month} className={`ms ${s.status}`}>
                  <div className="ms-head"><b>{s.month} {s.month === 1 ? 'month' : 'months'}</b><span className={`badge v-${s.status}`}>{LABEL[s.status]}</span></div>
                  <p className="muted">{d10(s.dueDate)}{s.status !== 'done' && ` · ${when(s.daysUntil)}`}</p>
                  {s.vaccines.map((v) => (
                    <div className="dose" key={v.name}>
                      <span className={v.status === 'done' ? 'given' : ''}>{v.status === 'done' && '✓ '}{v.name}{v.givenOn && <small> · {d10(v.givenOn)}</small>}</span>
                      {staff && (v.status === 'done'
                        ? <button className="btn ghost sm" onClick={() => undo(v.recordId)}>Undo</button>
                        : <button className="btn ghost sm" onClick={() => mark(c, s, [v.name])}>Mark given</button>)}
                    </div>
                  ))}
                  {staff && left.length > 1 && <button className="btn sm" onClick={() => mark(c, s, left.map((v) => v.name))}>Mark all given</button>}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
