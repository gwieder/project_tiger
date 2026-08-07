import TopBar from '../components/TopBar'

const blurbs: Record<string, string> = {
  Holdings:
    'Fund investments with marks from portals, the capital call schedule, wealth platform positions, art and personal assets.',
  'Entities & Accounts':
    'Every bank account, credit card, line of credit, loan and mortgage — filed under the entity that owns it. Cash Management borrows these records for its time-based view.',
  Tax: 'K-1 tracker by fund by year, estimated payment schedule and historical filings.',
  'Trusts & Estates': 'Trust structures, trustees, distribution provisions and governing documents.',
  Insurance: 'Policies, coverage limits, premium schedule and renewal calendar.',
  Philanthropy: 'Foundation grants, pledge schedule, donor-advised funds and giving history.',
  Memberships: 'Clubs, boards and subscriptions — dues schedule, renewal dates and who holds each membership.',
  Communication: 'Your family office team, message threads with your accountant, and the assistant.',
  Access: 'Who can see what — family members, staff and advisors, each with per-entity and per-module permissions.',
  Integrations:
    'Bank and card feeds, fund portals, the wealth platform and accounting system connections.',
  Settings: 'Household profile, user access, entity permissions and notification preferences.',
}

export default function Module({ name }: { name: string }) {
  return (
    <>
      <TopBar title={name} sub="Module in progress" />
      <div className="page">
        <div className="stub">
          <h2>{name}</h2>
          <p>{blurbs[name] ?? 'This module is part of the roadmap.'}</p>
        </div>
      </div>
    </>
  )
}
