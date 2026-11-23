import KpiCards from '../components/dashboard/KpiCards';
import ActiveOrdersTable from '../components/dashboard/ActiveOrdersTable';
import TodayProduction from '../components/dashboard/TodayProduction';
import CalendarPreview from '../components/dashboard/CalendarPreview';
import DeadlineWatch from '../components/dashboard/DeadlineWatch';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard__kpis">
        <KpiCards />
      </div>
      <div className="dashboard__table">
        <ActiveOrdersTable />
      </div>
      <div className="dashboard__today">
        <TodayProduction />
      </div>
      <div className="dashboard__calendar">
        <CalendarPreview />
      </div>
      <div className="dashboard__deadlines">
        <DeadlineWatch />
      </div>
    </div>
  );
}
