import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const profile = await db.profile.findFirstOrThrow();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-lg">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Used to score job matches and generate tailored CVs.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
