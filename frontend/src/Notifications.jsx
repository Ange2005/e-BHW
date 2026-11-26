import { api, useFetch } from '../api'
import { Empty, Err } from './ui'

export default function Notifications() {
  const { data, error, reload } = useFetch('/notifications')
  const read = (n) => !n.read && api(`/notifications/${n._id}/read`, { method: 'PATCH' }).then(reload)
  return (
    <>
      <h2>Notifications</h2>
      <Err msg={error} />
      <div className="card">
        {!data ? <Empty>Loading…</Empty> : data.length === 0 ? <Empty>No notifications yet.</Empty> : (
          <ul className="list">
            {data.map((n) => (
              <li key={n._id} className={n.read ? '' : 'unread'} onClick={() => read(n)}>
                <span>{n.message}</span>
                <span className="muted">{new Date(n.createdAt).toLocaleString('en-PH')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
