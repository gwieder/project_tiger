import { Navigate, Route, Routes } from 'react-router-dom'
import Rail from './components/Rail'
import AccountHome from './pages/AccountHome'
import BalanceSheet from './pages/BalanceSheet'
import IncomeStatement from './pages/IncomeStatement'
import CashFlowStatement from './pages/CashFlowStatement'
import CashManagement from './pages/CashManagement'
import Spending from './pages/Spending'
import Holdings from './pages/Holdings'
import Exposure from './pages/Exposure'
import Credit from './pages/Credit'
import Fees from './pages/Fees'
import FacilityDetail from './pages/FacilityDetail'
import Entities from './pages/Entities'
import EntityDetail from './pages/EntityDetail'
import PositionDetail from './pages/PositionDetail'
import Module from './pages/Module'

export default function App() {
  return (
    <div className="app">
      <Rail />
      <main className="main">
        <Routes>
          <Route path="/" element={<AccountHome />} />
          <Route path="/financials" element={<Navigate to="/financials/balance-sheet" replace />} />
          <Route path="/financials/balance-sheet" element={<BalanceSheet />} />
          <Route path="/financials/income-statement" element={<IncomeStatement />} />
          <Route path="/financials/cash-flow" element={<CashFlowStatement />} />
          <Route path="/cash-management" element={<Navigate to="/cash-management/forecast" replace />} />
          <Route path="/cash-management/forecast" element={<CashManagement />} />
          <Route path="/cash-management/spending" element={<Spending />} />
          <Route path="/spending" element={<Navigate to="/cash-management/spending" replace />} />
          <Route path="/credit" element={<Credit />} />
          <Route path="/credit/:id" element={<FacilityDetail />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/holdings/exposure" element={<Exposure />} />
          <Route path="/holdings/:id" element={<PositionDetail />} />
          <Route path="/entities" element={<Entities />} />
          <Route path="/entities/:id" element={<EntityDetail />} />
          <Route path="/tax" element={<Module name="Tax" />} />
          <Route path="/trusts" element={<Module name="Trusts & Estates" />} />
          <Route path="/insurance" element={<Module name="Insurance" />} />
          <Route path="/philanthropy" element={<Module name="Philanthropy" />} />
          <Route path="/memberships" element={<Module name="Memberships" />} />
          <Route path="/communication" element={<Module name="Communication" />} />
          <Route path="/access" element={<Module name="Access" />} />
          <Route path="/integrations" element={<Module name="Integrations" />} />
          <Route path="/settings" element={<Module name="Settings" />} />
        </Routes>
      </main>
    </div>
  )
}
