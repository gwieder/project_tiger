import { NavLink, useLocation } from 'react-router-dom'
import {
  Banknote,
  Building2,
  FileText,
  Heart,
  Home,
  Landmark,
  MessageSquare,
  Percent,
  Plug,
  Receipt,
  Scale,
  Settings,
  Ticket,
  Umbrella,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const ICON_SIZE = 15
const ICON_STROKE = 1.6

function Icon({ as: As }: { as: LucideIcon }) {
  return <As size={ICON_SIZE} strokeWidth={ICON_STROKE} className="nav-icon" aria-hidden="true" />
}

const financials = [
  { to: '/financials/balance-sheet', label: 'Balance Sheet' },
  { to: '/financials/income-statement', label: 'Income Statement' },
  { to: '/financials/cash-flow', label: 'Cash Flow Statement' },
]

const cashChildren = [
  { to: '/cash-management/forecast', label: 'Forecast' },
  { to: '/cash-management/spending', label: 'Spending' },
]

const modules: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/credit', label: 'Credit & Facilities', icon: Landmark },
  { to: '/fees', label: 'Fees', icon: Percent },
  { to: '/entities', label: 'Entities & Accounts', icon: Building2 },
  { to: '/tax', label: 'Tax', icon: Receipt },
  { to: '/trusts', label: 'Trusts & Estates', icon: Scale },
  { to: '/insurance', label: 'Insurance', icon: Umbrella },
  { to: '/philanthropy', label: 'Philanthropy', icon: Heart },
  { to: '/memberships', label: 'Memberships', icon: Ticket },
]

/** the Administration block — grouped under one heading rather than divider-separated */
const admin: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/access', label: 'Access', icon: Users },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Rail() {
  const { pathname } = useLocation()
  const financialsOpen = pathname.startsWith('/financials')
  const cashOpen = pathname.startsWith('/cash-management')

  return (
    <nav className="rail">
      <div className="wordmark">Project Tiger</div>

      <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Icon as={Home} />
        Account Home
      </NavLink>

      <NavLink
        to="/holdings"
        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
      >
        <Icon as={Wallet} />
        Holdings
      </NavLink>

      <NavLink
        to="/financials/balance-sheet"
        className={financialsOpen ? 'nav-item active' : 'nav-item'}
      >
        <Icon as={FileText} />
        Consolidated Financials
        <span className="nav-caret">{financialsOpen ? '▾' : '▸'}</span>
      </NavLink>
      {financialsOpen &&
        financials.map((f) => (
          <NavLink
            key={f.to}
            to={f.to}
            className={({ isActive }) => (isActive ? 'nav-item child active' : 'nav-item child')}
          >
            {f.label}
          </NavLink>
        ))}

      <NavLink
        to="/cash-management/forecast"
        className={cashOpen ? 'nav-item active' : 'nav-item'}
      >
        <Icon as={Banknote} />
        Cash Management
        <span className="nav-caret">{cashOpen ? '▾' : '▸'}</span>
      </NavLink>
      {cashOpen &&
        cashChildren.map((c) => (
          <NavLink
            key={c.to}
            to={c.to}
            className={({ isActive }) => (isActive ? 'nav-item child active' : 'nav-item child')}
          >
            {c.label}
          </NavLink>
        ))}

      {modules.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          <Icon as={m.icon} />
          {m.label}
        </NavLink>
      ))}

      <div className="nav-divider" />
      <NavLink
        to="/communication"
        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
      >
        <Icon as={MessageSquare} />
        Communication
      </NavLink>

      <div className="nav-divider" />
      <div className="nav-section">Administration</div>
      {admin.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          <Icon as={t.icon} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
