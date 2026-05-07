import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { Button, Card, Input, PageHeader, Textarea } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import { friendlyError } from "../utils/errors";

export default function Settings() {
  const { user, profile, deleteAccount, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUsername(profile?.username || "");
    setBio(profile?.bio || "");
    setGoal(profile?.goal || "");
    setPhotoURL(profile?.photoURL || "");
  }, [profile]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    try {
      const displayName = username.trim() || "Peak Lifter";
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.uid,
          username: displayName,
          display_name: displayName,
          bio: bio.trim(),
          goal: goal.trim(),
          photo_url: photoURL.trim() || null,
        });
      if (error) throw error;
      await refreshProfile();
      setMessage("Settings saved.");
    } catch (saveError) {
      setMessage(friendlyError(saveError, "Unable to save settings."));
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    if (!window.confirm("Delete your Peak Lift account and personal app data? This cannot be undone.")) return;
    setDeleting(true);
    setMessage("");
    try {
      await deleteAccount();
    } catch (error) {
      const fallback = "Account deletion failed. Sign out, sign back in, and try again.";
      setMessage(error instanceof Error ? `${fallback} ${error.message}` : fallback);
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Profile and training preferences." />
      <Card>
        <form onSubmit={save} className="form-stack">
          <label>Username<Input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Photo URL<Input value={photoURL} onChange={(event) => setPhotoURL(event.target.value)} /></label>
          <label>Goal<Input value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
          <label>Bio<Textarea value={bio} onChange={(event) => setBio(event.target.value)} /></label>
          {message ? <p className={message.includes("failed") ? "form-error" : "form-success"}>{message}</p> : null}
          <Button type="submit" disabled={saving}><Save size={18} /> {saving ? "Saving..." : "Save Settings"}</Button>
        </form>
      </Card>
      <Card className="danger-zone">
        <div>
          <h2>Privacy and Support</h2>
          <p>Review app policies or contact support before changing account status.</p>
        </div>
        <div className="button-row">
          <Link className="btn btn-secondary" to="/privacy">Privacy Policy</Link>
          <Link className="btn btn-secondary" to="/terms">Terms</Link>
          <a className="btn btn-secondary" href="mailto:support@peaklift.app">Support</a>
        </div>
      </Card>
      <Card className="danger-zone">
        <div>
          <h2>Delete Account</h2>
          <p>Remove your profile, routines, nutrition logs, workout posts, comments, sign-in account, and Supabase auth record.</p>
        </div>
        <Button variant="danger" onClick={removeAccount} disabled={deleting}>
          <Trash2 size={18} /> {deleting ? "Deleting..." : "Delete Account"}
        </Button>
      </Card>
    </>
  );
}
