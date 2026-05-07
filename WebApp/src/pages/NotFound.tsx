import { Link } from "react-router-dom";
import { Button, EmptyState } from "../components/ui";

export default function NotFound() {
  return <EmptyState title="Page not found" body="That Peak Lift screen does not exist." action={<Link to="/dashboard"><Button>Go to Dashboard</Button></Link>} />;
}
