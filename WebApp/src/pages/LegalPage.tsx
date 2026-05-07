import { Link } from "react-router-dom";
import { Card, PageHeader } from "../components/ui";

type LegalKind = "privacy" | "terms";

const effectiveDate = "May 5, 2026";

const copy: Record<LegalKind, { title: string; sections: Array<{ heading: string; body: string }> }> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Data Peak Lift collects",
        body: "Peak Lift stores account details, profile information, workout routines, workout logs, nutrition entries, comments, likes, reports, and related training activity you create in the app.",
      },
      {
        heading: "How data is used",
        body: "Your data is used to run the app, keep your account available across devices, support community features, improve reliability, and respond to safety or support requests.",
      },
      {
        heading: "Account control",
        body: "You can edit your profile from Settings and delete your account from the Delete Account section. Account deletion removes your profile, personal app data, and Supabase auth record.",
      },
      {
        heading: "Support",
        body: "For privacy questions, contact support@peaklift.app.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    sections: [
      {
        heading: "Fitness information",
        body: "Peak Lift helps you plan, track, and share fitness activity. It does not provide medical advice. Use your judgment and consult a qualified professional before changing training, nutrition, or health routines.",
      },
      {
        heading: "User content",
        body: "You are responsible for routines, posts, comments, profile details, and other content you add to Peak Lift. Community features should be used respectfully and lawfully.",
      },
      {
        heading: "Account security",
        body: "You are responsible for keeping your sign-in information secure and for activity that happens through your account.",
      },
      {
        heading: "Support",
        body: "For terms or account questions, contact support@peaklift.app.",
      },
    ],
  },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const page = copy[kind];

  return (
    <>
      <PageHeader title={page.title} description={`Effective ${effectiveDate}`} />
      <Card className="legal-card">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        <Link className="btn btn-secondary" to="/settings">Back to Settings</Link>
      </Card>
    </>
  );
}
