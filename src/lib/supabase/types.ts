// Hand-maintained types mirroring the SQL schema in supabase/migrations.
// Keep in sync with the migrations. Regenerate with the Supabase CLI/MCP once
// a live project is connected (`supabase gen types typescript`).

export type CapsuleStatus = "draft" | "active" | "completed";
export type DripInterval = "daily" | "weekly";
export type PhotoStatus = "pending" | "released";
export type ReactionType = "like" | "fire" | "laugh" | "love";
export type NoteSource = "text" | "voice";
export type MemberRole = "owner" | "member";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export type Capsule = {
  id: string;
  name: string;
  cover_photo_id: string | null;
  owner_id: string;
  status: CapsuleStatus;
  drip_start_at: string | null;
  drip_end_at: string | null;
  drip_interval: DripInterval;
  photos_per_release: number;
  book_total_cents: number | null;
  created_at: string;
}

export type CapsuleMember = {
  capsule_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export type CapsuleInvite = {
  id: string;
  capsule_id: string;
  token: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
}

export type Photo = {
  id: string;
  capsule_id: string;
  uploader_id: string;
  storage_path: string;
  thumb_path: string | null;
  taken_at: string | null;
  width: number | null;
  height: number | null;
  quality_score: number;
  status: PhotoStatus;
  release_at: string | null;
  released_at: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  location_visible: boolean;
  created_at: string;
}

export type Reaction = {
  id: string;
  photo_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export type Comment = {
  id: string;
  photo_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export type PhotoMood = {
  id: string;
  photo_id: string;
  user_id: string;
  mood: string;
  created_at: string;
}

export type MomentNote = {
  id: string;
  photo_id: string;
  user_id: string;
  body: string;
  source: NoteSource;
  created_at: string;
}

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type BookIntent = {
  id: string;
  capsule_id: string;
  user_id: string;
  share_cents: number;
  created_at: string;
}

export type InvitePreview = {
  capsule_id: string;
  capsule_name: string;
  capsule_status: CapsuleStatus;
  inviter_name: string;
  inviter_avatar: string | null;
  member_count: number;
  expired: boolean;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      capsules: Table<Capsule>;
      capsule_members: Table<CapsuleMember>;
      capsule_invites: Table<CapsuleInvite>;
      photos: Table<Photo>;
      reactions: Table<Reaction>;
      comments: Table<Comment>;
      photo_moods: Table<PhotoMood>;
      moment_notes: Table<MomentNote>;
      push_subscriptions: Table<PushSubscriptionRow>;
      book_intents: Table<BookIntent>;
    };
    Views: { [_ in never]: never };
    Functions: {
      get_invite_preview: {
        Args: { p_token: string };
        Returns: InvitePreview[];
      };
      redeem_invite: {
        Args: { p_token: string };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
